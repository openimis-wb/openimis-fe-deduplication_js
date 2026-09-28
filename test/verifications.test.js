import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DECISION_OUTCOMES,
  VERIFICATION_MODALITIES,
  VERIFICATION_NODE_TYPE,
  codeLabel,
  decisionFilterFragment,
  decisionLegs,
  fusionReason,
  riskProfileNames,
  suspectedState,
  verificationFilterFragment,
  verificationGlobalId,
  verificationImpersonation,
  verificationScreenAccess,
} from '../src/util/verifications.js';

const UUID = '3f2b8c1e-9a4d-4e21-8b6f-0c5d7e9a1b23';

test('verification filters map the selects and trim the subject id', () => {
  assert.equal(verificationFilterFragment('modality', 'face'), 'modality: "face"');
  assert.equal(verificationFilterFragment('modality', null), null);
  assert.equal(verificationFilterFragment('subjectId', ' 42 '), 'subjectId: "42"');
  assert.equal(verificationFilterFragment('subjectId', '   '), null);
  assert.equal(verificationFilterFragment('createdAt_Gte', '2026-09-01'), 'createdAt_Gte: "2026-09-01T00:00:00"');
  assert.equal(verificationFilterFragment('createdAt_Lte', '2026-09-01'), 'createdAt_Lte: "2026-09-01T23:59:59.999999"');
  assert.equal(verificationFilterFragment('riskProfile', 'high'), null);
  assert.equal(verificationFilterFragment('unknown', 'x'), null);
});

test('the suspected filter keeps its three states', () => {
  assert.equal(verificationFilterFragment('suspected', 'true'), 'suspected: true');
  assert.equal(verificationFilterFragment('suspected', 'false'), 'suspected: false');
  assert.equal(verificationFilterFragment('suspected', true), 'suspected: true');
  assert.equal(verificationFilterFragment('suspected', false), 'suspected: false');
  assert.equal(verificationFilterFragment('suspected', null), null);
  assert.equal(verificationFilterFragment('suspected', ''), null);
  assert.equal(verificationFilterFragment('suspected', 'maybe'), null);
});

test('decision filters map outcome, risk profile and dates', () => {
  assert.equal(decisionFilterFragment('outcome', 'review'), 'outcome: "review"');
  assert.equal(decisionFilterFragment('outcome', ''), null);
  assert.equal(decisionFilterFragment('riskProfile', 'high_value'), 'riskProfile: "high_value"');
  assert.equal(decisionFilterFragment('createdAt_Gte', '2026-09-01'), 'createdAt_Gte: "2026-09-01T00:00:00"');
  assert.equal(decisionFilterFragment('createdAt_Lte', '2026-09-02'), 'createdAt_Lte: "2026-09-02T23:59:59.999999"');
  assert.equal(decisionFilterFragment('suspected', 'true'), null);
});

test('the select value sets follow the backend', () => {
  assert.deepEqual(VERIFICATION_MODALITIES, ['face', 'fingerprint', 'voice', 'iris', 'palmvein']);
  assert.deepEqual(DECISION_OUTCOMES, ['accept', 'review', 'reject']);
});

test('suspectedState tells a probe that did not run from a clear one', () => {
  assert.equal(suspectedState({ impersonation: { suspected: true } }), 'yes');
  assert.equal(suspectedState({ impersonation: { suspected: false } }), 'no');
  assert.equal(suspectedState({ impersonation: null }), 'notRun');
  assert.equal(suspectedState({}), 'notRun');
  assert.equal(suspectedState(null), 'notRun');
});

const probe = (overrides) => ({
  status: 'ok',
  suspected: true,
  threshold: 0.8,
  margin: 0.05,
  topK: 5,
  claimedScore: 0.41,
  matchedSubjectModel: 'individual.Individual',
  matchedSubjectId: 'b2',
  matchedScore: 0.92,
  candidates: [
    {
      subjectModel: 'individual.Individual', subjectId: 'b2', score: 0.92, suspect: true,
    },
    {
      subjectModel: 'individual.Individual', subjectId: 'c3', score: 0.81, suspect: false,
    },
  ],
  error: null,
  latencyMs: 12.5,
  ...overrides,
});

test('verificationImpersonation shows the matched subject and the candidates to the identify right', () => {
  const view = verificationImpersonation({ impersonation: probe() }, true);
  assert.deepEqual(view, {
    status: 'ok',
    suspected: true,
    topK: 5,
    threshold: 0.8,
    margin: 0.05,
    claimedScore: 0.41,
    matchedScore: 0.92,
    matchedSubject: { visible: true, label: 'individual.Individual b2' },
    candidates: [
      { label: 'individual.Individual b2', score: 0.92, suspect: true },
      { label: 'individual.Individual c3', score: 0.81, suspect: false },
    ],
    error: null,
    latencyMs: 12.5,
  });
});

test('verificationImpersonation hides what the server withholds without the identify right', () => {
  const withheld = probe({ matchedSubjectModel: null, matchedSubjectId: null, candidates: [] });
  const view = verificationImpersonation({ impersonation: withheld }, false);
  assert.deepEqual(view.matchedSubject, { visible: false, label: null });
  assert.equal(view.candidates, null);
  assert.equal(view.matchedScore, 0.92);
  assert.equal(view.topK, 5);
  const leaked = verificationImpersonation({ impersonation: probe() }, false);
  assert.deepEqual(leaked.matchedSubject, { visible: false, label: null });
  assert.equal(leaked.candidates, null);
});

