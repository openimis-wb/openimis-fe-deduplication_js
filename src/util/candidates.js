// Pure helpers for the duplicate-candidate screens. Imports sibling pure modules only.
/* eslint-disable import/extensions -- node --test resolves ESM imports only with the extension */
import {
  dateTimeArg,
  gqlString,
  hasRight,
  isEmptyValue,
  isPlainObject,
  isUuid,
  parseJson,
  stringArg,
} from './gql.js';

export const STATUS_OPEN = 'OPEN';
export const STATUS_CONFIRMED = 'CONFIRMED';
export const DECISION_SAME = 'same';
export const DECISION_DIFFERENT = 'different';
export const RESOLVE_RIGHT = '172003';

// Searcher filter id -> GraphQL fragment builder for duplicateCandidates.
const CANDIDATE_FILTER_BUILDERS = {
  status: (value) => stringArg('status', value),
  kind: (value) => stringArg('kind', value),
  subjectId: (value) => stringArg('subjectId', typeof value === 'string' ? value.trim() : value),
  dateCreated_Gte: (value) => dateTimeArg('dateCreated_Gte', value, 'gte'),
  dateCreated_Lte: (value) => dateTimeArg('dateCreated_Lte', value, 'lte'),
};

export function candidateFilterFragment(filterId, value) {
  const build = CANDIDATE_FILTER_BUILDERS[filterId];
  return build ? build(value) : null;
}

export function candidateFilters(filters) {
  if (!isPlainObject(filters)) return [];
  return Object.keys(filters)
    .map((filterId) => candidateFilterFragment(filterId, filters[filterId]))
    .filter((fragment) => fragment !== null);
}

export function keepOptions(candidate) {
  if (!candidate) return [];
  return [candidate.subjectA, candidate.subjectB];
}

// tasks_management TaskStatus values of a task still awaiting a decision.
export const OPEN_TASK_STATUSES = ['RECEIVED', 'ACCEPTED'];

export function hasOpenTask(candidate) {
  return OPEN_TASK_STATUSES.includes(candidate?.task?.status);
}

// An OPEN candidate whose decision is not already pending in a review task.
export function isAwaitingDecision(candidate) {
  return candidate?.status === STATUS_OPEN && !hasOpenTask(candidate);
}

export function canCreateReviewTasks(selection) {
  return Array.isArray(selection) && selection.length > 0 && selection.every(isAwaitingDecision);
}

export function canResolve(candidate, rights) {
  return isAwaitingDecision(candidate) && hasRight(rights, RESOLVE_RIGHT);
}

// Throws 'invalid_decision' or 'keep_not_in_pair'. Returns the keep to send:
// the chosen subject for 'same', null for 'different'.
export function validateResolution(decision, keep, subjectA, subjectB) {
  if (decision !== DECISION_SAME && decision !== DECISION_DIFFERENT) {
    throw new Error('invalid_decision');
  }
  if (decision === DECISION_DIFFERENT) return null;
  if (isEmptyValue(keep) || (keep !== subjectA && keep !== subjectB)) {
    throw new Error('keep_not_in_pair');
  }
  return keep;
}

// The input fields of resolveDuplicateCandidate; `keep` is always explicit for 'same'.
export function buildResolveInput({
  uuid, decision, keep, note,
}, candidate) {
  if (!isUuid(uuid)) throw new Error('invalid_id');
  const keptId = validateResolution(decision, keep, candidate?.subjectA, candidate?.subjectB);
  const fields = [`id: ${gqlString(uuid)}`, `decision: ${gqlString(decision)}`];
  if (keptId !== null) fields.push(`keep: ${gqlString(keptId)}`);
  if (!isEmptyValue(note)) fields.push(`note: ${gqlString(note)}`);
  return fields.join('\n');
}

// State of the pair across candidate kinds. `subjectStates` maps a subject id
// to {isDeleted, retiredInto} as read from the subject records, when readable.
// `canDismiss` is false once another kind merged the pair: the server refuses a
// `different` on it (pair_already_merged).
export function siblingState(candidate, siblings, subjectStates = {}) {
  const pair = keepOptions(candidate);
  const confirmed = (Array.isArray(siblings) ? siblings : []).filter(
    (row) => row
      && row.id !== candidate?.id
      && row.status === STATUS_CONFIRMED
      && row.subjectA === candidate?.subjectA
      && row.subjectB === candidate?.subjectB,
  );
  const mergedAlready = confirmed.length > 0;
  let keptId = null;
  if (mergedAlready) {
    const retiredInto = pair
      .map((id) => subjectStates?.[id]?.retiredInto)
      .find((id) => pair.includes(id));
    if (retiredInto) {
      keptId = retiredInto;
    } else {
      const active = pair.filter((id) => subjectStates?.[id] && !subjectStates[id].isDeleted);
      const deleted = pair.filter((id) => subjectStates?.[id]?.isDeleted);
      if (active.length === 1 && deleted.length === 1) [keptId] = active;
    }
  }
  return {
    mergedAlready,
    keptId,
    canDismiss: !mergedAlready,
    conflictingKeep: (keep) => mergedAlready && keep !== keptId,
  };
}

function displayValue(value) {
  if (value === null || value === undefined) return '';
  return typeof value === 'string' ? value : JSON.stringify(value);
}

const BIOMETRIC_EVIDENCE_KEYS = ['modality', 'provider', 'model_name'];

// [label, value] rows describing why the pair was proposed. Template ids stay out.
export function evidenceRows(candidate) {
  const evidence = parseJson(candidate?.evidence);
  if (!isPlainObject(evidence)) {
    return evidence === null || evidence === undefined ? [] : [['evidence', displayValue(evidence)]];
  }
  if (isPlainObject(evidence.columns)) {
    return Object.keys(evidence.columns).map((column) => [column, displayValue(evidence.columns[column])]);
  }
  if (typeof evidence.modality === 'string') {
    return BIOMETRIC_EVIDENCE_KEYS
      .filter((key) => evidence[key] !== undefined)
      .map((key) => [key, displayValue(evidence[key])]);
  }
  return [['evidence', JSON.stringify(evidence)]];
}

export function scoreLabel(candidate) {
  const score = candidate?.score;
  if (score === null || score === undefined || Number.isNaN(Number(score))) return '—';
  return Number(score).toFixed(3);
}
