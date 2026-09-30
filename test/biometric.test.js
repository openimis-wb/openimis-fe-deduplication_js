import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  alertFilterFragment,
  alertTransitions,
  auditActionFilter,
  auditFilterFragment,
  chainHeadOf,
  chainHeadView,
  prettyJson,
  qualityVerdict,
} from '../src/util/biometric.js';
import { labelOr } from '../src/util/gql.js';
import { AUDIT_HEAD_QUERY } from '../src/queries.js';

test('qualityVerdict reads the verdict status only', () => {
  assert.deepEqual(qualityVerdict({ qualityVerdict: { status: 'ACCEPTED', reasons: [] } }), {
    status: 'passed', reasons: [],
  });
  assert.deepEqual(
    qualityVerdict({ qualityVerdict: { status: 'REFUSED', reasons: ['sharpness_below_min'] } }),
    { status: 'refused', reasons: ['sharpness_below_min'] },
  );
  assert.equal(qualityVerdict({ qualityVerdict: { status: 'NOT_ASSESSED', reasons: [] } }).status, 'unknown');
  assert.equal(qualityVerdict({ qualityVerdict: null }).status, 'unknown');
  assert.equal(qualityVerdict({ quality: 87 }).status, 'unknown');
  assert.equal(qualityVerdict({}).status, 'unknown');
  assert.equal(qualityVerdict(null).status, 'unknown');
});

test('alertTransitions follow the alert state', () => {
  assert.deepEqual(alertTransitions({ state: 'NEW' }), { canAcknowledge: true, canResolve: true });
  assert.deepEqual(alertTransitions({ state: 'ACKNOWLEDGED' }), { canAcknowledge: false, canResolve: true });
  assert.deepEqual(alertTransitions({ state: 'RESOLVED' }), { canAcknowledge: false, canResolve: false });
  assert.deepEqual(alertTransitions(null), { canAcknowledge: false, canResolve: false });
});

test('chainHeadView reports the head and never an intact chain', () => {
  assert.equal(chainHeadView(null, null).kind, 'empty');
  assert.deepEqual(chainHeadView({ sequence: 42, hash: 'abc' }, null), { kind: 'head', sequence: 42, hash: 'abc' });
  assert.equal(chainHeadView({ sequence: 42, hash: 'abc' }, new Error('x')).kind, 'unavailable');
  const kinds = [chainHeadView(null), chainHeadView({ sequence: 1, hash: 'h' }), chainHeadView(null, 'e')]
    .map((view) => view.kind);
  assert.ok(!kinds.includes('intact'));
});

test('the head panel reads the unscoped chain head, not the scoped event list', () => {
  assert.match(AUDIT_HEAD_QUERY, /biometricAuditChainHead\s*\{\s*headSequence headHash eventCount createdAt\s*\}/);
  assert.doesNotMatch(AUDIT_HEAD_QUERY, /biometricAuditEvents/);
});

test('chainHeadOf maps the chain head for chainHeadView and keeps the global count', () => {
  const head = chainHeadOf({
    biometricAuditChainHead: {
      headSequence: 42, headHash: 'abc', eventCount: 42, createdAt: '2026-09-30T06:00:00',
    },
  });
  assert.deepEqual(head, {
    sequence: 42, hash: 'abc', count: 42, createdAt: '2026-09-30T06:00:00',
  });
  assert.deepEqual(chainHeadView(head, null), { kind: 'head', sequence: 42, hash: 'abc' });
  assert.equal(chainHeadOf({ biometricAuditChainHead: null }), null);
  assert.equal(chainHeadOf(null), null);
  assert.equal(chainHeadView(chainHeadOf({ biometricAuditChainHead: null }), null).kind, 'empty');
});

test('auditActionFilter escapes the action', () => {
  assert.equal(auditActionFilter('template.enrol'), 'action: "template.enrol"');
  assert.equal(auditActionFilter('a"b'), 'action: "a\\"b"');
  assert.equal(auditActionFilter(''), null);
  assert.equal(auditActionFilter(null), null);
});

test('alert filters send open only when it is on', () => {
  assert.equal(alertFilterFragment('open', true), 'open: true');
  assert.equal(alertFilterFragment('open', false), null);
  assert.equal(alertFilterFragment('state', 'NEW'), 'state: "NEW"');
  assert.equal(alertFilterFragment('ruleKind', 'ACCESS_BURST'), 'ruleKind: "ACCESS_BURST"');
  assert.equal(alertFilterFragment('severity', null), null);
});

test('audit filters widen dates and trim ids', () => {
  assert.equal(auditFilterFragment('createdAt_Lte', '2026-01-02'), 'createdAt_Lte: "2026-01-02T23:59:59.999999"');
  assert.equal(auditFilterFragment('subjectId', ' abc '), 'subjectId: "abc"');
});

test('prettyJson formats text or objects', () => {
  assert.equal(prettyJson('{"a":1}'), '{\n  "a": 1\n}');
  assert.equal(prettyJson(null), '');
});

test('labelOr falls back to the raw code', () => {
  const messages = { 'deduplication.biometric.quality.reason.sharpness_below_min': 'Image floue' };
  assert.equal(labelOr(messages, 'deduplication.biometric.quality.reason.sharpness_below_min', 'x'), 'Image floue');
  assert.equal(labelOr(messages, 'deduplication.biometric.quality.reason.unknown_code', 'unknown_code'), 'unknown_code');
  assert.equal(labelOr(undefined, 'k', 'raw'), 'raw');
});
