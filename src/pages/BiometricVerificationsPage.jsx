import * as React from 'react';
import { styled } from '@mui/material/styles';
import { Helmet, useModulesManager, useTranslations } from '@openimis/fe-core';
import { MODULE_KEY, RIGHT_BIOMETRIC_IDENTIFY, RIGHT_BIOMETRIC_READ } from '../constants';
import { configReadRights } from '../config';
import { verificationScreenAccess } from '../util/verifications';
import { useUserRights } from '../components/common/adminHooks';
import BiometricVerificationSearcher from '../components/biometric/BiometricVerificationSearcher';

const StyledPage = styled('div')(({ theme }) => ({
  ...(theme.page ?? {}),
}));

function BiometricVerificationsPage() {
  const modulesManager = useModulesManager();
  const rights = useUserRights();
  const { formatMessage } = useTranslations(MODULE_KEY, modulesManager);
  const access = verificationScreenAccess(rights, {
    readRights: [RIGHT_BIOMETRIC_READ],
    identifyRights: [RIGHT_BIOMETRIC_IDENTIFY],
    configRights: configReadRights(modulesManager),
  });
  if (!access.canRead) return null;
  return (
    <StyledPage>
      <Helmet title={formatMessage('biometric.verification.helmet')} />
      <BiometricVerificationSearcher canIdentify={access.canIdentify} />
    </StyledPage>
  );
}

export default BiometricVerificationsPage;
