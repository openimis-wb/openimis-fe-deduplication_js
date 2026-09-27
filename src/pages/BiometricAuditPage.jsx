import * as React from 'react';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Helmet, useModulesManager, useTranslations } from '@openimis/fe-core';
import { MODULE_KEY } from '../constants';
import { auditReadRights } from '../config';
import { hasAnyRight } from '../util/gql';
import { useUserRights } from '../components/common/adminHooks';
import ChainHeadPanel from '../components/biometric/ChainHeadPanel';
import BiometricAuditEventSearcher from '../components/biometric/BiometricAuditEventSearcher';

const StyledPage = styled('div')(({ theme }) => ({
  ...(theme.page ?? {}),
}));

function BiometricAuditPage() {
  const modulesManager = useModulesManager();
  const rights = useUserRights();
  const { formatMessage } = useTranslations(MODULE_KEY, modulesManager);
  if (!hasAnyRight(rights, auditReadRights(modulesManager))) return null;
  return (
    <StyledPage>
      <Helmet title={formatMessage('biometric.audit.helmet')} />
      <Box mb={2}>
        <ChainHeadPanel />
      </Box>
      <BiometricAuditEventSearcher />
    </StyledPage>
  );
}

export default BiometricAuditPage;
