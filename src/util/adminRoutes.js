// Routes and main-menu entries of the admin screens, as data. Imports the
// constants only, so the rights of every route can be checked under `node --test`.
/* eslint-disable import/extensions -- node --test resolves ESM imports only with the extension */
import {
  CONFIG_KEYS,
  RIGHT_BIOMETRIC_AUDIT_READ,
  RIGHT_BIOMETRIC_CONFIG_READ,
  RIGHT_BIOMETRIC_READ,
  RIGHT_DUPLICATE_SEARCH,
  ROUTE_BIOMETRIC_ALERTS,
  ROUTE_BIOMETRIC_AUDIT,
  ROUTE_BIOMETRIC_CRITERIA,
  ROUTE_BIOMETRIC_RETENTION,
  ROUTE_BIOMETRIC_VERIFICATIONS,
  ROUTE_CANDIDATE,
  ROUTE_CANDIDATES,
} from '../constants.js';

export const ADMIN_PAGE = {
  CANDIDATES: 'candidates',
  CANDIDATE: 'candidate',
  BIOMETRIC_ALERTS: 'biometricAlerts',
  BIOMETRIC_AUDIT: 'biometricAudit',
  BIOMETRIC_CRITERIA: 'biometricCriteria',
  BIOMETRIC_RETENTION: 'biometricRetention',
  BIOMETRIC_VERIFICATIONS: 'biometricVerifications',
};

// fe-core's route guard and menu filters compare rights with strict equality
// against the user's numeric rights, so configured codes become numbers.
export function numericRights(value, fallback) {
  const list = (Array.isArray(value) && value.length ? value : fallback).map(Number);
  return list.filter((code) => Number.isFinite(code));
}

const menuEntry = (page, icon) => ({ id: `deduplication.${page}`, text: `menu.${page}`, icon });

// The pages of the module configuration `cfg`: path, the rights the route
// guard requires and the menu entry (null for pages reached from a list).
// biometricAdmin.enabled false drops the biometric pages and the individual tab.
export function adminRouteSpecs(cfg) {
  const biometricEnabled = cfg?.[CONFIG_KEYS.BIOMETRIC_ADMIN_ENABLED] !== false;
  const auditRights = numericRights(cfg?.[CONFIG_KEYS.RIGHTS_AUDIT_READ], [RIGHT_BIOMETRIC_AUDIT_READ]);
  const configRights = numericRights(cfg?.[CONFIG_KEYS.RIGHTS_CONFIG_READ], [RIGHT_BIOMETRIC_CONFIG_READ]);
  const pages = [
    {
      page: ADMIN_PAGE.CANDIDATES,
      path: ROUTE_CANDIDATES,
      requiredRights: [RIGHT_DUPLICATE_SEARCH],
      menu: menuEntry(ADMIN_PAGE.CANDIDATES, 'FileCopy'),
    },
    {
      page: ADMIN_PAGE.CANDIDATE,
      path: `${ROUTE_CANDIDATE}/:candidate_id`,
      requiredRights: [RIGHT_DUPLICATE_SEARCH],
      menu: null,
    },
  ];
  if (biometricEnabled) {
    pages.push(
      {
        page: ADMIN_PAGE.BIOMETRIC_ALERTS,
        path: ROUTE_BIOMETRIC_ALERTS,
        requiredRights: auditRights,
        menu: menuEntry(ADMIN_PAGE.BIOMETRIC_ALERTS, 'NotificationsActive'),
      },
      {
        page: ADMIN_PAGE.BIOMETRIC_AUDIT,
        path: ROUTE_BIOMETRIC_AUDIT,
        requiredRights: auditRights,
        menu: menuEntry(ADMIN_PAGE.BIOMETRIC_AUDIT, 'Receipt'),
      },
      {
        page: ADMIN_PAGE.BIOMETRIC_CRITERIA,
        path: ROUTE_BIOMETRIC_CRITERIA,
        requiredRights: configRights,
        menu: menuEntry(ADMIN_PAGE.BIOMETRIC_CRITERIA, 'Gavel'),
      },
      {
        page: ADMIN_PAGE.BIOMETRIC_RETENTION,
        path: ROUTE_BIOMETRIC_RETENTION,
        requiredRights: [...new Set([...configRights, ...auditRights])],
        menu: menuEntry(ADMIN_PAGE.BIOMETRIC_RETENTION, 'DeleteSweep'),
      },
      {
        page: ADMIN_PAGE.BIOMETRIC_VERIFICATIONS,
        path: ROUTE_BIOMETRIC_VERIFICATIONS,
        requiredRights: [RIGHT_BIOMETRIC_READ],
        menu: menuEntry(ADMIN_PAGE.BIOMETRIC_VERIFICATIONS, 'Fingerprint'),
      },
    );
  }
  return { biometricEnabled, pages };
}

// Whether the user rights hold one of the rights a page requires.
export function canOpenPage(rights, requiredRights) {
  return Array.isArray(rights) && requiredRights.some((right) => rights.includes(right));
}
