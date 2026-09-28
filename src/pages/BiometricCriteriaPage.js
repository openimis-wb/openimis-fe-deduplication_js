import * as React from 'react';
import {
  Box, Button, CircularProgress, Typography,
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { Helmet, useModulesManager, useTranslations } from '@openimis/fe-core';
import { MODULE_KEY } from '../constants';
import { configReadRights } from '../config';
import { isPermissionError, useGqlQuery } from '../hooks';
import { DECISION_CRITERIA_QUERY } from '../queries';
import { fusionRuleRows } from '../util/biometric';
import { hasAnyRight } from '../util/gql';
import { useUserRights } from '../components/common/adminHooks';
import { useAdminStyles, usePageStyles } from '../components/common/adminStyles';
import ColorChip from '../components/common/ColorChip';
import { StyledCard } from '../components/candidates/SubjectCard';
import FusionRules from '../components/biometric/FusionRules';

function RiskProfileCard({ profile }) {
  const classes = useAdminStyles();
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues } = useTranslations(MODULE_KEY, modulesManager);
  const overrides = fusionRuleRows(profile.overrides, { declaredOnly: true });
  return (
    <StyledCard>
      <Box mb={1} className={classes.row}>
        <Typography variant="subtitle1">
          {formatMessageWithValues('biometric.criteria.profile', { name: profile.name })}
        </Typography>
        <ColorChip
          size="small"
          color={profile.valid ? 'success' : 'error'}
          label={formatMessage(profile.valid ? 'biometric.criteria.valid' : 'biometric.criteria.invalid')}
        />
      </Box>
      {!profile.valid && (
        <Box mb={1}>
          <Alert severity="error">
            {formatMessage('biometric.criteria.invalidExplanation')}
            <ul className={classes.list}>
              {(profile.errors ?? []).map((error) => <li key={error}>{error}</li>)}
            </ul>
          </Alert>
        </Box>
      )}
      <Box mt={1}>
        <Typography variant="subtitle2">{formatMessage('biometric.criteria.overrides')}</Typography>
      </Box>
      {overrides.length
        ? <FusionRules rows={overrides} />
        : <Typography variant="body2">{formatMessage('biometric.criteria.noOverride')}</Typography>}
      {profile.effective && (
        <>
          <Box mt={2}>
            <Typography variant="subtitle2">{formatMessage('biometric.criteria.effective')}</Typography>
          </Box>
          <FusionRules rows={fusionRuleRows(profile.effective)} />
        </>
      )}
    </StyledCard>
  );
}

// Read-only view of the fusion rules verify() applies and of each named risk profile.
function BiometricCriteriaPage() {
  const classes = usePageStyles();
  const modulesManager = useModulesManager();
  const rights = useUserRights();
  const { formatMessage } = useTranslations(MODULE_KEY, modulesManager);
  const allowed = hasAnyRight(rights, configReadRights(modulesManager));
  const {
    isLoading, data, errors, refetch,
  } = useGqlQuery(DECISION_CRITERIA_QUERY, {}, { skip: !allowed });
  if (!allowed) return null;

  const criteria = data?.biometricDecisionCriteria;
  let body;
  if (isLoading) {
    body = <CircularProgress size={24} />;
  } else if (errors || !criteria) {
    body = (
      <Alert
        severity="warning"
        action={<Button color="inherit" size="small" onClick={() => refetch()}>{formatMessage('common.retry')}</Button>}
      >
        {formatMessage(isPermissionError(errors) ? 'biometric.criteria.notReadable' : 'biometric.criteria.unavailable')}
      </Alert>
    );
  } else {
    const profiles = criteria.profiles ?? [];
    body = (
      <>
        <Box mb={2}>
          <StyledCard>
            <Box mb={1}>
              <Typography variant="subtitle1">{formatMessage('biometric.criteria.base')}</Typography>
            </Box>
            <FusionRules rows={fusionRuleRows(criteria.base)} />
          </StyledCard>
        </Box>
        {profiles.length === 0 && (
          <Typography variant="body2">{formatMessage('biometric.criteria.noProfile')}</Typography>
        )}
        {profiles.map((profile) => (
          <Box mb={2} key={profile.name}>
            <RiskProfileCard profile={profile} />
          </Box>
        ))}
      </>
    );
  }

  return (
    <div className={classes.page}>
      <Helmet title={formatMessage('biometric.criteria.helmet')} />
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">{formatMessage('biometric.criteria.title')}</Typography>
        <Button size="small" onClick={() => refetch()} disabled={isLoading}>{formatMessage('common.refresh')}</Button>
      </Box>
      {body}
    </div>
  );
}

export default BiometricCriteriaPage;
