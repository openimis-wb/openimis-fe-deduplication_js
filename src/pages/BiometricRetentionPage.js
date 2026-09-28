import * as React from 'react';
import { Box } from '@material-ui/core';
import { Helmet, useModulesManager, useTranslations } from '@openimis/fe-core';
import { MODULE_KEY } from '../constants';
import { auditReadRights, configReadRights } from '../config';
import { hasAnyRight } from '../util/gql';
import { useUserRights } from '../components/common/adminHooks';
import { usePageStyles } from '../components/common/adminStyles';
import RetentionPolicyPanel from '../components/biometric/RetentionPolicyPanel';
import BiometricErasureSearcher from '../components/biometric/BiometricErasureSearcher';

// The policy needs the configuration read rights, the erasure list the audit
// read rights; each section shows only to the holders of its rights.
function BiometricRetentionPage() {
  const classes = usePageStyles();
  const modulesManager = useModulesManager();
  const rights = useUserRights();
  const { formatMessage } = useTranslations(MODULE_KEY, modulesManager);
  const canReadPolicy = hasAnyRight(rights, configReadRights(modulesManager));
  const canReadErasures = hasAnyRight(rights, auditReadRights(modulesManager));
  if (!canReadPolicy && !canReadErasures) return null;
  return (
    <div className={classes.page}>
      <Helmet title={formatMessage('biometric.retention.helmet')} />
      {canReadPolicy && (
        <Box mb={2}>
          <RetentionPolicyPanel />
        </Box>
      )}
      {canReadErasures && <BiometricErasureSearcher />}
    </div>
  );
}

export default BiometricRetentionPage;
