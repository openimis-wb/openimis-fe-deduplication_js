import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  canVerifyChain,
  chainStatusView,
  erasedCounts,
  erasureFilterFragment,
  formatNumber,
  fusionRuleRows,
  impersonationEvidence,
  measureBound,
  qualityMeasures,
  qualityVerdict,
  retentionRows,
} from '../src/util/biometric.js';

const measure = (overrides) => ({
  name: 'sharpness', value: 120.456, limit: 100, kind: 'min', passed: true, source: 'image', detail: '', ...overrides,
});

test('qualityMeasures keeps the server order and reads passed as the outcome', () => {
  const template = {
    qualityVerdict: {
      status: 'REFUSED',
      measures: [
        measure(),
        measure({
          name: 'yaw', value: -20, limit: 15, kind: 'max', passed: false, source: 'provider_pose',
        }),
        measure({
          name: 'lower_face_uniformity', value: null, limit: null, passed: null, detail: 'no_face_box',
        }),
      ],
    },
  };
  assert.deepEqual(qualityMeasures(template).map((m) => [m.name, m.outcome]), [
    ['sharpness', 'passed'],
    ['yaw', 'failed'],
    ['lower_face_uniformity', 'notJudged'],
  ]);
  assert.equal(qualityMeasures(template)[2].detail, 'no_face_box');
  assert.equal(qualityMeasures(template)[2].value, null);
});

test('qualityMeasures drops malformed entries and tolerates a missing verdict', () => {
  assert.deepEqual(qualityMeasures(null), []);
  assert.deepEqual(qualityMeasures({ qualityVerdict: null }), []);
  assert.deepEqual(qualityMeasures({ qualityVerdict: { measures: 'x' } }), []);
  const rows = qualityMeasures({
    qualityVerdict: { measures: [null, { value: 1 }, measure({ value: Number.NaN, kind: 'other', passed: 'yes' })] },
  });
  assert.equal(rows.length, 1);
  assert.deepEqual(
    [rows[0].value, rows[0].kind, rows[0].outcome],
    [null, null, 'notJudged'],
  );
});

test('measures never decide the verdict status', () => {
  const template = { qualityVerdict: { status: 'NOT_ASSESSED', reasons: [], measures: [measure({ passed: false })] } };
  assert.equal(qualityVerdict(template).status, 'unknown');
});

test('formatNumber prints two decimals or a dash', () => {
  assert.equal(formatNumber(120.456), '120.46');
  assert.equal(formatNumber(0), '0.00');
  assert.equal(formatNumber(-3.2), '-3.20');
  assert.equal(formatNumber(null), '—');
  assert.equal(formatNumber(undefined), '—');
  assert.equal(formatNumber(Number.POSITIVE_INFINITY), '—');
  assert.equal(formatNumber(0.8, 3), '0.800');
});

test('measureBound states the limit on the side the gate judges', () => {
  assert.equal(measureBound({ kind: 'min', limit: 100 }), '≥ 100.00');
  assert.equal(measureBound({ kind: 'max', limit: 15 }), '≤ ±15.00');
  assert.equal(measureBound({ kind: 'max', limit: null }), '');
  assert.equal(measureBound({ kind: null, limit: 3 }), '');
  assert.equal(measureBound(null), '');
});

test('chainStatusView reports the stored check or its absence', () => {
  const intact = {
    id: 'c1',
    ok: true,
    checkedAt: '2026-09-28T10:00:00',
    checkedBy: 'admin',
    checked: 42,
    headSequence: 42,
    headHash: 'abc',
    divergenceKind: '',
    divergenceSequence: null,
    divergenceDetail: '',
  };
  const view = chainStatusView(intact, null);
  assert.equal(view.kind, 'ok');
  assert.equal(view.divergenceKind, null);
  assert.equal(view.divergenceSequence, null);
  assert.equal(view.headSequence, 42);
  assert.equal(view.checkedBy, 'admin');

  const broken = chainStatusView({
    ...intact, ok: false, checked: 9, divergenceKind: 'altered_row', divergenceSequence: 10, divergenceDetail: 'x',
  }, null);
  assert.deepEqual(
    [broken.kind, broken.divergenceKind, broken.divergenceSequence, broken.divergenceDetail, broken.checked],
    ['broken', 'altered_row', 10, 'x', 9],
  );

  assert.equal(chainStatusView(null, null).kind, 'never');
  assert.equal(chainStatusView(undefined).kind, 'never');
  assert.equal(chainStatusView(intact, [{ message: 'unauthorized' }]).kind, 'unavailable');
  assert.equal(chainStatusView({ ...intact, ok: 'true' }, null).kind, 'broken');
});

test('canVerifyChain needs the verify right and the audit read right', () => {
  assert.equal(canVerifyChain([174008, 174005], [174008], [174005]), true);
  assert.equal(canVerifyChain(['174008', '174005'], [174008], [174005]), true);
  assert.equal(canVerifyChain([174008], [174008], [174005]), false);
  assert.equal(canVerifyChain([174005], [174008], [174005]), false);
  assert.equal(canVerifyChain(null, [174008], [174005]), false);
});

const impersonationAlert = (detail) => ({ ruleKind: 'IMPERSONATION_SUSPECTED', detail: JSON.stringify(detail) });

