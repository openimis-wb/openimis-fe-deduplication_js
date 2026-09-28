import * as React from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Helmet, useModulesManager, useTranslations } from '@openimis/fe-core';
import { MODULE_KEY } from '../constants';
import { configReadRights } from '../config';
import { isPermissionError, useGqlQuery } from '../hooks';
import { DECISION_CRITERIA_QUERY } from '../queries';
import { fusionRuleRows } from '../util/biometric';
import { hasAnyRight } from '../util/gql';
import { useUserRights } from '../components/common/adminHooks';
import { StyledCard } from '../components/candidates/SubjectCard';
import FusionRules from '../components/biometric/FusionRules';

const StyledPage = styled('div')(({ theme }) => ({
  ...(theme.page ?? {}),
}));

function RiskProfileCard({ profile }) {
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues } = useTranslations(MODULE_KEY, modulesManager);
  const overrides = fusionRuleRows(profile.overrides, { declaredOnly: true });
  return (
    <StyledCard>
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <Typography variant="subtitle1">
          {formatMessageWithValues('biometric.criteria.profile', { name: profile.name })}
        </Typography>
        <Chip
          size="small"
          color={profile.valid ? 'success' : 'error'}
          label={formatMessage(profile.valid ? 'biometric.criteria.valid' : 'biometric.criteria.invalid')}
        />
      </Box>
      {!profile.valid && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {formatMessage('biometric.criteria.invalidExplanation')}
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            {(profile.errors ?? []).map((error) => <li key={error}>{error}</li>)}
          </Box>
        </Alert>
      )}
      <Typography variant="subtitle2" mt={1}>{formatMessage('biometric.criteria.overrides')}</Typography>
      {overrides.length
        ? <FusionRules rows={overrides} />
        : <Typography variant="body2">{formatMessage('biometric.criteria.noOverride')}</Typography>}
      {profile.effective && (
        <>
          <Typography variant="subtitle2" mt={2}>{formatMessage('biometric.criteria.effective')}</Typography>
          <FusionRules rows={fusionRuleRows(profile.effective)} />
        </>
      )}
    </StyledCard>
  );
}

// Read-only view of the fusion rules verify() applies and of each named risk profile.
function BiometricCriteriaPage() {
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
            <Typography variant="subtitle1" mb={1}>{formatMessage('biometric.criteria.base')}</Typography>
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
    <StyledPage>
      <Helmet title={formatMessage('biometric.criteria.helmet')} />
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">{formatMessage('biometric.criteria.title')}</Typography>
        <Button size="small" onClick={() => refetch()} disabled={isLoading}>{formatMessage('common.refresh')}</Button>
      </Box>
      {body}
    </StyledPage>
  );
}

export default BiometricCriteriaPage;
