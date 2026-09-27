import * as React from 'react';
import { Box, Button, Tab } from '@mui/material';
import { useHistory, useModulesManager, useTranslations } from '@openimis/fe-core';
import {
  BIOMETRICS_TAB_VALUE,
  INDIVIDUAL_SUBJECT_MODEL,
  MODULE_KEY,
  REF_ROUTE_CANDIDATES,
  RIGHT_BIOMETRIC_READ,
  RIGHT_DUPLICATE_SEARCH,
} from '../../constants';
import { biometricAdminEnabled } from '../../config';
import { hasRight, toUuid } from '../../util/gql';
import { useUserRights } from '../common/adminHooks';
import BiometricTemplatesPanel from './BiometricTemplatesPanel';

function useTabEnabled(rights, individual) {
  const modulesManager = useModulesManager();
  const storeRights = useUserRights();
  return !!individual
    && biometricAdminEnabled(modulesManager)
    && hasRight(rights ?? storeRights, RIGHT_BIOMETRIC_READ);
}

// Tab label for the 'individual.TabPanel.label' contribution of fe-individual.
function SubjectBiometricsTabLabel({
  rights, onChange, tabStyle, isSelected, individual,
}) {
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(MODULE_KEY, modulesManager);
  if (!useTabEnabled(rights, individual)) return null;
  return (
    <Tab
      onChange={onChange}
      className={tabStyle(BIOMETRICS_TAB_VALUE)}
      selected={isSelected(BIOMETRICS_TAB_VALUE)}
      value={BIOMETRICS_TAB_VALUE}
      label={formatMessage('biometric.tab.label')}
    />
  );
}

// Tab panel for the 'individual.TabPanel.panel' contribution of fe-individual.
function SubjectBiometricsTabPanel({ rights, value, individual }) {
  const modulesManager = useModulesManager();
  const history = useHistory();
  const { formatMessage } = useTranslations(MODULE_KEY, modulesManager);
  const enabled = useTabEnabled(rights, individual);
  const subjectId = toUuid(individual?.id);
  if (!enabled || value !== BIOMETRICS_TAB_VALUE || !subjectId) return null;

  const openCandidates = () => history.push({
    pathname: `/${modulesManager.getRef(REF_ROUTE_CANDIDATES)}`,
    search: `?subjectId=${encodeURIComponent(subjectId)}`,
  });

  return (
    <Box p={1}>
      <BiometricTemplatesPanel subjectId={subjectId} subjectModel={INDIVIDUAL_SUBJECT_MODEL} />
      {hasRight(rights, RIGHT_DUPLICATE_SEARCH) && (
        <Box display="flex" justifyContent="flex-end" pt={1}>
          <Button variant="outlined" onClick={openCandidates}>{formatMessage('biometric.tab.candidates')}</Button>
        </Box>
      )}
    </Box>
  );
}

export { SubjectBiometricsTabLabel, SubjectBiometricsTabPanel };
