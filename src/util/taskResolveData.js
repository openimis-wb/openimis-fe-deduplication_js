// Pure helpers for the deduplication_candidate task formatter.
/* eslint-disable import/extensions -- node --test resolves ESM imports only with the extension */
import { isEmptyValue, isPlainObject } from './gql.js';
import { DECISION_SAME, validateResolution } from './candidates.js';

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
