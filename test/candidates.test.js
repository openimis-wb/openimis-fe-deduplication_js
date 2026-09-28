import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildResolveInput,
  candidateFilterFragment,
  candidateFilters,
  canCreateReviewTasks,
  canResolve,
  evidenceRows,
  hasOpenTask,
  keepOptions,
  scoreLabel,
  siblingState,
} from '../src/util/candidates.js';
import {
  hasRight, parseJson, toUuid, withStableOrder,
} from '../src/util/gql.js';

const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const C = '33333333-3333-4333-8333-333333333333';
const CANDIDATE_UUID = '44444444-4444-4444-8444-444444444444';
const candidate = {
  id: 'rel-1', status: 'OPEN', subjectA: A, subjectB: B,
};

function literalValue(fragment) {
  const literal = fragment.slice(fragment.indexOf(':') + 1).trim();
  return JSON.parse(literal);
}

test('candidateFilters builds one fragment per set value', () => {
  assert.deepEqual(candidateFilters({ status: 'OPEN' }), ['status: "OPEN"']);
  assert.deepEqual(candidateFilters({
    status: '', kind: null, subjectId: undefined, dateCreated_Gte: '',
  }), []);
  assert.deepEqual(candidateFilters(null), []);
  assert.deepEqual(candidateFilters({ unknown: 'x' }), []);
});

test('candidateFilters escapes quotes and backslashes in the subject id', () => {
  const raw = 'a"b\\c';
  const [fragment] = candidateFilters({ subjectId: raw });
  assert.equal(fragment, 'subjectId: "a\\"b\\\\c"');
  assert.equal(literalValue(fragment), raw);
});

test('date filters widen a date to the whole day', () => {
  assert.equal(candidateFilterFragment('dateCreated_Gte', '2026-09-01'), 'dateCreated_Gte: "2026-09-01T00:00:00"');
  assert.equal(
    candidateFilterFragment('dateCreated_Lte', '2026-09-01'),
    'dateCreated_Lte: "2026-09-01T23:59:59.999999"',
  );
});

test('withStableOrder appends id once', () => {
  assert.deepEqual(
    withStableOrder(['first: 10', 'orderBy: ["-dateCreated"]']),
    ['first: 10', 'orderBy: ["-dateCreated","id"]'],
  );
  assert.deepEqual(withStableOrder(['orderBy: ["-dateCreated","id"]']), ['orderBy: ["-dateCreated","id"]']);
  assert.deepEqual(withStableOrder(['orderBy: ["-id"]']), ['orderBy: ["-id"]']);
  assert.deepEqual(withStableOrder(['first: 10']), ['first: 10']);
});

test('buildResolveInput sends an explicit keep from the pair', () => {
  const inputA = buildResolveInput({ uuid: CANDIDATE_UUID, decision: 'same', keep: A }, candidate);
  assert.match(inputA, new RegExp(`keep: "${A}"`));
  assert.match(inputA, new RegExp(`id: "${CANDIDATE_UUID}"`));
  const inputB = buildResolveInput({ uuid: CANDIDATE_UUID, decision: 'same', keep: B }, candidate);
  assert.match(inputB, new RegExp(`keep: "${B}"`));
  assert.throws(
    () => buildResolveInput({ uuid: CANDIDATE_UUID, decision: 'same', keep: C }, candidate),
    { message: 'keep_not_in_pair' },
  );
  assert.throws(
    () => buildResolveInput({ uuid: CANDIDATE_UUID, decision: 'same' }, candidate),
    { message: 'keep_not_in_pair' },
  );
});

test('buildResolveInput omits keep for different and rejects unknown decisions', () => {
  const input = buildResolveInput({
    uuid: CANDIDATE_UUID, decision: 'different', keep: A, note: 'l\'agent a dit "non"\nfin',
  }, candidate);
  assert.doesNotMatch(input, /keep:/);
  const noteLine = input.split('\n').find((line) => line.startsWith('note:'));
  assert.equal(literalValue(noteLine), 'l\'agent a dit "non"\nfin');
  assert.throws(
    () => buildResolveInput({ uuid: CANDIDATE_UUID, decision: 'merge', keep: A }, candidate),
    { message: 'invalid_decision' },
  );
  assert.throws(
    () => buildResolveInput({ uuid: 'not-a-uuid', decision: 'different' }, candidate),
    { message: 'invalid_id' },
  );
});

test('canResolve needs an OPEN candidate and right 172003, as number or string', () => {
  assert.equal(canResolve(candidate, ['172003']), true);
  assert.equal(canResolve(candidate, [172003]), true);
  assert.equal(canResolve({ ...candidate, status: 'CONFIRMED' }, [172003]), false);
  assert.equal(canResolve({ ...candidate, status: 'DISMISSED' }, [172003]), false);
  assert.equal(canResolve(candidate, [172005]), false);
  assert.equal(canResolve(candidate, undefined), false);
});

test('canResolve refuses a candidate whose review task is still open', () => {
  assert.equal(canResolve({ ...candidate, task: { id: 't1', status: 'RECEIVED' } }, [172003]), false);
  assert.equal(canResolve({ ...candidate, task: { id: 't1', status: 'ACCEPTED' } }, [172003]), false);
  assert.equal(canResolve({ ...candidate, task: { id: 't1', status: 'COMPLETED' } }, [172003]), true);
  assert.equal(canResolve({ ...candidate, task: { id: 't1', status: 'FAILED' } }, [172003]), true);
  assert.equal(canResolve({ ...candidate, task: null }, [172003]), true);
});

