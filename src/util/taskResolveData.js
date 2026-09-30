// Pure helpers for the deduplication_candidate task formatter.
/* eslint-disable import/extensions -- node --test resolves ESM imports only with the extension */
import { isEmptyValue, isPlainObject } from './gql.js';
import {
  DECISION_DIFFERENT, DECISION_SAME, OPEN_TASK_STATUSES, STATUS_OPEN, validateResolution,
} from './candidates.js';

export const TASK_FORM_RECORDED = 'recorded';
export const TASK_FORM_RESOLVED_ELSEWHERE = 'resolvedElsewhere';
export const TASK_FORM_OPEN = 'open';
export const TASK_FORM_NO_RIGHT = 'noRight';

// The body of a GraphQL string literal whose value is the JSON text of `obj`;
// resolveTask receives it as `additionalData: "<body>"`.
export function encodeAdditionalData(obj) {
  return JSON.stringify(JSON.stringify(obj)).slice(1, -1);
}

export const TASK_STATUS_COMPLETED = 'COMPLETED';
export const TASK_STATUS_ACCEPTED = 'ACCEPTED';

// Every approver's stored decision as [{ userId, resolution }]. Task resolution
// stores one entry per approver under json_ext.additional_resolve_data, keyed by
// the id of the core user who resolved the task.
function storedResolutions(jsonExt) {
  if (!isPlainObject(jsonExt) || !isPlainObject(jsonExt.additional_resolve_data)) return [];
  return Object.entries(jsonExt.additional_resolve_data)
    .filter(([, resolution]) => isPlainObject(resolution))
    .map(([userId, resolution]) => ({ userId, resolution }));
}

// The decision stored under `userId`, the user completing the task being the one
// whose entry the server applies. Null without a user id or a usable entry.
export function ownResolution(jsonExt, userId) {
  if (isEmptyValue(userId)) return null;
  return storedResolutions(jsonExt).find((entry) => entry.userId === String(userId))?.resolution ?? null;
}

// The stored decisions of the approvers other than `userId`.
export function otherResolutions(jsonExt, userId) {
  return storedResolutions(jsonExt).filter((entry) => isEmptyValue(userId) || entry.userId !== String(userId));
}

// The stored decisions of a COMPLETED task, shown as final; null while the task
// can still be resolved again, since a refused completion leaves them on it.
export function finalResolutions(jsonExt, taskStatus) {
  if (taskStatus !== TASK_STATUS_COMPLETED) return null;
  const entries = storedResolutions(jsonExt);
  return entries.length ? entries : null;
}

// True while the task still awaits a decision, so a stored one is not applied yet.
export function taskAwaitsDecision(taskStatus) {
  return OPEN_TASK_STATUSES.includes(taskStatus);
}

// Whether the approve and reject buttons of a candidate task can be used. A
// refused completion leaves the approver in the task's business status, which
// disables the stock buttons for good; only the task status and a resolve in
// flight gate these.
export function canSubmitTaskResolution(taskStatus, submitting) {
  return taskStatus === TASK_STATUS_ACCEPTED && !submitting;
}

// What the task form tells the approve and reject buttons, which live in another
// component: in no-right mode neither may be used; the approval may not while the
// server's resolve check refuses the decision (or has not answered), nor, on an open
// form, while no decision is chosen (taskDecisionMissing).
export function taskFormGate(mode, { approvalBlocked = false, decisionMissing = false } = {}) {
  return {
    noRight: mode === TASK_FORM_NO_RIGHT,
    approvalBlocked: approvalBlocked || (mode === TASK_FORM_OPEN && decisionMissing),
  };
}

export function canApproveTask(taskStatus, submitting, gate) {
  return canSubmitTaskResolution(taskStatus, submitting) && !gate?.noRight && !gate?.approvalBlocked;
}

export function canRejectTask(taskStatus, submitting, gate) {
  return canSubmitTaskResolution(taskStatus, submitting) && !gate?.noRight;
}

// The form fields a stored decision pre-fills.
export function formStateFromResolution(resolution) {
  return {
    decision: resolution?.decision ?? null,
    keep: resolution?.keep ?? null,
    note: resolution?.note ?? '',
  };
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

// Mode of the task form. `recorded` is the final resolution of a COMPLETED task
// and wins; otherwise a status query or a resolve check refused for lack of rights
// closes the form, and a candidate whose current status is not OPEN was resolved
// elsewhere. A null `currentCandidate` that was not refused (still loading, or
// unreadable) leaves the form open.
export function taskFormMode(recorded, currentCandidate, { statusRefused = false, checkRefused = false } = {}) {
  if (recorded) return TASK_FORM_RECORDED;
  if (statusRefused || checkRefused) return TASK_FORM_NO_RIGHT;
  if (isPlainObject(currentCandidate) && currentCandidate.status !== STATUS_OPEN) {
    return TASK_FORM_RESOLVED_ELSEWHERE;
  }
  return TASK_FORM_OPEN;
}

// What the task form hands to setAdditionalData: undefined leaves it untouched,
// null sends no decision, a string is the encoded resolution. A dismissal of a
// pair another kind already merged is refused by the server, so `canDismiss: false`
// sends no decision for it.
export function taskAdditionalData(mode, { decision, keep, note }, candidateData, { canDismiss = true } = {}) {
  if (mode === TASK_FORM_RECORDED || !isPlainObject(candidateData)) return undefined;
  if (mode === TASK_FORM_RESOLVED_ELSEWHERE || mode === TASK_FORM_NO_RIGHT) return null;
  if (decision === DECISION_DIFFERENT && !canDismiss) return null;
  try {
    return encodeAdditionalData(buildTaskResolution({ decision, keep, note }, candidateData));
  } catch {
    return null;
  }
}

// True when an open form would send no decision (taskAdditionalData is not a string):
// none chosen, « Même personne » without a record of the pair to keep, or a dismissal
// the pair no longer allows.
export function taskDecisionMissing({ decision, keep, note }, candidateData, { canDismiss = true } = {}) {
  const additionalData = taskAdditionalData(TASK_FORM_OPEN, { decision, keep, note }, candidateData, { canDismiss });
  return typeof additionalData !== 'string';
}
