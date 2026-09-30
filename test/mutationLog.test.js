import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mutationFailureText, mutationLogFailure, refusalMessageKey } from '../src/util/mutationLog.js';

const read = (name) => JSON.parse(readFileSync(new URL(`../src/translations/${name}`, import.meta.url), 'utf8'));
const en = read('en.json');
const fr = read('fr.json');

// The refusal codes deduplication.services.REFUSAL_MESSAGES covers (openimis-be-deduplication_py).
const SERVER_REFUSALS = [
  'deduplication.resolve.keep_not_in_pair',
  'deduplication.resolve.subject_deleted',
  'deduplication.resolve.keep_contradicts_merge',
  'deduplication.resolve.retired_subject_enrolled',
  'deduplication.resolve.pair_already_merged',
  'deduplication.resolve.decision_missing',
];

const failedLog = (entry) => ({ status: 1, error: JSON.stringify([entry]) });
const refusal = {
  message: 'One of the two records is already deleted; they can no longer be merged.',
  code: 'deduplication.resolve.subject_deleted',
  detail: 'deduplication.resolve.subject_deleted',
};

test('mutationLogFailure reads the first error of a failed log', () => {
  assert.deepEqual(mutationLogFailure(failedLog(refusal)), refusal);
  assert.deepEqual(
    mutationLogFailure(failedLog({ message: 'deduplication.mutation.failed_to_resolve_duplicate', detail: 'boom' })),
    { message: 'deduplication.mutation.failed_to_resolve_duplicate', code: null, detail: 'boom' },
  );
  assert.deepEqual(mutationLogFailure({ status: 1, error: 'not json' }), { message: 'not json', code: null, detail: null });
});

test('mutationLogFailure ignores a log that did not fail', () => {
  assert.equal(mutationLogFailure({ status: 2, error: null }), null);
  assert.equal(mutationLogFailure({ status: 1, error: null }), null);
  assert.equal(mutationLogFailure(null), null);
});

test('refusalMessageKey maps a resolve refusal code to a module key', () => {
  assert.equal(refusalMessageKey('deduplication.resolve.subject_deleted'), 'resolve.refusal.subject_deleted');
  assert.equal(refusalMessageKey('deduplication.mutation.candidate_not_open'), null);
  assert.equal(refusalMessageKey(null), null);
});

test('every server refusal code has an English and a French text', () => {
  SERVER_REFUSALS.forEach((code) => {
    const key = `deduplication.${refusalMessageKey(code)}`;
    assert.ok(en[key], `en ${key}`);
    assert.ok(fr[key], `fr ${key}`);
  });
});

test('mutationFailureText translates a refusal code', () => {
  assert.equal(
    mutationFailureText(failedLog(refusal), fr),
    fr['deduplication.resolve.refusal.subject_deleted'],
  );
});

test('mutationFailureText falls back to the server message, then the detail', () => {
  const unknown = { message: 'Readable server text', code: 'deduplication.resolve.unheard_of', detail: 'x' };
  assert.equal(mutationFailureText(failedLog(unknown), fr), 'Readable server text');
  assert.equal(
    mutationFailureText(failedLog({ message: 'deduplication.mutation.failed_to_resolve_duplicate', detail: 'boom' }), fr),
    'boom',
  );
  assert.equal(mutationFailureText({ status: 2 }, fr), null);
});
