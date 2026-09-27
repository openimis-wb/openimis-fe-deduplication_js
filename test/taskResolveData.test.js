import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildTaskResolution,
  decodeCompletedResolution,
  encodeAdditionalData,
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
