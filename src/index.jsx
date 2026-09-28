import React from 'react';
import { FormattedMessage } from '@openimis/fe-core';
import messagesEn from './translations/en.json';
import messagesFr from './translations/fr.json';
import DeduplicationFieldSelectionDialog from './components/dialogs/DeduplicationFieldSelectionDialog';
import reducer from './reducer';
import adminReducer from './adminReducer';
import {
  DeduplicationResolutionItemFormatters,
  DeduplicationResolutionTaskTableHeaders,
} from './components/tasks/DeduplicationResolutionTask';
import {
  DuplicateCandidateTaskItemFormatters,
  DuplicateCandidateTaskTableHeaders,
} from './components/tasks/DuplicateCandidateTask';
import DuplicateCandidatesPage from './pages/DuplicateCandidatesPage';
import DuplicateCandidatePage from './pages/DuplicateCandidatePage';
import BiometricAlertsPage from './pages/BiometricAlertsPage';
import BiometricAuditPage from './pages/BiometricAuditPage';
import BiometricCriteriaPage from './pages/BiometricCriteriaPage';
import BiometricRetentionPage from './pages/BiometricRetentionPage';
import BiometricVerificationsPage from './pages/BiometricVerificationsPage';
import DuplicateCandidateSearcher from './components/candidates/DuplicateCandidateSearcher';
import SubjectCard from './components/candidates/SubjectCard';
import IndividualSubjectCard from './components/candidates/IndividualSubjectCard';
import BiometricTemplatesPanel from './components/biometric/BiometricTemplatesPanel';
import {
  SubjectBiometricsTabLabel,
  SubjectBiometricsTabPanel,
} from './components/biometric/SubjectBiometricsTab';
import {
  ADMIN_STORE_KEY,
  CANDIDATE_TASK_SOURCE,
  CONFIG_KEYS,
  INDIVIDUAL_SUBJECT_MODEL,
  MAIN_MENU_ID,
  REF_ROUTE_BIOMETRIC_ALERTS,
  REF_ROUTE_BIOMETRIC_AUDIT,
  REF_ROUTE_BIOMETRIC_CRITERIA,
  REF_ROUTE_BIOMETRIC_RETENTION,
  REF_ROUTE_BIOMETRIC_VERIFICATIONS,
  REF_ROUTE_CANDIDATE,
  REF_ROUTE_CANDIDATES,
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
  SUBJECT_CARD_CONTRIBUTION_KEY,
} from './constants';

const DEFAULT_CONFIG = {
  translations: [{ key: 'en', messages: messagesEn }, { key: 'fr', messages: messagesFr }],
  reducers: [{ key: 'deduplication', reducer }, { key: ADMIN_STORE_KEY, reducer: adminReducer }],
  'deduplication.deduplicationFieldSelectionDialog': [
    DeduplicationFieldSelectionDialog,
  ],
  'tasksManagement.tasks': [{
    text: <FormattedMessage module="deduplication" id="tasks.deduplication.title" />,
    tableHeaders: DeduplicationResolutionTaskTableHeaders,
    itemFormatters: DeduplicationResolutionItemFormatters,
    taskSource: ['CreateDeduplicationReviewTasksService'],
  }, {
    text: <FormattedMessage module="deduplication" id="tasks.candidate.title" />,
    tableHeaders: DuplicateCandidateTaskTableHeaders,
    itemFormatters: DuplicateCandidateTaskItemFormatters,
    taskSource: [CANDIDATE_TASK_SOURCE],
  }],
  'core.MainMenu': [{
    name: 'deduplication.mainMenu', id: MAIN_MENU_ID, icon: 'ContentCopy', text: 'deduplication.mainMenu',
  }],
  [SUBJECT_CARD_CONTRIBUTION_KEY]: [{ subjectModel: INDIVIDUAL_SUBJECT_MODEL, component: IndividualSubjectCard }],
  refs: [
    { key: REF_ROUTE_CANDIDATES, ref: ROUTE_CANDIDATES },
    { key: REF_ROUTE_CANDIDATE, ref: ROUTE_CANDIDATE },
    { key: REF_ROUTE_BIOMETRIC_ALERTS, ref: ROUTE_BIOMETRIC_ALERTS },
    { key: REF_ROUTE_BIOMETRIC_AUDIT, ref: ROUTE_BIOMETRIC_AUDIT },
    { key: REF_ROUTE_BIOMETRIC_CRITERIA, ref: ROUTE_BIOMETRIC_CRITERIA },
    { key: REF_ROUTE_BIOMETRIC_RETENTION, ref: ROUTE_BIOMETRIC_RETENTION },
    { key: REF_ROUTE_BIOMETRIC_VERIFICATIONS, ref: ROUTE_BIOMETRIC_VERIFICATIONS },
    { key: 'deduplication.DuplicateCandidateSearcher', ref: DuplicateCandidateSearcher },
    { key: 'deduplication.BiometricTemplatesPanel', ref: BiometricTemplatesPanel },
    { key: 'deduplication.SubjectCard', ref: SubjectCard },
  ],
};

