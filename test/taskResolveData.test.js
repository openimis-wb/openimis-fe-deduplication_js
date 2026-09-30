import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  TASK_FORM_NO_RIGHT,
  TASK_FORM_OPEN,
  TASK_FORM_RECORDED,
  TASK_FORM_RESOLVED_ELSEWHERE,
  buildTaskResolution,
  decodeCompletedResolution,
  encodeAdditionalData,
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

test('decodeCompletedResolution reads the first recorded resolution', () => {
  assert.deepEqual(
    decodeCompletedResolution({ additional_resolve_data: { 12: { decision: 'different' } } }),
    { decision: 'different' },
  );
  assert.equal(decodeCompletedResolution(null), null);
  assert.equal(decodeCompletedResolution({}), null);
  assert.equal(decodeCompletedResolution({ additional_resolve_data: {} }), null);
  assert.equal(decodeCompletedResolution(true), null);
  assert.equal(decodeCompletedResolution({ additional_resolve_data: { 1: 'x' } }), null);
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

const recordedSame = { decision: 'same', keep: A, note: 'ok' };
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
