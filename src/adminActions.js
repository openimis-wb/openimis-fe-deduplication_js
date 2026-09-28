import {
  formatMutation,
  formatPageQueryWithCount,
  graphql,
  graphqlWithVariables,
} from '@openimis/fe-core';
import { ADMIN_ACTION_TYPE } from './adminReducer';
import { ERROR, REQUEST, SUCCESS } from './util/action-type';
import { buildResolveInput } from './util/candidates';
import { gqlString, withStableOrder } from './util/gql';
import {
  ACKNOWLEDGE_ALERT_MUTATION,
  ALERT_PROJECTION,
  AUDIT_EVENT_PROJECTION,
  CANDIDATE_PROJECTION,
  ERASURE_PROJECTION,
  MULTIMODAL_DECISION_PROJECTION,
  MUTATION_LOG_QUERY,
  RESOLVE_ALERT_MUTATION,
  VERIFICATION_RECORD_PROJECTION,
  VERIFY_AUDIT_CHAIN_MUTATION,
} from './queries';

const MUTATION_LOG_PENDING = 0;
const MUTATION_LOG_POLL_ATTEMPTS = 15;

export function fetchDuplicateCandidates(params) {
  const payload = formatPageQueryWithCount('duplicateCandidates', withStableOrder(params), CANDIDATE_PROJECTION);
  return graphql(payload, ADMIN_ACTION_TYPE.SEARCH_CANDIDATES);
}

// `uuid` is the raw candidate UUID: the id filter of duplicateCandidates is a UUID filter.
export function fetchDuplicateCandidate(uuid) {
  const payload = formatPageQueryWithCount('duplicateCandidates', [`id: ${gqlString(uuid)}`], CANDIDATE_PROJECTION);
  return graphql(payload, ADMIN_ACTION_TYPE.GET_CANDIDATE);
}

export function fetchPairSiblings(subjectModel, subjectA, subjectB) {
  const payload = formatPageQueryWithCount(
    'duplicateCandidates',
    [
      `subjectModel: ${gqlString(subjectModel)}`,
      `subjectA: ${gqlString(subjectA)}`,
      `subjectB: ${gqlString(subjectB)}`,
      'orderBy: ["kind", "id"]',
    ],
    CANDIDATE_PROJECTION,
  );
  return graphql(payload, ADMIN_ACTION_TYPE.SEARCH_PAIR_SIBLINGS);
}

export function fetchBiometricAlerts(params) {
  const payload = formatPageQueryWithCount('biometricAlerts', withStableOrder(params), ALERT_PROJECTION);
  return graphql(payload, ADMIN_ACTION_TYPE.SEARCH_BIOMETRIC_ALERTS);
}

export function fetchBiometricAuditEvents(params) {
  const payload = formatPageQueryWithCount('biometricAuditEvents', params, AUDIT_EVENT_PROJECTION);
  return graphql(payload, ADMIN_ACTION_TYPE.SEARCH_BIOMETRIC_AUDIT_EVENTS);
}

export function fetchBiometricErasures(params) {
  const payload = formatPageQueryWithCount('biometricErasures', withStableOrder(params), ERASURE_PROJECTION);
  return graphql(payload, ADMIN_ACTION_TYPE.SEARCH_BIOMETRIC_ERASURES);
}

export function fetchBiometricVerificationRecords(params) {
  const payload = formatPageQueryWithCount(
    'biometricVerificationRecords',
    withStableOrder(params),
    VERIFICATION_RECORD_PROJECTION,
  );
  return graphql(payload, ADMIN_ACTION_TYPE.SEARCH_BIOMETRIC_VERIFICATIONS);
}

export function fetchBiometricMultimodalDecisions(params) {
  const payload = formatPageQueryWithCount(
    'biometricMultimodalDecisions',
    withStableOrder(params),
    MULTIMODAL_DECISION_PROJECTION,
  );
  return graphql(payload, ADMIN_ACTION_TYPE.SEARCH_BIOMETRIC_MULTIMODAL_DECISIONS);
}

