// GraphQL projections and variable-based queries of the admin screens. No
// imports, so the strings can be checked against the backend schema outside the bundle.

export const CANDIDATE_PROJECTION = [
  'id',
  'subjectModel',
  'subjectA',
  'subjectB',
  'kind',
  'source',
  'score',
  'evidence',
  'status',
  'reviewedBy',
  'reviewedAt',
  'decisionNote',
  'dateCreated',
  'dateUpdated',
  'task { id status }',
];

export const ALERT_PROJECTION = [
  'id',
  'ruleKind',
  'severity',
  'state',
  'title',
  'detail',
  'occurrences',
  'subjectModel',
  'subjectId',
  'triggeredAt',
  'lastSeenAt',
  'acknowledgedBy',
  'acknowledgedAt',
  'resolvedBy',
  'resolvedAt',
  'resolutionNote',
];

export const AUDIT_EVENT_PROJECTION = [
  'id',
  'sequence',
  'action',
  'actor',
  'subjectModel',
  'subjectId',
  'modality',
  'payload',
  'createdAt',
  'prevHash',
  'hash',
];

export const ERASURE_PROJECTION = [
  'id',
  'subjectModel',
  'subjectId',
  'modalities',
  'erased',
  'reason',
  'erasedBy',
  'erasedAt',
];

const IMPERSONATION_PROBE_FIELDS = `impersonation {
    status suspected threshold margin topK claimedScore matchedSubjectModel matchedSubjectId matchedScore
    candidates { subjectModel subjectId score suspect }
    error latencyMs
  }`;

export const VERIFICATION_RECORD_PROJECTION = [
  'id',
  'subjectModel',
  'subjectId',
  'modality',
  'score',
  'threshold',
  'verified',
  'origin',
  'fallback',
  'deviceId',
  'actor',
  'createdAt',
  'riskProfile',
  'impersonationSkipReason',
  'templateSkipReason',
  IMPERSONATION_PROBE_FIELDS,
];

export const MULTIMODAL_DECISION_PROJECTION = [
  'id',
  'subjectModel',
  'subjectId',
  'outcome',
  'score',
  'reasons',
  'riskProfile',
  'modalities',
  'verificationIds',
  'fallback',
  'deviceId',
  'actor',
  'createdAt',
];

export const VERIFICATION_RECORD_QUERY = `query BiometricVerificationRecord($id: ID!) {
  node(id: $id) {
    ... on BiometricVerificationGQLType { ${VERIFICATION_RECORD_PROJECTION.join(' ')} }
  }
}`;

export const ERASURE_FILTER_VALUES_QUERY = `query BiometricErasureFilterValues {
  biometricErasureFilterValues { erasedBy subjectModel }
}`;

export const RISK_PROFILE_NAMES_QUERY = `query BiometricRiskProfileNames {
  biometricDecisionCriteria { profiles { name } }
}`;

const ALERT_FIELDS = ALERT_PROJECTION.join(' ');

export const ACKNOWLEDGE_ALERT_MUTATION = `mutation AcknowledgeBiometricAlert($id: String!) {
  acknowledgeBiometricAlert(id: $id) { ${ALERT_FIELDS} }
}`;

export const RESOLVE_ALERT_MUTATION = `mutation ResolveBiometricAlert($id: String!, $note: String) {
  resolveBiometricAlert(id: $id, note: $note) { ${ALERT_FIELDS} }
}`;

export const MUTATION_LOG_QUERY = `query DeduplicationMutationLog($clientMutationId: String) {
  mutationLogs(clientMutationId: $clientMutationId) { edges { node { status error clientMutationId } } }
}`;

export const BIOMETRIC_TEMPLATES_QUERY = `query BiometricTemplatesPanel($subjectId: String!, $subjectModel: String) {
  biometricTemplates(subjectId: $subjectId, subjectModel: $subjectModel) {
    id subjectModel subjectId modality position kind quality provider modelName encrypted
    validityFrom validityTo
    qualityVerdict {
      status mode modality reasons version
      measures { name value limit kind passed source detail }
    }
  }
}`;

export const INDIVIDUAL_SUBJECT_QUERY = `query DeduplicationIndividualSubject($id: ID) {
  individual(id: $id, first: 1) {
    edges { node { id firstName lastName dob isDeleted dateCreated jsonExt } }
  }
}`;

export const AUDIT_HEAD_QUERY = `query BiometricAuditHead {
  biometricAuditChainHead { headSequence headHash eventCount createdAt }
}`;

export const CANDIDATE_STATUS_QUERY = `query DuplicateCandidateStatus($id: ID) {
  duplicateCandidates(id: $id, first: 1) {
    edges { node { id status reviewedBy reviewedAt } }
  }
}`;

export const PAIR_STATUS_QUERY = `query DeduplicationPairStatus(
  $subjectModel: String, $subjectA: String, $subjectB: String
) {
  duplicateCandidates(
    subjectModel: $subjectModel, subjectA: $subjectA, subjectB: $subjectB, first: 20
  ) {
    edges { node { id subjectA subjectB status } }
  }
}`;

// Runs the checks resolveDuplicateCandidate would run for a decision, and writes nothing.
export const RESOLVE_CHECK_QUERY = `query DuplicateCandidateResolveCheck(
  $candidateId: UUID!, $decision: String!, $keep: String
) {
  duplicateCandidateResolveCheck(candidateId: $candidateId, decision: $decision, keep: $keep) {
    ok code message
  }
}`;

export const USERNAME_QUERY = `query DeduplicationUsername($id: ID) {
  users(id: $id, first: 1) { edges { node { username } } }
}`;

const MODALITY_VALUES = '{ modality value }';
const FUSION_RULES_FIELDS = `acceptThreshold reviewThreshold floors ${MODALITY_VALUES} floorDecision required
    modalityThresholds ${MODALITY_VALUES} weights ${MODALITY_VALUES}`;

export const DECISION_CRITERIA_QUERY = `query BiometricDecisionCriteria {
  biometricDecisionCriteria {
    base { ${FUSION_RULES_FIELDS} }
    profiles {
      name valid errors
      overrides {
        acceptThreshold reviewThreshold floors ${MODALITY_VALUES} floorDecision required
        modalityThresholds ${MODALITY_VALUES}
      }
      effective { ${FUSION_RULES_FIELDS} }
    }
  }
}`;

export const RETENTION_POLICY_QUERY = `query BiometricRetentionPolicy {
  biometricRetentionPolicy {
    templateRetentionDays purgeEnabled activeTemplateRetentionDays purgeActiveEnabled
  }
}`;

const CHAIN_CHECK_FIELDS = `id ok checkedAt checkedBy checked headSequence headHash
    divergenceKind divergenceSequence divergenceDetail`;

export const AUDIT_CHAIN_STATUS_QUERY = `query BiometricAuditChainStatus {
  biometricAuditChainStatus { ${CHAIN_CHECK_FIELDS} }
}`;

export const VERIFY_AUDIT_CHAIN_MUTATION = `mutation VerifyBiometricAuditChain {
  verifyBiometricAuditChain { ${CHAIN_CHECK_FIELDS} }
}`;
