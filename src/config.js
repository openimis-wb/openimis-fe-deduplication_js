import {
  CONFIG_KEYS,
  CONFIG_MODULE,
  DEFAULT_ALERT_RULE_KINDS,
  DEFAULT_CANDIDATE_KINDS,
  DEFAULT_PAGE_SIZE,
  RIGHT_BIOMETRIC_ALERT_TRIAGE,
  RIGHT_BIOMETRIC_AUDIT_READ,
  RIGHT_BIOMETRIC_AUDIT_VERIFY,
  RIGHT_BIOMETRIC_CONFIG_READ,
  ROWS_PER_PAGE_OPTIONS,
} from './constants';

const conf = (modulesManager, key, fallback) => (
  modulesManager?.getConf ? modulesManager.getConf(CONFIG_MODULE, key, fallback) : fallback
);

const asList = (value, fallback) => (Array.isArray(value) && value.length ? value : fallback);

// Rights are compared with strict equality against the user's numeric rights
// by the route guard, so configured codes are normalised to numbers.
const asRights = (value, fallback) => asList(value, fallback)
  .map(Number)
  .filter((code) => Number.isFinite(code));

export const candidateKinds = (mm) => asList(conf(mm, CONFIG_KEYS.CANDIDATE_KINDS), DEFAULT_CANDIDATE_KINDS);

export const alertRuleKinds = (mm) => {
  const value = conf(mm, CONFIG_KEYS.ALERT_RULE_KINDS);
  return Array.isArray(value) ? value : DEFAULT_ALERT_RULE_KINDS;
};

export const rowsPerPageOptions = (mm) => asList(conf(mm, CONFIG_KEYS.ROWS_PER_PAGE_OPTIONS), ROWS_PER_PAGE_OPTIONS);

export const candidatesPageSize = (mm) => {
  const value = Number(conf(mm, CONFIG_KEYS.CANDIDATES_PAGE_SIZE, DEFAULT_PAGE_SIZE));
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_PAGE_SIZE;
};

export const biometricAdminEnabled = (mm) => conf(mm, CONFIG_KEYS.BIOMETRIC_ADMIN_ENABLED, true) !== false;

export const auditReadRights = (mm) => asRights(conf(mm, CONFIG_KEYS.RIGHTS_AUDIT_READ), [RIGHT_BIOMETRIC_AUDIT_READ]);

export const alertTriageRights = (mm) => asRights(
  conf(mm, CONFIG_KEYS.RIGHTS_ALERT_TRIAGE),
  [RIGHT_BIOMETRIC_ALERT_TRIAGE],
);

export const configReadRights = (mm) => asRights(
  conf(mm, CONFIG_KEYS.RIGHTS_CONFIG_READ),
  [RIGHT_BIOMETRIC_CONFIG_READ],
);

export const auditVerifyRights = (mm) => asRights(
  conf(mm, CONFIG_KEYS.RIGHTS_AUDIT_VERIFY),
  [RIGHT_BIOMETRIC_AUDIT_VERIFY],
);
