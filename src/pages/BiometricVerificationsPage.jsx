import * as React from 'react';
import { Box, Tab, Tabs } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Helmet, useModulesManager, useTranslations } from '@openimis/fe-core';
import { MODULE_KEY, RIGHT_BIOMETRIC_IDENTIFY, RIGHT_BIOMETRIC_READ } from '../constants';
import { configReadRights } from '../config';
import { verificationScreenAccess } from '../util/verifications';
import { useUserRights } from '../components/common/adminHooks';
import BiometricVerificationSearcher from '../components/biometric/BiometricVerificationSearcher';
import BiometricDecisionSearcher from '../components/biometric/BiometricDecisionSearcher';

const StyledPage = styled('div')(({ theme }) => ({
  ...(theme.page ?? {}),
}));

const TAB_VERIFICATIONS = 'verifications';
const TAB_DECISIONS = 'decisions';

// Verification records and multimodal decisions, both under the read right.
function BiometricVerificationsPage() {
  const modulesManager = useModulesManager();
  const rights = useUserRights();
  const { formatMessage } = useTranslations(MODULE_KEY, modulesManager);
  const [tab, setTab] = React.useState(TAB_VERIFICATIONS);
  const access = verificationScreenAccess(rights, {
    readRights: [RIGHT_BIOMETRIC_READ],
    identifyRights: [RIGHT_BIOMETRIC_IDENTIFY],
    configRights: configReadRights(modulesManager),
  });
  if (!access.canRead) return null;
  return (
    <StyledPage>
      <Helmet title={formatMessage('biometric.verification.helmet')} />
      <Box mb={2}>
        <Tabs value={tab} onChange={(event, value) => setTab(value)}>
          <Tab value={TAB_VERIFICATIONS} label={formatMessage('biometric.verification.tab')} />
          <Tab value={TAB_DECISIONS} label={formatMessage('biometric.decision.tab')} />
        </Tabs>
      </Box>
      {tab === TAB_VERIFICATIONS && <BiometricVerificationSearcher canIdentify={access.canIdentify} />}
      {tab === TAB_DECISIONS && <BiometricDecisionSearcher canIdentify={access.canIdentify} />}
    </StyledPage>
  );
}

export default BiometricVerificationsPage;