test('impersonationEvidence reads the alert detail of an impersonation alert', () => {
  const evidence = impersonationEvidence(impersonationAlert({
    verification_id: 'v1',
    modality: 'face',
    matched_subject_model: 'individual.Individual',
    matched_subject_id: 'b2',
    matched_template_id: 't9',
    matched_score: 0.91,
    claimed_score: 0.42,
    threshold: 0.8,
    margin: 0.05,
  }));
  assert.deepEqual(evidence, {
    suspected: true,
    modality: 'face',
    matchedSubject: { visible: true, label: 'individual.Individual b2' },
    matchedScore: 0.91,
    claimedScore: 0.42,
    threshold: 0.8,
    margin: 0.05,
  });
  assert.ok(!JSON.stringify(evidence).includes('t9'));
});

test('impersonationEvidence tells a withheld matched subject from an empty one', () => {
  const withheld = impersonationEvidence(impersonationAlert({ matched_score: 0.9 }));
  assert.deepEqual(withheld.matchedSubject, { visible: false, label: null });
  const empty = impersonationEvidence(impersonationAlert({ matched_subject_model: '', matched_subject_id: '' }));
  assert.deepEqual(empty.matchedSubject, { visible: true, label: null });
  assert.equal(empty.matchedScore, null);
});

test('impersonationEvidence is null for other rules and accepts a parsed detail', () => {
  assert.equal(impersonationEvidence({ ruleKind: 'ACCESS_BURST', detail: '{}' }), null);
  assert.equal(impersonationEvidence(null), null);
  const parsed = impersonationEvidence({ ruleKind: 'IMPERSONATION_SUSPECTED', detail: { claimed_score: 0.3 } });
  assert.equal(parsed.claimedScore, 0.3);
  assert.equal(impersonationEvidence({ ruleKind: 'IMPERSONATION_SUSPECTED', detail: 'not json' }).suspected, true);
});

const baseRules = {
  acceptThreshold: 0.8,
  reviewThreshold: 0.6,
  floors: [{ modality: 'face', value: 0.3 }],
  floorDecision: 'review',
  required: ['face'],
  modalityThresholds: [],
  weights: [{ modality: 'face', value: 1 }, { modality: 'fingerprint', value: null }],
};

test('fusionRuleRows lists every rule of a full rule set', () => {
  const rows = fusionRuleRows(baseRules);
  assert.deepEqual(rows.map((r) => r.key), [
    'acceptThreshold', 'reviewThreshold', 'floors', 'floorDecision', 'required', 'modalityThresholds', 'weights',
  ]);
  assert.deepEqual(rows.find((r) => r.key === 'weights').value, [
    { modality: 'face', value: 1 }, { modality: 'fingerprint', value: null },
  ]);
  assert.deepEqual(rows.find((r) => r.key === 'modalityThresholds').value, []);
  assert.equal(fusionRuleRows(null).length, 7);
  assert.equal(fusionRuleRows(null)[0].value, null);
});

test('fusionRuleRows keeps only the declared overrides of a profile', () => {
  const overrides = {
    acceptThreshold: 0.9,
    reviewThreshold: null,
    floors: [],
    floorDecision: 'reject',
    required: [],
    modalityThresholds: [{ modality: 'face', value: null }],
  };
  assert.deepEqual(fusionRuleRows(overrides, { declaredOnly: true }), [
    { key: 'acceptThreshold', type: 'number', value: 0.9 },
    { key: 'floorDecision', type: 'text', value: 'reject' },
    { key: 'modalityThresholds', type: 'modalities', value: [{ modality: 'face', value: null }] },
  ]);
  assert.deepEqual(fusionRuleRows({}, { declaredOnly: true }), []);
});

test('retentionRows reads both purge passes, or null without a policy', () => {
  assert.equal(retentionRows(null), null);
  assert.deepEqual(retentionRows({
    templateRetentionDays: 365, purgeEnabled: true, activeTemplateRetentionDays: null, purgeActiveEnabled: false,
  }), [
    { pass: 'superseded', days: 365, enabled: true },
    { pass: 'active', days: null, enabled: false },
  ]);
});

test('erasure filters trim identifiers and widen dates', () => {
  assert.equal(erasureFilterFragment('subjectId', ' 42 '), 'subjectId: "42"');
  assert.equal(erasureFilterFragment('subjectModel', 'individual.Individual'), 'subjectModel: "individual.Individual"');
  assert.equal(erasureFilterFragment('reason', 'ACTIVE_AGE'), 'reason: "ACTIVE_AGE"');
  assert.equal(erasureFilterFragment('erasedBy', ' retention '), 'erasedBy: "retention"');
  assert.equal(erasureFilterFragment('erasedAt_Gte', '2026-09-01'), 'erasedAt_Gte: "2026-09-01T00:00:00"');
  assert.equal(erasureFilterFragment('erasedAt_Lte', '2026-09-01'), 'erasedAt_Lte: "2026-09-01T23:59:59.999999"');
  assert.equal(erasureFilterFragment('reason', null), null);
  assert.equal(erasureFilterFragment('unknown', 'x'), null);
});

test('erasedCounts lists the per-modality counts sorted by modality', () => {
  assert.deepEqual(erasedCounts({ erased: '{"fingerprint": 2, "face": 1}' }), [
    { modality: 'face', count: 1 }, { modality: 'fingerprint', count: 2 },
  ]);
  assert.deepEqual(erasedCounts({ erased: { face: 'x' } }), []);
  assert.deepEqual(erasedCounts({ erased: null }), []);
  assert.deepEqual(erasedCounts(null), []);
});
