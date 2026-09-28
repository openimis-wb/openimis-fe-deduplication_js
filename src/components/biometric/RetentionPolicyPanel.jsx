import * as React from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Typography,
} from '@mui/material';
import { useModulesManager, useTranslations } from '@openimis/fe-core';
import { MODULE_KEY } from '../../constants';
import { isPermissionError, useGqlQuery } from '../../hooks';
import { RETENTION_POLICY_QUERY } from '../../queries';
import { retentionRows } from '../../util/biometric';
import { StyledCard } from '../candidates/SubjectCard';

// The retention policy the purge applies, read-only.
function RetentionPolicyPanel() {
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues } = useTranslations(MODULE_KEY, modulesManager);
  const {
    isLoading, data, errors, refetch,
  } = useGqlQuery(RETENTION_POLICY_QUERY, {});
  const rows = retentionRows(data?.biometricRetentionPolicy);

  let body;
  if (isLoading) {
    body = <CircularProgress size={20} />;
  } else if (errors) {
    body = (
      <Alert
        severity="warning"
        action={<Button color="inherit" size="small" onClick={() => refetch()}>{formatMessage('common.retry')}</Button>}
      >
        {formatMessage(isPermissionError(errors) ? 'biometric.retention.notReadable' : 'biometric.retention.unavailable')}
      </Alert>
    );
  } else if (!rows) {
    body = <Typography>{formatMessage('biometric.retention.none')}</Typography>;
  } else {
    body = rows.map((row) => (
      <Box key={row.pass} display="flex" alignItems="center" gap={2} py={0.5}>
        <Typography variant="body2" sx={{ minWidth: 280 }}>
          {formatMessage(`biometric.retention.pass.${row.pass}`)}
        </Typography>
        <Typography variant="body2" sx={{ minWidth: 200 }}>
          {row.days === null
            ? formatMessage('biometric.retention.noPeriod')
            : formatMessageWithValues('biometric.retention.days', { days: row.days })}
        </Typography>
        <Chip
          size="small"
          color={row.enabled ? 'success' : 'default'}
          variant={row.enabled ? 'filled' : 'outlined'}
          label={formatMessage(row.enabled ? 'biometric.retention.enabled' : 'biometric.retention.disabled')}
        />
      </Box>
    ));
  }

  return (
    <StyledCard>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="subtitle1">{formatMessage('biometric.retention.title')}</Typography>
        <Button size="small" onClick={() => refetch()} disabled={isLoading}>{formatMessage('common.refresh')}</Button>
      </Box>
      {body}
      <Typography variant="caption" color="textSecondary" display="block" mt={2}>
        {formatMessage('biometric.retention.explanation')}
      </Typography>
    </StyledCard>
  );
}

export default RetentionPolicyPanel;
