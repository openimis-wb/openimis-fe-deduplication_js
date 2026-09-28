// Pure helpers for the biometric screens.
/* eslint-disable import/extensions -- node --test resolves ESM imports only with the extension */
import {
  dateTimeArg, hasAnyRight, isPlainObject, parseJson, stringArg,
} from './gql.js';

export const VERDICT_PASSED = 'passed';
export const VERDICT_REFUSED = 'refused';
export const VERDICT_UNKNOWN = 'unknown';

const VERDICT_BY_STATUS = {
  ACCEPTED: VERDICT_PASSED,
  REFUSED: VERDICT_REFUSED,
};

// The quality gate's verdict, read from template.qualityVerdict.status only.
// A missing verdict or NOT_ASSESSED is 'unknown'; quality and measures never decide it.
export function qualityVerdict(template) {
  const verdict = template?.qualityVerdict;
  if (!isPlainObject(verdict)) return { status: VERDICT_UNKNOWN, reasons: [] };
  const reasons = Array.isArray(verdict.reasons) ? verdict.reasons.filter((r) => typeof r === 'string') : [];
  return { status: VERDICT_BY_STATUS[verdict.status] ?? VERDICT_UNKNOWN, reasons };
}

// Acknowledge only from NEW; resolve from any state but RESOLVED.
export function alertTransitions(alert) {
  const state = alert?.state;
  return {
    canAcknowledge: state === 'NEW',
    canResolve: typeof state === 'string' && state !== 'RESOLVED',
  };
}

// What the audit head panel shows: the newest event's sequence and hash. It
// reports the head only and never states that the chain is intact.
export function chainHeadView(latestEvent, error) {
  if (error) return { kind: 'unavailable', sequence: null, hash: null };
  if (!latestEvent) return { kind: 'empty', sequence: null, hash: null };
  return { kind: 'head', sequence: latestEvent.sequence ?? null, hash: latestEvent.hash ?? null };
}

export function auditActionFilter(action) {
  return stringArg('action', action);
}

// Searcher filter id -> GraphQL fragment builder for biometricAlerts. `open` is
// sent only when set: open:false would keep resolved alerts only.
const ALERT_FILTER_BUILDERS = {
  state: (value) => stringArg('state', value),
  severity: (value) => stringArg('severity', value),
  ruleKind: (value) => stringArg('ruleKind', value),
  open: (value) => (value === true ? 'open: true' : null),
  subjectId: (value) => stringArg('subjectId', typeof value === 'string' ? value.trim() : value),
};

export function alertFilterFragment(filterId, value) {
  const build = ALERT_FILTER_BUILDERS[filterId];
  return build ? build(value) : null;
}

// Searcher filter id -> GraphQL fragment builder for biometricAuditEvents.
const AUDIT_FILTER_BUILDERS = {
  action: auditActionFilter,
  actor: (value) => stringArg('actor', typeof value === 'string' ? value.trim() : value),
  subjectId: (value) => stringArg('subjectId', typeof value === 'string' ? value.trim() : value),
  createdAt_Gte: (value) => dateTimeArg('createdAt_Gte', value, 'gte'),
  createdAt_Lte: (value) => dateTimeArg('createdAt_Lte', value, 'lte'),
};

export function auditFilterFragment(filterId, value) {
  const build = AUDIT_FILTER_BUILDERS[filterId];
  return build ? build(value) : null;
}

export function prettyJson(value) {
  const parsed = parseJson(value);
  if (parsed === null || parsed === undefined) return '';
  return JSON.stringify(parsed, null, 2);
}

export const MEASURE_PASSED = 'passed';
export const MEASURE_FAILED = 'failed';
export const MEASURE_NOT_JUDGED = 'notJudged';

const MEASURE_KINDS = ['min', 'max'];

const finiteOrNull = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : null);
const textOrEmpty = (value) => (typeof value === 'string' ? value : '');

// The quality gate's measures of template.qualityVerdict, in server order.
// passed null means the measure is recorded, not judged.
export function qualityMeasures(template) {
  const measures = template?.qualityVerdict?.measures;
  if (!Array.isArray(measures)) return [];
  return measures
    .filter((m) => isPlainObject(m) && typeof m.name === 'string' && m.name !== '')
    .map((m) => {
      let outcome = MEASURE_NOT_JUDGED;
      if (m.passed === true) outcome = MEASURE_PASSED;
      else if (m.passed === false) outcome = MEASURE_FAILED;
      return {
        name: m.name,
        value: finiteOrNull(m.value),
        limit: finiteOrNull(m.limit),
        kind: MEASURE_KINDS.includes(m.kind) ? m.kind : null,
        outcome,
        source: textOrEmpty(m.source),
        detail: textOrEmpty(m.detail),
      };
    });
}

export function formatNumber(value, digits = 2) {
  const number = finiteOrNull(value);
  return number === null ? '—' : number.toFixed(digits);
}

// A "min" measure passes at value >= limit, a "max" one at |value| <= limit.
export function measureBound(measure) {
  const limit = finiteOrNull(measure?.limit);
  if (limit === null) return '';
  if (measure.kind === 'min') return `≥ ${formatNumber(limit)}`;
  if (measure.kind === 'max') return `≤ ±${formatNumber(limit)}`;
  return '';
}

