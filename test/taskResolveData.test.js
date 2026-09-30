import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  TASK_FORM_NO_RIGHT,
  TASK_FORM_OPEN,
  TASK_FORM_RECORDED,
  TASK_FORM_RESOLVED_ELSEWHERE,
  buildTaskResolution,
  encodeAdditionalData,
  finalResolutions,
  formStateFromResolution,
  otherResolutions,
  ownResolution,
  canSubmitTaskResolution,
  taskAwaitsDecision,
  taskAdditionalData,
  taskFormMode,
} from '../src/util/taskResolveData.js';

const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const C = '33333333-3333-4333-8333-333333333333';
const businessData = { id: 'c-1', subject_a: A, subject_b: B };

test('encodeAdditionalData survives a GraphQL string literal round trip', () => {
  const input = { decision: 'same', keep: 'uuid', note: 'l\'agent a dit "oui"\\n\n éè' };
  const s = encodeAdditionalData(input);
  assert.deepEqual(JSON.parse(JSON.parse(`"${s}"`)), input);
  assert.ok(!/(^|[^\\])"/.test(s), 'every quote inside the literal body is escaped');
});

const ME = '0b8a4f62-51a7-4d1e-9c55-2d0f6f6d1a10';
const OTHER = '7c1d90e4-8a0b-4f3e-b2a6-4e5d7c9b3f21';
const storedBy = (entries) => ({ additional_resolve_data: entries });

test('ownResolution reads the entry keyed by the given user id, never the first one', () => {
  const jsonExt = storedBy({
    [OTHER]: { decision: 'different', note: 'not mine' },
    [ME]: { decision: 'same', keep: 'x', note: 'mine' },
  });
  assert.deepEqual(ownResolution(jsonExt, ME), { decision: 'same', keep: 'x', note: 'mine' });
  assert.deepEqual(ownResolution(jsonExt, OTHER), { decision: 'different', note: 'not mine' });
});

test('ownResolution is null without a user id, an entry, or a usable entry', () => {
  const jsonExt = storedBy({ [OTHER]: { decision: 'different' } });
  assert.equal(ownResolution(jsonExt, ME), null);
  assert.equal(ownResolution(jsonExt, null), null);
  assert.equal(ownResolution(jsonExt, undefined), null);
  assert.equal(ownResolution(null, ME), null);
  assert.equal(ownResolution({}, ME), null);
  assert.equal(ownResolution(true, ME), null);
  assert.equal(ownResolution(storedBy({ [ME]: 'x' }), ME), null);
  assert.equal(ownResolution(storedBy({}), ME), null);
});

test('otherResolutions lists the entries of the other approvers with their user id', () => {
  const jsonExt = storedBy({
    [ME]: { decision: 'same', keep: 'x' },
    [OTHER]: { decision: 'different', note: 'n' },
    bogus: 'not an entry',
  });
  assert.deepEqual(otherResolutions(jsonExt, ME), [{ userId: OTHER, resolution: { decision: 'different', note: 'n' } }]);
  assert.equal(otherResolutions(jsonExt, null).length, 2);
  assert.deepEqual(otherResolutions(null, ME), []);
  assert.deepEqual(otherResolutions(storedBy({ [ME]: { decision: 'same' } }), ME), []);
});

test('finalResolutions shows the stored entries as final only once the task is COMPLETED', () => {
  const jsonExt = storedBy({ [ME]: { decision: 'same', keep: 'x' }, [OTHER]: { decision: 'different' } });
  assert.deepEqual(finalResolutions(jsonExt, 'COMPLETED'), [
    { userId: ME, resolution: { decision: 'same', keep: 'x' } },
    { userId: OTHER, resolution: { decision: 'different' } },
  ]);
  ['RECEIVED', 'ACCEPTED', 'FAILED', null, undefined].forEach((status) => {
    assert.equal(finalResolutions(jsonExt, status), null, String(status));
  });
  assert.equal(finalResolutions(storedBy({}), 'COMPLETED'), null);
  assert.equal(finalResolutions(null, 'COMPLETED'), null);
});

test('formStateFromResolution pre-fills the form from a stored entry', () => {
  assert.deepEqual(
    formStateFromResolution({ decision: 'same', keep: A, note: 'ok' }),
    { decision: 'same', keep: A, note: 'ok' },
  );
  assert.deepEqual(formStateFromResolution({ decision: 'different' }), { decision: 'different', keep: null, note: '' });
  assert.deepEqual(formStateFromResolution(null), { decision: null, keep: null, note: '' });
});

test('buildTaskResolution keeps a subject of the pair only', () => {
  assert.deepEqual(
    buildTaskResolution({ decision: 'same', keep: B, note: 'ok' }, businessData),
    { decision: 'same', keep: B, note: 'ok' },
  );
  assert.deepEqual(
    buildTaskResolution({ decision: 'different', keep: A }, businessData),
    { decision: 'different' },
  );
  assert.throws(() => buildTaskResolution({ decision: 'same', keep: C }, businessData), { message: 'keep_not_in_pair' });
  assert.throws(() => buildTaskResolution({ decision: 'same' }, businessData), { message: 'keep_not_in_pair' });
  assert.throws(() => buildTaskResolution({ decision: 'merge', keep: A }, businessData), { message: 'invalid_decision' });
});

const recordedSame = finalResolutions(storedBy({ [ME]: { decision: 'same', keep: A, note: 'ok' } }), 'COMPLETED');
const filledForm = { decision: 'same', keep: A, note: 'ok' };

test('taskFormMode turns read-only once the candidate is resolved elsewhere', () => {
  assert.equal(taskFormMode(null, { status: 'CONFIRMED' }), TASK_FORM_RESOLVED_ELSEWHERE);
  assert.equal(taskFormMode(null, { status: 'DISMISSED' }), TASK_FORM_RESOLVED_ELSEWHERE);
  assert.equal(taskFormMode(null, { status: 'OPEN' }), TASK_FORM_OPEN);
});

test('taskFormMode stays open when the candidate status cannot be read', () => {
  assert.equal(taskFormMode(null, null), TASK_FORM_OPEN);
  assert.equal(taskFormMode(null, undefined), TASK_FORM_OPEN);
});

test('a task that is not COMPLETED stays open and editable whatever it stored', () => {
  const stored = finalResolutions(storedBy({ [ME]: { decision: 'same', keep: A } }), 'ACCEPTED');
  assert.equal(stored, null);
  assert.equal(taskFormMode(stored, { status: 'OPEN' }), TASK_FORM_OPEN);
  assert.equal(taskFormMode(stored, null), TASK_FORM_OPEN);
});

test('taskFormMode shows the recorded decision before any current status', () => {
  assert.equal(taskFormMode(recordedSame, { status: 'CONFIRMED' }), TASK_FORM_RECORDED);
  assert.equal(taskFormMode(recordedSame, { status: 'OPEN' }), TASK_FORM_RECORDED);
  assert.equal(taskFormMode(recordedSame, null), TASK_FORM_RECORDED);
});

test('taskAdditionalData sends no decision for a candidate resolved elsewhere', () => {
  assert.equal(taskAdditionalData(taskFormMode(null, { status: 'CONFIRMED' }), filledForm, businessData), null);
  assert.equal(taskAdditionalData(taskFormMode(null, { status: 'DISMISSED' }), filledForm, businessData), null);
});

test('taskAdditionalData sends the encoded decision while the candidate is open', () => {
  const expected = encodeAdditionalData({ decision: 'same', keep: A, note: 'ok' });
  assert.equal(taskAdditionalData(taskFormMode(null, { status: 'OPEN' }), filledForm, businessData), expected);
  assert.equal(taskAdditionalData(taskFormMode(null, null), filledForm, businessData), expected);
});

test('taskAdditionalData sends no decision for an incomplete or invalid form', () => {
  assert.equal(taskAdditionalData(TASK_FORM_OPEN, { decision: null, keep: null, note: '' }, businessData), null);
  assert.equal(taskAdditionalData(TASK_FORM_OPEN, { decision: 'same', keep: C, note: '' }, businessData), null);
});

test('taskAdditionalData leaves a recorded task or unreadable business data untouched', () => {
  assert.equal(
    taskAdditionalData(taskFormMode(recordedSame, { status: 'CONFIRMED' }), filledForm, businessData),
    undefined,
  );
  assert.equal(taskAdditionalData(TASK_FORM_OPEN, filledForm, null), undefined);
  assert.equal(taskAdditionalData(TASK_FORM_RESOLVED_ELSEWHERE, filledForm, 'x'), undefined);
});

test('the approve and reject buttons work again after a refused completion', () => {
  // A refused completion leaves the task ACCEPTED with the approver already
  // in its business status; only the task status and an in-flight resolve gate them.
  assert.equal(canSubmitTaskResolution('ACCEPTED', false), true);
  assert.equal(canSubmitTaskResolution('ACCEPTED', true), false);
  ['RECEIVED', 'COMPLETED', 'FAILED', null, undefined].forEach((status) => {
    assert.equal(canSubmitTaskResolution(status, false), false, String(status));
  });
});

test('a stored decision is pending only while the task still awaits a decision', () => {
  assert.equal(taskAwaitsDecision('RECEIVED'), true);
  assert.equal(taskAwaitsDecision('ACCEPTED'), true);
  ['COMPLETED', 'FAILED', null, undefined].forEach((status) => {
    assert.equal(taskAwaitsDecision(status), false, String(status));
  });
});

test('taskFormMode closes the form when reading the candidate status is refused', () => {
  assert.equal(taskFormMode(null, null, { statusRefused: true }), TASK_FORM_NO_RIGHT);
  assert.equal(taskFormMode(null, undefined, { statusRefused: true }), TASK_FORM_NO_RIGHT);
});

test('taskFormMode still shows a recorded decision when the status query is refused', () => {
  assert.equal(taskFormMode(recordedSame, null, { statusRefused: true }), TASK_FORM_RECORDED);
});

test('taskAdditionalData sends no decision when the candidate status is refused', () => {
  assert.equal(taskAdditionalData(TASK_FORM_NO_RIGHT, filledForm, businessData), null);
});

test('taskAdditionalData sends no dismissal for a pair another kind already merged', () => {
  const dismissal = { decision: 'different', keep: null, note: 'not the same person' };
  assert.equal(
    taskAdditionalData(TASK_FORM_OPEN, dismissal, businessData, { canDismiss: false }),
    null,
  );
  assert.equal(
    taskAdditionalData(TASK_FORM_OPEN, dismissal, businessData, { canDismiss: true }),
    encodeAdditionalData({ decision: 'different', note: 'not the same person' }),
  );
  assert.equal(
    taskAdditionalData(TASK_FORM_OPEN, dismissal, businessData),
    encodeAdditionalData({ decision: 'different', note: 'not the same person' }),
  );
});

test('taskAdditionalData still sends a merge for a pair another kind already merged', () => {
  assert.equal(
    taskAdditionalData(TASK_FORM_OPEN, filledForm, businessData, { canDismiss: false }),
    encodeAdditionalData({ decision: 'same', keep: A, note: 'ok' }),
  );
});