test('verificationImpersonation reports an empty match to the identify right as empty', () => {
  const view = verificationImpersonation({
    impersonation: probe({
      suspected: false, matchedSubjectModel: null, matchedSubjectId: null, matchedScore: null, candidates: null,
    }),
  }, true);
  assert.deepEqual(view.matchedSubject, { visible: true, label: null });
  assert.deepEqual(view.candidates, []);
  assert.equal(view.suspected, false);
});

test('verificationImpersonation is null when the probe did not run and tolerates bad values', () => {
  assert.equal(verificationImpersonation({ impersonation: null }, true), null);
  assert.equal(verificationImpersonation(null, true), null);
  const view = verificationImpersonation({
    impersonation: {
      status: 'failed', suspected: 'yes', topK: Number.NaN, error: 'impersonation probe failed', candidates: [null, 3],
    },
  }, true);
  assert.equal(view.status, 'failed');
  assert.equal(view.suspected, false);
  assert.equal(view.topK, null);
  assert.equal(view.error, 'impersonation probe failed');
  assert.deepEqual(view.candidates, []);
});

test('fusionReason reads the three reasons fuse() writes', () => {
  assert.deepEqual(fusionReason("required modality 'face' has no score"), {
    code: 'requiredMissing', values: { modality: 'face' }, raw: "required modality 'face' has no score",
  });
  assert.deepEqual(fusionReason("'fingerprint' score 0.30000000000000004 below floor 0.5"), {
    code: 'belowFloor',
    values: { modality: 'fingerprint', score: '0.30000000000000004', floor: '0.5' },
    raw: "'fingerprint' score 0.30000000000000004 below floor 0.5",
  });
  assert.deepEqual(fusionReason('no scored modality'), { code: 'noScore', values: {}, raw: 'no scored modality' });
});

test('fusionReason keeps any other text raw', () => {
  assert.deepEqual(fusionReason('something new'), { code: null, values: {}, raw: 'something new' });
  assert.deepEqual(fusionReason(null), { code: null, values: {}, raw: '' });
  assert.deepEqual(fusionReason(7), { code: null, values: {}, raw: '7' });
});

test('decisionLegs pairs each modality with its verification in leg order', () => {
  assert.deepEqual(decisionLegs({ modalities: ['face', 'fingerprint'], verificationIds: [UUID, 'v2'] }), [
    { modality: 'face', verificationId: UUID },
    { modality: 'fingerprint', verificationId: 'v2' },
  ]);
  assert.deepEqual(decisionLegs({ modalities: ['face'], verificationIds: [] }), [
    { modality: 'face', verificationId: null },
  ]);
  assert.deepEqual(decisionLegs({ modalities: null, verificationIds: [UUID] }), [
    { modality: null, verificationId: UUID },
  ]);
  assert.deepEqual(decisionLegs(null), []);
});

test('verificationGlobalId is the relay id of a verification row', () => {
  assert.equal(VERIFICATION_NODE_TYPE, 'BiometricVerificationGQLType');
  assert.equal(
    verificationGlobalId(UUID),
    'QmlvbWV0cmljVmVyaWZpY2F0aW9uR1FMVHlwZTozZjJiOGMxZS05YTRkLTRlMjEtOGI2Zi0wYzVkN2U5YTFiMjM=',
  );
  assert.equal(verificationGlobalId('not-a-uuid'), null);
  assert.equal(verificationGlobalId(null), null);
});

test('riskProfileNames lists the named profiles of the decision criteria', () => {
  assert.deepEqual(riskProfileNames({ biometricDecisionCriteria: { profiles: [{ name: 'b' }, { name: 'a' }] } }), [
    'b', 'a',
  ]);
  assert.deepEqual(riskProfileNames({ biometricDecisionCriteria: { profiles: [{ name: '' }, null, { x: 1 }] } }), []);
  assert.deepEqual(riskProfileNames({ biometricDecisionCriteria: null }), []);
  assert.deepEqual(riskProfileNames(null), []);
});

test('verificationScreenAccess gates the page, the matched subject and the profile filter', () => {
  const gates = { readRights: [174004], identifyRights: [174003], configRights: [174007] };
  assert.deepEqual(verificationScreenAccess([174004], gates), {
    canRead: true, canIdentify: false, canFilterProfiles: false,
  });
  assert.deepEqual(verificationScreenAccess(['174004', '174003', '174007'], gates), {
    canRead: true, canIdentify: true, canFilterProfiles: true,
  });
  assert.deepEqual(verificationScreenAccess([174003, 174007], gates), {
    canRead: false, canIdentify: false, canFilterProfiles: false,
  });
  assert.deepEqual(verificationScreenAccess(null, gates), {
    canRead: false, canIdentify: false, canFilterProfiles: false,
  });
});

test('codeLabel translates a code, falls back to it raw and dashes an empty one', () => {
  const messages = { 'm.skip.no_device_template': "L'appareil n'a transmis aucun gabarit" };
  assert.equal(codeLabel(messages, 'm.skip', 'no_device_template'), "L'appareil n'a transmis aucun gabarit");
  assert.equal(codeLabel(messages, 'm.skip', 'new_reason'), 'new_reason');
  assert.equal(codeLabel(messages, 'm.skip', ''), '—');
  assert.equal(codeLabel(messages, 'm.skip', null), '—');
  assert.equal(codeLabel(null, 'm.skip', 'x'), 'x');
});