// The last stored audit chain check. 'ok' and 'broken' repeat the server's
// ok flag; 'never' means no check was stored yet.
export function chainStatusView(status, errors) {
  if (errors) return { kind: 'unavailable' };
  if (!isPlainObject(status)) return { kind: 'never' };
  return {
    kind: status.ok === true ? 'ok' : 'broken',
    checkedAt: status.checkedAt ?? null,
    checkedBy: status.checkedBy ?? null,
    checked: finiteOrNull(status.checked),
    headSequence: finiteOrNull(status.headSequence),
    headHash: status.headHash || null,
    divergenceKind: status.divergenceKind || null,
    divergenceSequence: finiteOrNull(status.divergenceSequence),
    divergenceDetail: status.divergenceDetail || null,
  };
}

// verifyBiometricAuditChain needs the verify right and the audit read right.
export function canVerifyChain(rights, verifyRights, auditRights) {
  return hasAnyRight(rights, verifyRights) && hasAnyRight(rights, auditRights);
}

export const IMPERSONATION_RULE = 'IMPERSONATION_SUSPECTED';

// The probe evidence an IMPERSONATION_SUSPECTED alert carries in its detail;
// null for other rules. The server drops the matched subject keys for callers
// without the identify right: matchedSubject.visible is false then.
export function impersonationEvidence(alert) {
  if (alert?.ruleKind !== IMPERSONATION_RULE) return null;
  const parsed = parseJson(alert.detail);
  const detail = isPlainObject(parsed) ? parsed : {};
  const visible = 'matched_subject_id' in detail || 'matched_subject_model' in detail;
  const model = textOrEmpty(detail.matched_subject_model);
  const id = textOrEmpty(detail.matched_subject_id);
  let label = null;
  if (id) label = model ? `${model} ${id}` : id;
  return {
    suspected: true,
    modality: textOrEmpty(detail.modality) || null,
    matchedSubject: { visible, label: visible ? label : null },
    matchedScore: finiteOrNull(detail.matched_score),
    claimedScore: finiteOrNull(detail.claimed_score),
    threshold: finiteOrNull(detail.threshold),
    margin: finiteOrNull(detail.margin),
  };
}

const FUSION_RULE_FIELDS = [
  ['acceptThreshold', 'number'],
  ['reviewThreshold', 'number'],
  ['floors', 'modalities'],
  ['floorDecision', 'text'],
  ['required', 'list'],
  ['modalityThresholds', 'modalities'],
  ['weights', 'modalities'],
];

const RULE_VALUE = {
  number: finiteOrNull,
  text: (value) => (typeof value === 'string' && value !== '' ? value : null),
  list: (value) => (Array.isArray(value) ? value.filter((v) => typeof v === 'string') : []),
  modalities: (value) => (Array.isArray(value)
    ? value
      .filter((v) => isPlainObject(v) && typeof v.modality === 'string')
      .map((v) => ({ modality: v.modality, value: finiteOrNull(v.value) }))
    : []),
};

const isDeclared = (value) => (Array.isArray(value) ? value.length > 0 : value !== null);

// Rows of a fusion rule set. With declaredOnly, the rows a risk profile
// overrides: a null scalar or an empty list is a key the profile left out.
export function fusionRuleRows(rules, { declaredOnly = false } = {}) {
  const source = isPlainObject(rules) ? rules : {};
  return FUSION_RULE_FIELDS
    .map(([key, type]) => ({ key, type, value: RULE_VALUE[type](source[key]) }))
    .filter((row) => !declaredOnly || isDeclared(row.value));
}

// The two purge passes of the retention policy; null when no policy is set.
export function retentionRows(policy) {
  if (!isPlainObject(policy)) return null;
  return [
    { pass: 'superseded', days: finiteOrNull(policy.templateRetentionDays), enabled: policy.purgeEnabled === true },
    {
      pass: 'active',
      days: finiteOrNull(policy.activeTemplateRetentionDays),
      enabled: policy.purgeActiveEnabled === true,
    },
  ];
}

const trimmed = (value) => (typeof value === 'string' ? value.trim() : value);

// Searcher filter id -> GraphQL fragment builder for biometricErasures.
const ERASURE_FILTER_BUILDERS = {
  subjectModel: (value) => stringArg('subjectModel', trimmed(value)),
  subjectId: (value) => stringArg('subjectId', trimmed(value)),
  reason: (value) => stringArg('reason', value),
  erasedBy: (value) => stringArg('erasedBy', trimmed(value)),
  erasedAt_Gte: (value) => dateTimeArg('erasedAt_Gte', value, 'gte'),
  erasedAt_Lte: (value) => dateTimeArg('erasedAt_Lte', value, 'lte'),
};

export function erasureFilterFragment(filterId, value) {
  const build = ERASURE_FILTER_BUILDERS[filterId];
  return build ? build(value) : null;
}

// Rows erased per modality, from the erasure's `erased` JSONString.
export function erasedCounts(erasure) {
  const erased = parseJson(erasure?.erased);
  if (!isPlainObject(erased)) return [];
  return Object.entries(erased)
    .filter(([, count]) => finiteOrNull(count) !== null)
    .map(([modality, count]) => ({ modality, count }))
    .sort((a, b) => a.modality.localeCompare(b.modality));
}
