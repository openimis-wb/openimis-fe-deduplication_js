import * as React from 'react';
import { Box, Tab, Tabs } from '@material-ui/core';
import { Helmet, useModulesManager, useTranslations } from '@openimis/fe-core';
import { MODULE_KEY, RIGHT_BIOMETRIC_IDENTIFY, RIGHT_BIOMETRIC_READ } from '../constants';
import { configReadRights } from '../config';
import { verificationScreenAccess } from '../util/verifications';
import { useUserRights } from '../components/common/adminHooks';
import { usePageStyles } from '../components/common/adminStyles';
import BiometricVerificationSearcher from '../components/biometric/BiometricVerificationSearcher';
import BiometricDecisionSearcher from '../components/biometric/BiometricDecisionSearcher';

const TAB_VERIFICATIONS = 'verifications';
const TAB_DECISIONS = 'decisions';

// Verification records and multimodal decisions, both under the read right.
function BiometricVerificationsPage() {
  const classes = usePageStyles();
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
    <div className={classes.page}>
      <Helmet title={formatMessage('biometric.verification.helmet')} />
      <Box mb={2}>
        <Tabs value={tab} onChange={(event, value) => setTab(value)}>
          <Tab value={TAB_VERIFICATIONS} label={formatMessage('biometric.verification.tab')} />
          <Tab value={TAB_DECISIONS} label={formatMessage('biometric.decision.tab')} />
        </Tabs>
      </Box>
      {tab === TAB_VERIFICATIONS && <BiometricVerificationSearcher canIdentify={access.canIdentify} />}
      {tab === TAB_DECISIONS && <BiometricDecisionSearcher canIdentify={access.canIdentify} />}
    </div>
  );
}

export default BiometricVerificationsPage;
