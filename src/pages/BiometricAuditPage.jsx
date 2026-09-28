import * as React from 'react';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Helmet, useModulesManager, useTranslations } from '@openimis/fe-core';
import { MODULE_KEY } from '../constants';
import { auditReadRights, auditVerifyRights } from '../config';
import { hasAnyRight } from '../util/gql';
import { canVerifyChain } from '../util/biometric';
import { useUserRights } from '../components/common/adminHooks';
import ChainHeadPanel from '../components/biometric/ChainHeadPanel';
import ChainStatusPanel from '../components/biometric/ChainStatusPanel';
import BiometricAuditEventSearcher from '../components/biometric/BiometricAuditEventSearcher';

const StyledPage = styled('div')(({ theme }) => ({
  ...(theme.page ?? {}),
}));

function BiometricAuditPage() {
  const modulesManager = useModulesManager();
  const rights = useUserRights();
  const { formatMessage } = useTranslations(MODULE_KEY, modulesManager);
  const auditRights = auditReadRights(modulesManager);
  if (!hasAnyRight(rights, auditRights)) return null;
  return (
    <StyledPage>
      <Helmet title={formatMessage('biometric.audit.helmet')} />
      <Box mb={2}>
        <ChainStatusPanel canVerify={canVerifyChain(rights, auditVerifyRights(modulesManager), auditRights)} />
      </Box>
      <Box mb={2}>
        <ChainHeadPanel />
      </Box>
      <BiometricAuditEventSearcher />
    </StyledPage>
  );
}

export default BiometricAuditPage;