test('hasOpenTask is true only for a RECEIVED or ACCEPTED task', () => {
  assert.equal(hasOpenTask({ task: { status: 'RECEIVED' } }), true);
  assert.equal(hasOpenTask({ task: { status: 'ACCEPTED' } }), true);
  assert.equal(hasOpenTask({ task: { status: 'COMPLETED' } }), false);
  assert.equal(hasOpenTask({ task: null }), false);
  assert.equal(hasOpenTask(null), false);
});

test('canCreateReviewTasks needs every selected row OPEN without an open task', () => {
  const open = { ...candidate, task: null };
  const closedTask = { ...candidate, id: 'rel-2', task: { id: 't2', status: 'FAILED' } };
  assert.equal(canCreateReviewTasks([open]), true);
  assert.equal(canCreateReviewTasks([open, closedTask]), true);
  assert.equal(canCreateReviewTasks([]), false);
  assert.equal(canCreateReviewTasks(null), false);
  assert.equal(canCreateReviewTasks([open, { ...candidate, id: 'rel-3', status: 'CONFIRMED' }]), false);
  assert.equal(canCreateReviewTasks([open, { ...candidate, id: 'rel-4', status: 'DISMISSED' }]), false);
  assert.equal(canCreateReviewTasks([open, { ...candidate, id: 'rel-5', task: { id: 't5', status: 'RECEIVED' } }]), false);
});

test('keepOptions lists the pair', () => {
  assert.deepEqual(keepOptions(candidate), [A, B]);
  assert.deepEqual(keepOptions(null), []);
});

test('siblingState locks keep to the subject a confirmed sibling kept', () => {
  const siblings = [
    candidate,
    {
      id: 'rel-2', status: 'CONFIRMED', subjectA: A, subjectB: B,
    },
  ];
  const deleted = siblingState(candidate, siblings, { [A]: { isDeleted: true }, [B]: { isDeleted: false } });
  assert.equal(deleted.mergedAlready, true);
  assert.equal(deleted.keptId, B);
  assert.equal(deleted.conflictingKeep(A), true);
  assert.equal(deleted.conflictingKeep(B), false);

  const retired = siblingState(candidate, siblings, { [A]: { isDeleted: true, retiredInto: B } });
  assert.equal(retired.keptId, B);

  const unreadable = siblingState(candidate, siblings, {});
  assert.equal(unreadable.mergedAlready, true);
  assert.equal(unreadable.keptId, null);
  assert.equal(unreadable.conflictingKeep(A), true);
  assert.equal(unreadable.conflictingKeep(B), true);
});

test('siblingState ignores OPEN and DISMISSED siblings', () => {
  const siblings = [
    {
      id: 'rel-2', status: 'OPEN', subjectA: A, subjectB: B,
    },
    {
      id: 'rel-3', status: 'DISMISSED', subjectA: A, subjectB: B,
    },
  ];
  const state = siblingState(candidate, siblings, { [A]: { isDeleted: true } });
  assert.equal(state.mergedAlready, false);
  assert.equal(state.keptId, null);
  assert.equal(state.conflictingKeep(A), false);
});

test('evidenceRows reads column evidence as a string or an object', () => {
  const evidence = { columns: { first_name: 'A', dob: '2000-01-01' } };
  const expected = [['first_name', 'A'], ['dob', '2000-01-01']];
  assert.deepEqual(evidenceRows({ evidence }), expected);
  assert.deepEqual(evidenceRows({ evidence: JSON.stringify(evidence) }), expected);
});

test('evidenceRows shows biometric metadata and never template ids', () => {
  const rows = evidenceRows({
    evidence: JSON.stringify({
      modality: 'face', provider: 'fake', model_name: 'm1', template_a: 't-a', template_b: 't-b',
    }),
  });
  assert.deepEqual(rows, [['modality', 'face'], ['provider', 'fake'], ['model_name', 'm1']]);
  assert.ok(!JSON.stringify(rows).includes('t-a'));
});

test('evidenceRows puts an unknown shape in one JSON row', () => {
  assert.deepEqual(evidenceRows({ evidence: { foo: 1 } }), [['evidence', '{"foo":1}']]);
  assert.deepEqual(evidenceRows({ evidence: null }), []);
});

test('scoreLabel prints three decimals or a dash', () => {
  assert.equal(scoreLabel({ score: null }), '—');
  assert.equal(scoreLabel({ score: 0.62345 }), '0.623');
  assert.equal(scoreLabel({}), '—');
});

test('toUuid accepts a raw UUID or a relay global id', () => {
  assert.equal(toUuid(A), A);
  assert.equal(toUuid(btoa(`DuplicateCandidateGQLType:${A}`)), A);
  assert.equal(toUuid('garbage!'), null);
  assert.equal(toUuid(null), null);
});

test('hasRight compares numbers and strings alike', () => {
  assert.equal(hasRight([174004], '174004'), true);
  assert.equal(hasRight(['174004'], 174004), true);
  assert.equal(hasRight([174005], 174004), false);
  assert.equal(hasRight(null, 174004), false);
});

test('parseJson accepts text or parsed values', () => {
  assert.deepEqual(parseJson('{"a":1}'), { a: 1 });
  assert.deepEqual(parseJson({ a: 1 }), { a: 1 });
  assert.equal(parseJson('not json'), null);
  assert.equal(parseJson(undefined), null);
});
