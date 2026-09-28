import React from 'react';
import { FormattedMessage } from '@openimis/fe-core';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import NotificationsActiveIcon from '@material-ui/icons/NotificationsActive';
import ReceiptIcon from '@material-ui/icons/Receipt';
import GavelIcon from '@material-ui/icons/Gavel';
import DeleteSweepIcon from '@material-ui/icons/DeleteSweep';
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
import DeduplicationMainMenu from './menus/DeduplicationMainMenu';
import DuplicateCandidatesPage from './pages/DuplicateCandidatesPage';
import DuplicateCandidatePage from './pages/DuplicateCandidatePage';
import BiometricAlertsPage from './pages/BiometricAlertsPage';
import BiometricAuditPage from './pages/BiometricAuditPage';
import BiometricCriteriaPage from './pages/BiometricCriteriaPage';
import BiometricRetentionPage from './pages/BiometricRetentionPage';
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
  INDIVIDUAL_SUBJECT_MODEL,
  MAIN_MENU_ID,
  MODULE_KEY,
  REF_ROUTE_BIOMETRIC_ALERTS,
  REF_ROUTE_BIOMETRIC_AUDIT,
  REF_ROUTE_BIOMETRIC_CRITERIA,
  REF_ROUTE_BIOMETRIC_RETENTION,
  REF_ROUTE_CANDIDATE,
  REF_ROUTE_CANDIDATES,
  ROUTE_BIOMETRIC_ALERTS,
  ROUTE_BIOMETRIC_AUDIT,
  ROUTE_BIOMETRIC_CRITERIA,
  ROUTE_BIOMETRIC_RETENTION,
  ROUTE_CANDIDATE,
  ROUTE_CANDIDATES,
  SUBJECT_CARD_CONTRIBUTION_KEY,
} from './constants';
import { ADMIN_PAGE, adminRouteSpecs, canOpenPage } from './util/adminRoutes';

const PAGE_COMPONENTS = {
  [ADMIN_PAGE.CANDIDATES]: DuplicateCandidatesPage,
  [ADMIN_PAGE.CANDIDATE]: DuplicateCandidatePage,
  [ADMIN_PAGE.BIOMETRIC_ALERTS]: BiometricAlertsPage,
  [ADMIN_PAGE.BIOMETRIC_AUDIT]: BiometricAuditPage,
  [ADMIN_PAGE.BIOMETRIC_CRITERIA]: BiometricCriteriaPage,
  [ADMIN_PAGE.BIOMETRIC_RETENTION]: BiometricRetentionPage,
};

const MENU_ICONS = {
  FileCopy: FileCopyIcon,
  NotificationsActive: NotificationsActiveIcon,
  Receipt: ReceiptIcon,
  Gavel: GavelIcon,
  DeleteSweep: DeleteSweepIcon,
};

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
  'core.MainMenu': [{ name: MAIN_MENU_ID, component: DeduplicationMainMenu }],
  [SUBJECT_CARD_CONTRIBUTION_KEY]: [{ subjectModel: INDIVIDUAL_SUBJECT_MODEL, component: IndividualSubjectCard }],
  refs: [
    { key: REF_ROUTE_CANDIDATES, ref: ROUTE_CANDIDATES },
    { key: REF_ROUTE_CANDIDATE, ref: ROUTE_CANDIDATE },
    { key: REF_ROUTE_BIOMETRIC_ALERTS, ref: ROUTE_BIOMETRIC_ALERTS },
    { key: REF_ROUTE_BIOMETRIC_AUDIT, ref: ROUTE_BIOMETRIC_AUDIT },
    { key: REF_ROUTE_BIOMETRIC_CRITERIA, ref: ROUTE_BIOMETRIC_CRITERIA },
    { key: REF_ROUTE_BIOMETRIC_RETENTION, ref: ROUTE_BIOMETRIC_RETENTION },
    { key: 'deduplication.DuplicateCandidateSearcher', ref: DuplicateCandidateSearcher },
    { key: 'deduplication.BiometricTemplatesPanel', ref: BiometricTemplatesPanel },
    { key: 'deduplication.SubjectCard', ref: SubjectCard },
  ],
};

// Routes, main-menu entries and the individual tab that depend on the module
// configuration passed to the factory.
function adminContributions(cfg) {
  const { biometricEnabled, pages } = adminRouteSpecs(cfg);
  const routes = pages.map((spec) => ({
    path: spec.path,
    requiredRights: spec.requiredRights,
    component: PAGE_COMPONENTS[spec.page],
  }));
  const menu = pages.filter((spec) => spec.menu).map((spec) => {
    const Icon = MENU_ICONS[spec.menu.icon];
    return {
      id: spec.menu.id,
      text: <FormattedMessage module={MODULE_KEY} id={spec.menu.text} />,
      icon: <Icon />,
      route: `/${spec.path}`,
      filter: (rights) => canOpenPage(rights, spec.requiredRights),
    };
  });
  const contributions = { [MAIN_MENU_ID]: menu, 'core.Router': routes };
  if (biometricEnabled) {
    contributions['individual.TabPanel.label'] = [SubjectBiometricsTabLabel];
    contributions['individual.TabPanel.panel'] = [SubjectBiometricsTabPanel];
  }
  return contributions;
}

// eslint-disable-next-line import/prefer-default-export
export const DeduplicationModule = (cfg) => ({ ...DEFAULT_CONFIG, ...adminContributions(cfg), ...cfg });
