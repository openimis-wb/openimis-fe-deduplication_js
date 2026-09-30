export const BASIC_FIELDS = [
  { id: 'first_name', name: 'first_name' },
  { id: 'last_name', name: 'last_name' },
  { id: 'dob', name: 'dob' },
];
export const MODULE_NAME = 'Deduplication';

export const RIGHT_DUPLICATE_REVIEW_TASKS = 172001;
export const RIGHT_DUPLICATE_RESOLVE = 172003;
export const RIGHT_DUPLICATE_SCAN = 172004;
export const RIGHT_DUPLICATE_SEARCH = 172005;
export const RIGHT_BIOMETRIC_IDENTIFY = 174003;
export const RIGHT_BIOMETRIC_READ = 174004;
export const RIGHT_BIOMETRIC_AUDIT_READ = 174005;
export const RIGHT_BIOMETRIC_ALERT_TRIAGE = 174006;
export const RIGHT_BIOMETRIC_CONFIG_READ = 174007;
export const RIGHT_BIOMETRIC_AUDIT_VERIFY = 174008;

export const ROUTE_CANDIDATES = 'deduplication/candidates';
export const ROUTE_CANDIDATE = 'deduplication/candidates/candidate';
export const ROUTE_BIOMETRIC_ALERTS = 'deduplication/biometric/alerts';
export const ROUTE_BIOMETRIC_AUDIT = 'deduplication/biometric/audit';
export const ROUTE_BIOMETRIC_CRITERIA = 'deduplication/biometric/criteria';
export const ROUTE_BIOMETRIC_RETENTION = 'deduplication/biometric/retention';
export const ROUTE_BIOMETRIC_VERIFICATIONS = 'deduplication/biometric/verifications';

export const REF_ROUTE_CANDIDATES = 'deduplication.route.candidates';
export const REF_ROUTE_CANDIDATE = 'deduplication.route.candidate';
export const REF_ROUTE_BIOMETRIC_ALERTS = 'deduplication.route.biometricAlerts';
export const REF_ROUTE_BIOMETRIC_AUDIT = 'deduplication.route.biometricAudit';
export const REF_ROUTE_BIOMETRIC_CRITERIA = 'deduplication.route.biometricCriteria';
export const REF_ROUTE_BIOMETRIC_RETENTION = 'deduplication.route.biometricRetention';
export const REF_ROUTE_BIOMETRIC_VERIFICATIONS = 'deduplication.route.biometricVerifications';

export const MODULE_KEY = 'deduplication';
export const CONFIG_MODULE = 'fe-deduplication';
export const ADMIN_STORE_KEY = 'deduplicationAdmin';

export const CANDIDATE_STATUS = {
  OPEN: 'OPEN',
  CONFIRMED: 'CONFIRMED',
  DISMISSED: 'DISMISSED',
};
export const DEFAULT_CANDIDATE_KINDS = ['demographic', 'identifier', 'biometric'];
export const CANDIDATE_TASK_SOURCE = 'deduplication_candidate';
export const INDIVIDUAL_SUBJECT_MODEL = 'individual.Individual';

export const ALERT_STATES = ['NEW', 'ACKNOWLEDGED', 'RESOLVED'];
export const ALERT_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH'];
export const DEFAULT_ALERT_RULE_KINDS = ['FAILED_VERIFICATIONS', 'IMPERSONATION_SUSPECTED', 'ACCESS_BURST'];
export const AUDIT_ACTIONS = [
  'template.enrol',
  'template.enrol_refused',
  'verify',
  'verify.multimodal',
  'identify',
  'impersonation.suspected',
  'template.consolidate',
  'template.purge',
  'template.read',
  'template.list',
  'alert.acknowledge',
  'alert.resolve',
];
// Reasons services._erase() writes on an erasure tombstone.
export const ERASURE_REASONS = ['retention', 'ACTIVE_AGE'];

export const SUBJECT_CARD_CONTRIBUTION_KEY = 'deduplication.SubjectCard';
export const MAIN_MENU_ID = 'deduplication.MainMenu';
export const BIOMETRICS_TAB_VALUE = 'DeduplicationBiometricsTab';

export const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100];
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_DEBOUNCE_TIME = 500;

// Keys read with modulesManager.getConf(CONFIG_MODULE, key, default).
export const CONFIG_KEYS = {
  CANDIDATE_KINDS: 'candidateKinds',
  CANDIDATES_PAGE_SIZE: 'candidatesPageSize',
  ROWS_PER_PAGE_OPTIONS: 'rowsPerPageOptions',
  BIOMETRIC_ADMIN_ENABLED: 'biometricAdmin.enabled',
  ALERT_RULE_KINDS: 'alertRuleKinds',
  RIGHTS_AUDIT_READ: 'rights.auditRead',
  RIGHTS_ALERT_TRIAGE: 'rights.alertTriage',
  RIGHTS_CONFIG_READ: 'rights.configRead',
  RIGHTS_AUDIT_VERIFY: 'rights.auditVerify',
};
