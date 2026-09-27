// Pure helpers for the biometric screens.
/* eslint-disable import/extensions -- node --test resolves ESM imports only with the extension */
import {
  dateTimeArg, isPlainObject, parseJson, stringArg,
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
