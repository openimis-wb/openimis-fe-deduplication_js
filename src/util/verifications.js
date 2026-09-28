// Pure helpers for the verification records and multimodal decision screens.
/* eslint-disable import/extensions -- node --test resolves ESM imports only with the extension */
import {
  dateTimeArg, hasAnyRight, isPlainObject, isUuid, stringArg,
} from './gql.js';

// Modalities the backend registers a provider for (biometric/registry.py).
export const VERIFICATION_MODALITIES = ['face', 'fingerprint', 'voice', 'iris', 'palmvein'];
// Outcomes fuse() returns (biometric/services.py).
export const DECISION_OUTCOMES = ['accept', 'review', 'reject'];
export const SUSPECTED_VALUES = ['true', 'false'];
export const VERIFICATION_NODE_TYPE = 'BiometricVerificationGQLType';

const trimmed = (value) => (typeof value === 'string' ? value.trim() : value);
const finiteOrNull = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : null);
const textOrNull = (value) => (typeof value === 'string' && value !== '' ? value : null);

// suspected accepts the select's 'true' / 'false' strings as well as booleans.
function suspectedArg(value) {
  if (value === true || value === 'true') return 'suspected: true';
  if (value === false || value === 'false') return 'suspected: false';
  return null;
}

const DATE_BUILDERS = {
  createdAt_Gte: (value) => dateTimeArg('createdAt_Gte', value, 'gte'),
  createdAt_Lte: (value) => dateTimeArg('createdAt_Lte', value, 'lte'),
};

// Searcher filter id -> GraphQL fragment builder for biometricVerificationRecords.
const VERIFICATION_FILTER_BUILDERS = {
  modality: (value) => stringArg('modality', value),
  suspected: suspectedArg,
  subjectId: (value) => stringArg('subjectId', trimmed(value)),
  ...DATE_BUILDERS,
};

export function verificationFilterFragment(filterId, value) {
  const build = VERIFICATION_FILTER_BUILDERS[filterId];
  return build ? build(value) : null;
}

// Searcher filter id -> GraphQL fragment builder for biometricMultimodalDecisions.
const DECISION_FILTER_BUILDERS = {
  outcome: (value) => stringArg('outcome', value),
  riskProfile: (value) => stringArg('riskProfile', value),
  ...DATE_BUILDERS,
};

export function decisionFilterFragment(filterId, value) {
  const build = DECISION_FILTER_BUILDERS[filterId];
  return build ? build(value) : null;
}

// 'notRun' when the impersonation probe did not run on the verification.
export function suspectedState(record) {
  const probe = record?.impersonation;
  if (!isPlainObject(probe)) return 'notRun';
  return probe.suspected === true ? 'yes' : 'no';
}

const subjectLabel = (model, id) => {
  const subjectId = textOrNull(id);
  if (!subjectId) return null;
  const subjectModel = textOrNull(model);
  return subjectModel ? `${subjectModel} ${subjectId}` : subjectId;
};

// The impersonation probe of a verification record; null when it did not run.
// The server withholds the matched subject and the candidates from callers
// without the identify right, so canIdentify, not the returned fields, decides
// whether they are shown: candidates is null when hidden.
export function verificationImpersonation(record, canIdentify) {
  const probe = record?.impersonation;
  if (!isPlainObject(probe)) return null;
  const candidates = Array.isArray(probe.candidates) ? probe.candidates : [];
  return {
    status: textOrNull(probe.status),
    suspected: probe.suspected === true,
    topK: finiteOrNull(probe.topK),
    threshold: finiteOrNull(probe.threshold),
    margin: finiteOrNull(probe.margin),
    claimedScore: finiteOrNull(probe.claimedScore),
    matchedScore: finiteOrNull(probe.matchedScore),
    matchedSubject: {
      visible: canIdentify === true,
      label: canIdentify === true ? subjectLabel(probe.matchedSubjectModel, probe.matchedSubjectId) : null,
    },
    candidates: canIdentify === true
      ? candidates
        .filter(isPlainObject)
        .map((c) => ({
          label: subjectLabel(c.subjectModel, c.subjectId),
          score: finiteOrNull(c.score),
          suspect: c.suspect === true,
        }))
      : null,
    error: textOrNull(probe.error),
    latencyMs: finiteOrNull(probe.latencyMs),
  };
}

// The reasons fuse() writes are English sentences carrying their values; each
// known one maps to a code and its values, any other stays raw.
const FUSION_REASON_PATTERNS = [
  ['requiredMissing', /^required modality '(?<modality>[^']*)' has no score$/],
  ['belowFloor', /^'(?<modality>[^']*)' score (?<score>\S+) below floor (?<floor>\S+)$/],
  ['noScore', /^no scored modality$/],
];

export function fusionReason(reason) {
  const raw = reason === null || reason === undefined ? '' : String(reason);
  const found = FUSION_REASON_PATTERNS
    .map(([code, pattern]) => [code, raw.match(pattern)])
    .find(([, match]) => match);
  if (!found) return { code: null, values: {}, raw };
  const [code, match] = found;
  return { code, values: { ...(match.groups ?? {}) }, raw };
}

// A decision's legs: modalities and verificationIds are both in leg order.
export function decisionLegs(decision) {
  const modalities = Array.isArray(decision?.modalities) ? decision.modalities : [];
  const ids = Array.isArray(decision?.verificationIds) ? decision.verificationIds : [];
  return Array.from({ length: Math.max(modalities.length, ids.length) }, (_, index) => ({
    modality: textOrNull(modalities[index]),
    verificationId: textOrNull(ids[index]),
  }));
}

// The relay global id of a verification row, for the root node lookup.
export function verificationGlobalId(uuid) {
  if (!isUuid(uuid)) return null;
  return btoa(`${VERIFICATION_NODE_TYPE}:${uuid}`);
}

export function riskProfileNames(data) {
  const profiles = data?.biometricDecisionCriteria?.profiles;
  if (!Array.isArray(profiles)) return [];
  return profiles.map((profile) => textOrNull(profile?.name)).filter((name) => name !== null);
}

// Everything on the screens needs the read right; the matched subject needs the
// identify right and the risk profile filter the configuration read right.
export function verificationScreenAccess(rights, { readRights, identifyRights, configRights }) {
  const canRead = hasAnyRight(rights, readRights);
  return {
    canRead,
    canIdentify: canRead && hasAnyRight(rights, identifyRights),
    canFilterProfiles: canRead && hasAnyRight(rights, configRights),
  };
}
