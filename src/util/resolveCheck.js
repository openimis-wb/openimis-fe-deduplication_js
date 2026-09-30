// Pure helpers for the resolve check: the server's read-only answer to "would this
// decision be accepted?" (duplicateCandidateResolveCheck). No React imports.
/* eslint-disable import/extensions -- node --test resolves ESM imports only with the extension */
import { MODULE_KEY } from '../constants.js';
import { DECISION_DIFFERENT, DECISION_SAME } from './candidates.js';
import { isPlainObject, isUuid, labelOr } from './gql.js';
import { refusalMessageKey } from './mutationLog.js';

export const CHECK_IDLE = 'idle';
export const CHECK_CHECKING = 'checking';
export const CHECK_OK = 'ok';
export const CHECK_REFUSED = 'refused';
export const CHECK_NO_RIGHT = 'noRight';
export const CHECK_UNAVAILABLE = 'unavailable';

// The query variables for a decision, or null while there is nothing to check: no
// candidate, no decision, or a merge whose record to keep is not chosen from the pair.
export function resolveCheckVariables({
  candidateId, decision, keep, subjectA, subjectB,
}) {
  if (!isUuid(candidateId)) return null;
  if (decision === DECISION_DIFFERENT) return { candidateId, decision, keep: null };
  if (decision === DECISION_SAME && (keep === subjectA || keep === subjectB)) {
    return { candidateId, decision, keep };
  }
  return null;
}

// Where the check stands. `resolvedFor` is the serialised variables the last answer
// was fetched for: an answer for other variables counts as not yet received.
export function resolveCheckState({
  variables, resolvedFor, isLoading, data, errors, permissionRefused = false,
}) {
  if (!variables) return { status: CHECK_IDLE };
  if (isLoading || resolvedFor !== JSON.stringify(variables)) return { status: CHECK_CHECKING };
  if (permissionRefused) return { status: CHECK_NO_RIGHT };
  const check = data?.duplicateCandidateResolveCheck;
  if (errors || !isPlainObject(check)) return { status: CHECK_UNAVAILABLE };
  if (check.ok === false) {
    return { status: CHECK_REFUSED, code: check.code ?? null, message: check.message ?? null };
  }
  return { status: CHECK_OK };
}

// A check still running, refused, or unanswerable for lack of rights holds the approval back.
export function checkBlocksApproval(state) {
  return [CHECK_CHECKING, CHECK_REFUSED, CHECK_NO_RIGHT].includes(state?.status);
}

// The candidate page holds a decision back while its check runs or refuses; a check
// the caller may not run leaves the buttons to the server's own refusal.
export function checkBlocksDecision(state) {
  return [CHECK_CHECKING, CHECK_REFUSED].includes(state?.status);
}

// The refusal in the user's language, else the server's message, else the code.
export function checkRefusalText(state, messages) {
  if (state?.status !== CHECK_REFUSED) return null;
  const fallback = state.message || state.code;
  const key = refusalMessageKey(state.code);
  return key ? labelOr(messages, `${MODULE_KEY}.${key}`, fallback) : fallback;
}