function performMutation(operation, input, successType, clientMutationLabel) {
  const mutation = formatMutation(operation, input, clientMutationLabel);
  return graphql(
    mutation.payload,
    [REQUEST(ADMIN_ACTION_TYPE.MUTATION), SUCCESS(successType), ERROR(ADMIN_ACTION_TYPE.MUTATION)],
    {
      actionType: successType,
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime: new Date().toISOString(),
    },
  );
}

// Throws 'invalid_id', 'invalid_decision' or 'keep_not_in_pair' before any request.
export function resolveDuplicateCandidate(resolution, candidate, clientMutationLabel) {
  return performMutation(
    'resolveDuplicateCandidate',
    buildResolveInput(resolution, candidate),
    ADMIN_ACTION_TYPE.RESOLVE_CANDIDATE,
    clientMutationLabel,
  );
}

// An empty kind list scans every registered source.
export function runDuplicateScan(kinds, clientMutationLabel) {
  const input = Array.isArray(kinds) && kinds.length ? `kinds: ${JSON.stringify(kinds.map(String))}` : '';
  return performMutation('runDuplicateScan', input, ADMIN_ACTION_TYPE.RUN_SCAN, clientMutationLabel);
}

export function createDuplicateReviewTasks(uuids, clientMutationLabel) {
  return performMutation(
    'createDuplicateReviewTasks',
    `ids: ${JSON.stringify(uuids.map(String))}`,
    ADMIN_ACTION_TYPE.CREATE_REVIEW_TASKS,
    clientMutationLabel,
  );
}

// Polls the mutation log until the asynchronous mutation leaves the pending
// state or the attempts run out. Resolves to the log node, or null.
export function awaitMutationLog(clientMutationId) {
  return async (dispatch) => {
    if (!clientMutationId) return null;
    for (let attempt = 0; attempt < MUTATION_LOG_POLL_ATTEMPTS; attempt += 1) {
      // eslint-disable-next-line no-await-in-loop
      const response = await dispatch(graphqlWithVariables(
        MUTATION_LOG_QUERY,
        { clientMutationId },
        'DEDUPLICATION_ADMIN_MUTATION_LOG',
      ));
      if (response?.error) return null;
      const node = response?.payload?.data?.mutationLogs?.edges?.[0]?.node;
      if (node && node.status !== MUTATION_LOG_PENDING) return node;
      // eslint-disable-next-line no-await-in-loop, no-promise-executor-return
      await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)));
    }
    return null;
  };
}

// A mutation answering with its result: resolves to { result, error }.
function synchronousMutation(operation, variables, root, actionType) {
  return async (dispatch) => {
    const response = await dispatch(graphqlWithVariables(operation, variables, actionType));
    const errors = response?.payload?.errors || response?.payload?.response?.errors;
    if (response?.error || errors?.length) {
      const message = errors?.map((e) => e.message).join('; ') || response?.payload?.message || 'error';
      return { result: null, error: message };
    }
    return { result: response?.payload?.data?.[root] ?? null, error: null };
  };
}

function alertMutation(operation, variables, root) {
  return async (dispatch) => {
    const { result, error } = await dispatch(synchronousMutation(
      operation,
      variables,
      root,
      'DEDUPLICATION_ADMIN_ALERT_MUTATION',
    ));
    return { alert: result, error };
  };
}

// Synchronous mutations: the returned object is the updated alert or the server error.
export function acknowledgeBiometricAlert(uuid) {
  return alertMutation(ACKNOWLEDGE_ALERT_MUTATION, { id: uuid }, 'acknowledgeBiometricAlert');
}

export function resolveBiometricAlert(uuid, note) {
  return alertMutation(RESOLVE_ALERT_MUTATION, { id: uuid, note: note || null }, 'resolveBiometricAlert');
}

// Walks the audit chain on the server; resolves to { result, error } where
// result is the stored check.
export function verifyBiometricAuditChain() {
  return synchronousMutation(
    VERIFY_AUDIT_CHAIN_MUTATION,
    {},
    'verifyBiometricAuditChain',
    'DEDUPLICATION_ADMIN_VERIFY_AUDIT_CHAIN',
  );
}
