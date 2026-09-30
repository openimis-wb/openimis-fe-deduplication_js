/* eslint-disable default-param-last */

import {
  dispatchMutationErr,
  dispatchMutationReq,
  dispatchMutationResp,
  formatGraphQLError,
  formatServerError,
  pageInfo,
  parseData,
} from '@openimis/fe-core';
import { ERROR, REQUEST, SUCCESS } from './util/action-type';
import { mutationRejected } from './util/mutations';
import { TASK_FORM_OPEN, taskFormGate } from './util/taskResolveData';

export const ADMIN_ACTION_TYPE = {
  MUTATION: 'DEDUPLICATION_ADMIN_MUTATION',
  SEARCH_CANDIDATES: 'DEDUPLICATION_ADMIN_SEARCH_CANDIDATES',
  GET_CANDIDATE: 'DEDUPLICATION_ADMIN_GET_CANDIDATE',
  SEARCH_PAIR_SIBLINGS: 'DEDUPLICATION_ADMIN_SEARCH_PAIR_SIBLINGS',
  SEARCH_BIOMETRIC_ALERTS: 'DEDUPLICATION_ADMIN_SEARCH_BIOMETRIC_ALERTS',
  SEARCH_BIOMETRIC_AUDIT_EVENTS: 'DEDUPLICATION_ADMIN_SEARCH_BIOMETRIC_AUDIT_EVENTS',
  SEARCH_BIOMETRIC_ERASURES: 'DEDUPLICATION_ADMIN_SEARCH_BIOMETRIC_ERASURES',
  SEARCH_BIOMETRIC_VERIFICATIONS: 'DEDUPLICATION_ADMIN_SEARCH_BIOMETRIC_VERIFICATIONS',
  SEARCH_BIOMETRIC_MULTIMODAL_DECISIONS: 'DEDUPLICATION_ADMIN_SEARCH_BIOMETRIC_MULTIMODAL_DECISIONS',
  RESOLVE_CANDIDATE: 'DEDUPLICATION_ADMIN_RESOLVE_CANDIDATE',
  RUN_SCAN: 'DEDUPLICATION_ADMIN_RUN_SCAN',
  CREATE_REVIEW_TASKS: 'DEDUPLICATION_ADMIN_CREATE_REVIEW_TASKS',
  SET_TASK_FORM_GATE: 'DEDUPLICATION_ADMIN_SET_TASK_FORM_GATE',
};

export const ADMIN_MUTATION_SERVICE = {
  RESOLVE_CANDIDATE: 'resolveDuplicateCandidate',
  RUN_SCAN: 'runDuplicateScan',
  CREATE_REVIEW_TASKS: 'createDuplicateReviewTasks',
};

// Store slice name -> [action type, GraphQL root field].
const SLICES = {
  candidates: [ADMIN_ACTION_TYPE.SEARCH_CANDIDATES, 'duplicateCandidates'],
  candidate: [ADMIN_ACTION_TYPE.GET_CANDIDATE, 'duplicateCandidates'],
  pairSiblings: [ADMIN_ACTION_TYPE.SEARCH_PAIR_SIBLINGS, 'duplicateCandidates'],
  biometricAlerts: [ADMIN_ACTION_TYPE.SEARCH_BIOMETRIC_ALERTS, 'biometricAlerts'],
  biometricAuditEvents: [ADMIN_ACTION_TYPE.SEARCH_BIOMETRIC_AUDIT_EVENTS, 'biometricAuditEvents'],
  biometricErasures: [ADMIN_ACTION_TYPE.SEARCH_BIOMETRIC_ERASURES, 'biometricErasures'],
  biometricVerifications: [ADMIN_ACTION_TYPE.SEARCH_BIOMETRIC_VERIFICATIONS, 'biometricVerificationRecords'],
  biometricMultimodalDecisions: [
    ADMIN_ACTION_TYPE.SEARCH_BIOMETRIC_MULTIMODAL_DECISIONS,
    'biometricMultimodalDecisions',
  ],
};

const emptySlice = () => ({
  fetching: false,
  fetched: false,
  error: null,
  items: [],
  pageInfo: {},
  totalCount: 0,
});

const INITIAL_STATE = {
  submittingMutation: false,
  mutation: {},
  taskFormGate: taskFormGate(TASK_FORM_OPEN),
  ...Object.fromEntries(Object.keys(SLICES).map((slice) => [slice, emptySlice()])),
};

function sliceReducer(state, action) {
  const entry = Object.entries(SLICES).find(([, [type]]) => [
    REQUEST(type), SUCCESS(type), ERROR(type),
  ].includes(action.type));
  if (!entry) return null;
  const [slice, [type, root]] = entry;
  switch (action.type) {
    case REQUEST(type):
      return {
        ...state,
        [slice]: {
          ...state[slice], fetching: true, fetched: false, error: null,
        },
      };
    case SUCCESS(type): {
      const data = action.payload?.data?.[root];
      const info = pageInfo(data);
      return {
        ...state,
        [slice]: {
          fetching: false,
          fetched: true,
          error: formatGraphQLError(action.payload),
          items: parseData(data),
          pageInfo: info,
          totalCount: info.totalCount ?? 0,
        },
      };
    }
    case ERROR(type):
      return {
        ...state,
        [slice]: { ...state[slice], fetching: false, error: formatServerError(action.payload) },
      };
    default:
      return null;
  }
}

// A rejected response means the mutation was never registered, so no mutation
// log will appear for it.
function mutationResponse(state, service, action) {
  if (mutationRejected(action, service)) {
    return { ...state, submittingMutation: false, mutation: { ...state.mutation, requestFailed: true } };
  }
  return dispatchMutationResp(state, service, action);
}

function adminReducer(state = INITIAL_STATE, action) {
  const sliced = sliceReducer(state, action);
  if (sliced) return sliced;
  switch (action.type) {
    case REQUEST(ADMIN_ACTION_TYPE.MUTATION):
      return dispatchMutationReq(state, action);
    case ERROR(ADMIN_ACTION_TYPE.MUTATION):
      return {
        ...dispatchMutationErr(state, action),
        submittingMutation: false,
        mutation: { ...state.mutation, requestFailed: true },
      };
    case SUCCESS(ADMIN_ACTION_TYPE.RESOLVE_CANDIDATE):
      return mutationResponse(state, ADMIN_MUTATION_SERVICE.RESOLVE_CANDIDATE, action);
    case SUCCESS(ADMIN_ACTION_TYPE.RUN_SCAN):
      return mutationResponse(state, ADMIN_MUTATION_SERVICE.RUN_SCAN, action);
    case SUCCESS(ADMIN_ACTION_TYPE.CREATE_REVIEW_TASKS):
      return mutationResponse(state, ADMIN_MUTATION_SERVICE.CREATE_REVIEW_TASKS, action);
    case ADMIN_ACTION_TYPE.SET_TASK_FORM_GATE:
      return { ...state, taskFormGate: action.payload };
    default:
      return state;
  }
}

export default adminReducer;
