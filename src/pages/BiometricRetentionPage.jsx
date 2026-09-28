import * as React from 'react';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Helmet, useModulesManager, useTranslations } from '@openimis/fe-core';
import { MODULE_KEY } from '../constants';
import { auditReadRights, configReadRights } from '../config';
import { hasAnyRight } from '../util/gql';
import { useUserRights } from '../components/common/adminHooks';
import RetentionPolicyPanel from '../components/biometric/RetentionPolicyPanel';
import BiometricErasureSearcher from '../components/biometric/BiometricErasureSearcher';

const StyledPage = styled('div')(({ theme }) => ({
  ...(theme.page ?? {}),
}));

// The policy needs the configuration read rights, the erasure list the audit
// read rights; each section shows only to the holders of its rights.
function BiometricRetentionPage() {
  const modulesManager = useModulesManager();
  const rights = useUserRights();
  const { formatMessage } = useTranslations(MODULE_KEY, modulesManager);
  const canReadPolicy = hasAnyRight(rights, configReadRights(modulesManager));
  const canReadErasures = hasAnyRight(rights, auditReadRights(modulesManager));
  if (!canReadPolicy && !canReadErasures) return null;
  return (
    <StyledPage>
      <Helmet title={formatMessage('biometric.retention.helmet')} />
      {canReadPolicy && (
        <Box mb={2}>
          <RetentionPolicyPanel />
        </Box>
      )}
      {canReadErasures && <BiometricErasureSearcher />}
    </StyledPage>
  );
}

export default BiometricRetentionPage;
