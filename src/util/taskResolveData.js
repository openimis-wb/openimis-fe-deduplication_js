// Pure helpers for the deduplication_candidate task formatter.
/* eslint-disable import/extensions -- node --test resolves ESM imports only with the extension */
import { isEmptyValue, isPlainObject } from './gql.js';
import { DECISION_SAME, STATUS_OPEN, validateResolution } from './candidates.js';

export const TASK_FORM_RECORDED = 'recorded';
export const TASK_FORM_RESOLVED_ELSEWHERE = 'resolvedElsewhere';
export const TASK_FORM_OPEN = 'open';
export const TASK_FORM_NO_RIGHT = 'noRight';

// The body of a GraphQL string literal whose value is the JSON text of `obj`;
// resolveTask receives it as `additionalData: "<body>"`.
export function encodeAdditionalData(obj) {
  return JSON.stringify(JSON.stringify(obj)).slice(1, -1);
}

// The decision a completed task recorded. Task resolution stores it under
// json_ext.additional_resolve_data keyed by user id; the first entry is read.
export function decodeCompletedResolution(jsonExt) {
  if (!isPlainObject(jsonExt)) return null;
  const recorded = jsonExt.additional_resolve_data;
  if (!isPlainObject(recorded)) return null;
  const values = Object.values(recorded);
  if (!values.length || !isPlainObject(values[0])) return null;
  return values[0];
}

// The additional data the task bridge passes to resolve(); `candidateData` is
// the task's business data ({subject_a, subject_b, ...}).
export function buildTaskResolution({ decision, keep, note }, candidateData) {
  const keptId = validateResolution(decision, keep, candidateData?.subject_a, candidateData?.subject_b);
  const resolution = { decision };
  if (decision === DECISION_SAME) resolution.keep = keptId;
  if (!isEmptyValue(note)) resolution.note = note;
  return resolution;
}

// Mode of the task form. A decision the task recorded wins; otherwise a status
// query refused for lack of rights closes the form, and a candidate whose
// current status is not OPEN was resolved elsewhere. A null `currentCandidate`
// that was not refused (still loading, or unreadable) leaves the form open.
export function taskFormMode(recorded, currentCandidate, { statusRefused = false } = {}) {
  if (recorded) return TASK_FORM_RECORDED;
  if (statusRefused) return TASK_FORM_NO_RIGHT;
  if (isPlainObject(currentCandidate) && currentCandidate.status !== STATUS_OPEN) {
    return TASK_FORM_RESOLVED_ELSEWHERE;
  }
  return TASK_FORM_OPEN;
}

// What the task form hands to setAdditionalData: undefined leaves it untouched,
// null sends no decision, a string is the encoded resolution.
export function taskAdditionalData(mode, { decision, keep, note }, candidateData) {
  if (mode === TASK_FORM_RECORDED || !isPlainObject(candidateData)) return undefined;
  if (mode === TASK_FORM_RESOLVED_ELSEWHERE || mode === TASK_FORM_NO_RIGHT) return null;
  try {
    return encodeAdditionalData(buildTaskResolution({ decision, keep, note }, candidateData));
  } catch {
    return null;
  }
}
