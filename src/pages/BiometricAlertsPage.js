import * as React from 'react';
import { Helmet, useModulesManager, useTranslations } from '@openimis/fe-core';
import { MODULE_KEY } from '../constants';
import { auditReadRights } from '../config';
import { hasAnyRight } from '../util/gql';
import { useUserRights } from '../components/common/adminHooks';
import { usePageStyles } from '../components/common/adminStyles';
import BiometricAlertSearcher from '../components/biometric/BiometricAlertSearcher';

function BiometricAlertsPage() {
  const classes = usePageStyles();
  const modulesManager = useModulesManager();
  const rights = useUserRights();
  const { formatMessage } = useTranslations(MODULE_KEY, modulesManager);
  if (!hasAnyRight(rights, auditReadRights(modulesManager))) return null;
  return (
    <div className={classes.page}>
      <Helmet title={formatMessage('biometric.alert.helmet')} />
      <BiometricAlertSearcher rights={rights} />
    </div>
  );
}

export default BiometricAlertsPage;
