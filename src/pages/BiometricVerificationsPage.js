import * as React from 'react';
import { Helmet, useModulesManager, useTranslations } from '@openimis/fe-core';
import { MODULE_KEY, RIGHT_BIOMETRIC_IDENTIFY, RIGHT_BIOMETRIC_READ } from '../constants';
import { configReadRights } from '../config';
import { verificationScreenAccess } from '../util/verifications';
import { useUserRights } from '../components/common/adminHooks';
import { usePageStyles } from '../components/common/adminStyles';
import BiometricVerificationSearcher from '../components/biometric/BiometricVerificationSearcher';

function BiometricVerificationsPage() {
  const classes = usePageStyles();
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
    <div className={classes.page}>
      <Helmet title={formatMessage('biometric.verification.helmet')} />
      <BiometricVerificationSearcher canIdentify={access.canIdentify} />
    </div>
  );
}

export default BiometricVerificationsPage;
