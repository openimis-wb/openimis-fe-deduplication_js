import * as React from 'react';
import { Box } from '@material-ui/core';
import { Helmet, useModulesManager, useTranslations } from '@openimis/fe-core';
import { MODULE_KEY } from '../constants';
import { auditReadRights, auditVerifyRights } from '../config';
import { hasAnyRight } from '../util/gql';
import { canVerifyChain } from '../util/biometric';
import { useUserRights } from '../components/common/adminHooks';
import { usePageStyles } from '../components/common/adminStyles';
import ChainHeadPanel from '../components/biometric/ChainHeadPanel';
import ChainStatusPanel from '../components/biometric/ChainStatusPanel';
import BiometricAuditEventSearcher from '../components/biometric/BiometricAuditEventSearcher';

function BiometricAuditPage() {
  const classes = usePageStyles();
  const modulesManager = useModulesManager();
  const rights = useUserRights();
  const { formatMessage } = useTranslations(MODULE_KEY, modulesManager);
  const auditRights = auditReadRights(modulesManager);
  if (!hasAnyRight(rights, auditRights)) return null;
  return (
    <div className={classes.page}>
      <Helmet title={formatMessage('biometric.audit.helmet')} />
      <Box mb={2}>
        <ChainStatusPanel canVerify={canVerifyChain(rights, auditVerifyRights(modulesManager), auditRights)} />
      </Box>
      <Box mb={2}>
        <ChainHeadPanel />
      </Box>
      <BiometricAuditEventSearcher />
    </div>
  );
}

export default BiometricAuditPage;
