import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { RESOLVE_CHECK_QUERY } from '../src/queries.js';
import {
  CHECK_CHECKING,
  CHECK_IDLE,
  CHECK_NO_RIGHT,
  CHECK_OK,
  CHECK_REFUSED,
  CHECK_UNAVAILABLE,
  checkBlocksApproval,
  checkBlocksDecision,
  checkRefusalText,
  resolveCheckState,
  resolveCheckVariables,
} from '../src/util/resolveCheck.js';

const fr = JSON.parse(readFileSync(new URL('../src/translations/fr.json', import.meta.url), 'utf8'));

const CANDIDATE = '11111111-1111-4111-8111-111111111111';
const A = '22222222-2222-4222-8222-222222222222';
const B = '33333333-3333-4333-8333-333333333333';
const pair = { subjectA: A, subjectB: B };

test('the query names the backend field, its three arguments and the three result fields', () => {
  assert.match(RESOLVE_CHECK_QUERY, /\$candidateId: UUID!, \$decision: String!, \$keep: String/);
  assert.match(
    RESOLVE_CHECK_QUERY,
    /duplicateCandidateResolveCheck\(candidateId: \$candidateId, decision: \$decision, keep: \$keep\)/,
  );
  assert.match(RESOLVE_CHECK_QUERY, /\{\s*ok code message\s*\}/);
});

test('a merge is checked once a record to keep of the pair is chosen', () => {
  assert.deepEqual(
    resolveCheckVariables({ candidateId: CANDIDATE, decision: 'same', keep: B, ...pair }),
    { candidateId: CANDIDATE, decision: 'same', keep: B },
  );
  assert.equal(resolveCheckVariables({ candidateId: CANDIDATE, decision: 'same', keep: null, ...pair }), null);
  assert.equal(resolveCheckVariables({ candidateId: CANDIDATE, decision: 'same', keep: 'other', ...pair }), null);
});

test('a dismissal is checked without a record to keep', () => {
  assert.deepEqual(
    resolveCheckVariables({ candidateId: CANDIDATE, decision: 'different', keep: B, ...pair }),
    { candidateId: CANDIDATE, decision: 'different', keep: null },
  );
});

test('nothing is checked without a candidate or a decision', () => {
  assert.equal(resolveCheckVariables({ candidateId: null, decision: 'different', ...pair }), null);
  assert.equal(resolveCheckVariables({ candidateId: 'not-a-uuid', decision: 'different', ...pair }), null);
  assert.equal(resolveCheckVariables({ candidateId: CANDIDATE, decision: null, ...pair }), null);
  assert.equal(resolveCheckVariables({ candidateId: CANDIDATE, decision: 'maybe', ...pair }), null);
});

const variables = { candidateId: CANDIDATE, decision: 'different', keep: null };
const settled = (extra) => ({
  variables, resolvedFor: JSON.stringify(variables), isLoading: false, data: null, errors: null, ...extra,
});
const answer = (check) => ({ data: { duplicateCandidateResolveCheck: check } });

test('without variables the check is idle and blocks nothing', () => {
  const state = resolveCheckState({ variables: null, isLoading: false, data: null, errors: null });
  assert.deepEqual(state, { status: CHECK_IDLE });
  assert.equal(checkBlocksApproval(state), false);
});

test('an answer that is not for the current variables is still being checked', () => {
  assert.equal(resolveCheckState(settled({ resolvedFor: null })).status, CHECK_CHECKING);
  assert.equal(
    resolveCheckState(settled({ resolvedFor: JSON.stringify({ ...variables, decision: 'same' }) })).status,
    CHECK_CHECKING,
  );
  assert.equal(resolveCheckState(settled({ isLoading: true })).status, CHECK_CHECKING);
  assert.equal(checkBlocksApproval({ status: CHECK_CHECKING }), true);
});

test('an accepted decision is ok', () => {
  const state = resolveCheckState(settled(answer({ ok: true, code: null, message: null })));
  assert.deepEqual(state, { status: CHECK_OK });
  assert.equal(checkBlocksApproval(state), false);
});

test('a refused decision carries the code and the server message and blocks the approval', () => {
  const state = resolveCheckState(settled(answer({
    ok: false, code: 'deduplication.resolve.subject_deleted', message: 'One of the two records is deleted.',
  })));
  assert.deepEqual(state, {
    status: CHECK_REFUSED, code: 'deduplication.resolve.subject_deleted', message: 'One of the two records is deleted.',
  });
  assert.equal(checkBlocksApproval(state), true);
});

test('a check refused for lack of rights reports no right and blocks the approval', () => {
  const state = resolveCheckState(settled({ errors: [{ message: 'Unauthorized' }], permissionRefused: true }));
  assert.deepEqual(state, { status: CHECK_NO_RIGHT });
  assert.equal(checkBlocksApproval(state), true);
});

test('a check that failed otherwise is unavailable and blocks nothing', () => {
  [
    settled({ errors: [{ message: 'DuplicateCandidate matching query does not exist.' }] }),
    settled({ data: null }),
    settled(answer(null)),
  ].forEach((input) => {
    const state = resolveCheckState(input);
    assert.deepEqual(state, { status: CHECK_UNAVAILABLE });
    assert.equal(checkBlocksApproval(state), false);
  });
});

test('the refusal is shown in the user language, then as the server message, then as the code', () => {
  const refused = (code, message) => ({ status: CHECK_REFUSED, code, message });
  assert.equal(
    checkRefusalText(refused('deduplication.resolve.pair_already_merged', 'English'), fr),
    fr['deduplication.resolve.refusal.pair_already_merged'],
  );
  assert.equal(checkRefusalText(refused('deduplication.resolve.unheard_of', 'Readable text'), fr), 'Readable text');
  assert.equal(checkRefusalText(refused('deduplication.resolve.unheard_of', null), fr), 'deduplication.resolve.unheard_of');
  assert.equal(checkRefusalText({ status: CHECK_OK }, fr), null);
});

test('a decision on the candidate page waits for a running or refusing check, not for a forbidden one', () => {
  assert.equal(checkBlocksDecision({ status: CHECK_CHECKING }), true);
  assert.equal(checkBlocksDecision({ status: CHECK_REFUSED, code: 'x', message: 'y' }), true);
  [CHECK_IDLE, CHECK_OK, CHECK_NO_RIGHT, CHECK_UNAVAILABLE].forEach((status) => {
    assert.equal(checkBlocksDecision({ status }), false, status);
  });
});