// Route rights are matched by strict equality against the user's numeric rights.
const numericRights = (value, fallback) => {
  const list = (Array.isArray(value) && value.length ? value : fallback).map(Number);
  return list.filter((code) => Number.isFinite(code));
};

// Menu entries, routes and the individual tab that depend on the module
// configuration passed to the factory; biometricAdmin.enabled false drops the
// biometric screens.
function adminContributions(cfg) {
  const biometricEnabled = cfg?.[CONFIG_KEYS.BIOMETRIC_ADMIN_ENABLED] !== false;
  const auditRights = numericRights(cfg?.[CONFIG_KEYS.RIGHTS_AUDIT_READ], [RIGHT_BIOMETRIC_AUDIT_READ]);
  const configRights = numericRights(cfg?.[CONFIG_KEYS.RIGHTS_CONFIG_READ], [RIGHT_BIOMETRIC_CONFIG_READ]);
  const menu = [{ route: ROUTE_CANDIDATES }];
  const routes = [
    {
      path: ROUTE_CANDIDATES,
      text: 'deduplication.menu.candidates',
      id: 'deduplication.candidates',
      icon: 'ContentCopy',
      rights: [RIGHT_DUPLICATE_SEARCH],
      component: DuplicateCandidatesPage,
    },
    { path: `${ROUTE_CANDIDATE}/:candidate_id`, rights: [RIGHT_DUPLICATE_SEARCH], component: DuplicateCandidatePage },
  ];
  const contributions = {};
  if (biometricEnabled) {
    menu.push(
      { route: ROUTE_BIOMETRIC_ALERTS },
      { route: ROUTE_BIOMETRIC_AUDIT },
      { route: ROUTE_BIOMETRIC_CRITERIA },
      { route: ROUTE_BIOMETRIC_RETENTION },
      { route: ROUTE_BIOMETRIC_VERIFICATIONS },
    );
    routes.push(
      {
        path: ROUTE_BIOMETRIC_ALERTS,
        text: 'deduplication.menu.biometricAlerts',
        id: 'deduplication.biometricAlerts',
        icon: 'NotificationsActive',
        rights: auditRights,
        component: BiometricAlertsPage,
      },
      {
        path: ROUTE_BIOMETRIC_AUDIT,
        text: 'deduplication.menu.biometricAudit',
        id: 'deduplication.biometricAudit',
        icon: 'ReceiptLong',
        rights: auditRights,
        component: BiometricAuditPage,
      },
      {
        path: ROUTE_BIOMETRIC_CRITERIA,
        text: 'deduplication.menu.biometricCriteria',
        id: 'deduplication.biometricCriteria',
        icon: 'Rule',
        rights: configRights,
        component: BiometricCriteriaPage,
      },
      {
        path: ROUTE_BIOMETRIC_RETENTION,
        text: 'deduplication.menu.biometricRetention',
        id: 'deduplication.biometricRetention',
        icon: 'AutoDelete',
        rights: [...new Set([...configRights, ...auditRights])],
        component: BiometricRetentionPage,
      },
      {
        path: ROUTE_BIOMETRIC_VERIFICATIONS,
        text: 'deduplication.menu.biometricVerifications',
        id: 'deduplication.biometricVerifications',
        icon: 'Fingerprint',
        rights: [RIGHT_BIOMETRIC_READ],
        component: BiometricVerificationsPage,
      },
    );
    contributions['individual.TabPanel.label'] = [SubjectBiometricsTabLabel];
    contributions['individual.TabPanel.panel'] = [SubjectBiometricsTabPanel];
  }
  return { [MAIN_MENU_ID]: menu, 'core.Router': routes, ...contributions };
}

// eslint-disable-next-line import/prefer-default-export
export const DeduplicationModule = (cfg) => ({ ...DEFAULT_CONFIG, ...adminContributions(cfg), ...cfg });
