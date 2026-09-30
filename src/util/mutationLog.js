// Pure helpers for a failed mutation log. No React imports.
/* eslint-disable import/extensions -- node --test resolves ESM imports only with the extension */
import { MODULE_KEY } from '../constants.js';
import { labelOr } from './gql.js';

const REFUSAL_CODE_PREFIX = 'deduplication.resolve.';

const textOrNull = (value) => (typeof value === 'string' && value !== '' ? value : null);

// The first error of a failed log as { message, code, detail }, or null when the
// log did not fail. A resolve refusal carries its code next to a readable message.
export function mutationLogFailure(log) {
  if (!log || log.status !== 1 || !log.error) return null;
  try {
    const parsed = typeof log.error === 'string' ? JSON.parse(log.error) : log.error;
    const first = Array.isArray(parsed) ? parsed[0] : parsed;
    return {
      message: textOrNull(first?.message),
      code: textOrNull(first?.code),
      detail: textOrNull(first?.detail),
    };
  } catch {
    return { message: String(log.error), code: null, detail: null };
  }
}

// Module message key of a resolve refusal code, e.g. resolve.refusal.subject_deleted.
export function refusalMessageKey(code) {
  if (typeof code !== 'string' || !code.startsWith(REFUSAL_CODE_PREFIX)) return null;
  const reason = code.slice(REFUSAL_CODE_PREFIX.length);
  return reason ? `resolve.refusal.${reason}` : null;
}

// Text of a failed log in the user's language: the translated refusal when its
// code is known, else the server message of a coded refusal, else the detail.
export function mutationFailureText(log, messages) {
  const failure = mutationLogFailure(log);
  if (!failure) return null;
  const fallback = failure.code
    ? failure.message || failure.detail
    : failure.detail || failure.message;
  const key = refusalMessageKey(failure.code);
  return key ? labelOr(messages, `${MODULE_KEY}.${key}`, fallback) : fallback;
}
