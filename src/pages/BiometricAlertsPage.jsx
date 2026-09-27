import * as React from 'react';
import { styled } from '@mui/material/styles';
import { Helmet, useModulesManager, useTranslations } from '@openimis/fe-core';
import { MODULE_KEY } from '../constants';
import { auditReadRights } from '../config';
import { hasAnyRight } from '../util/gql';
import { useUserRights } from '../components/common/adminHooks';
import BiometricAlertSearcher from '../components/biometric/BiometricAlertSearcher';

const StyledPage = styled('div')(({ theme }) => ({
  ...(theme.page ?? {}),
}));

function BiometricAlertsPage() {
  const modulesManager = useModulesManager();
  const rights = useUserRights();
  const { formatMessage } = useTranslations(MODULE_KEY, modulesManager);
  if (!hasAnyRight(rights, auditReadRights(modulesManager))) return null;
  return (
    <StyledPage>
      <Helmet title={formatMessage('biometric.alert.helmet')} />
      <BiometricAlertSearcher rights={rights} />
    </StyledPage>
  );
}

export default BiometricAlertsPage;
