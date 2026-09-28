import * as React from 'react';
import {
  Box, Button, CircularProgress, Typography,
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { useModulesManager, useTranslations } from '@openimis/fe-core';
import { MODULE_KEY } from '../../constants';
import { isPermissionError, useGqlQuery } from '../../hooks';
import { RETENTION_POLICY_QUERY } from '../../queries';
import { retentionRows } from '../../util/biometric';
import { useAdminStyles } from '../common/adminStyles';
import ColorChip from '../common/ColorChip';
import { StyledCard } from '../candidates/SubjectCard';

const PASS_STYLE = { minWidth: 280 };
const DAYS_STYLE = { minWidth: 200 };

// The retention policy the purge applies, read-only.
function RetentionPolicyPanel() {
  const classes = useAdminStyles();
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
        {formatMessage(
          isPermissionError(errors) ? 'biometric.retention.notReadable' : 'biometric.retention.unavailable',
        )}
      </Alert>
    );
  } else if (!rows) {
    body = <Typography>{formatMessage('biometric.retention.none')}</Typography>;
  } else {
    body = rows.map((row) => (
      <div key={row.pass} className={classes.definitionRow} style={{ alignItems: 'center' }}>
        <Typography variant="body2" style={PASS_STYLE}>
          {formatMessage(`biometric.retention.pass.${row.pass}`)}
        </Typography>
        <Typography variant="body2" style={DAYS_STYLE}>
          {row.days === null
            ? formatMessage('biometric.retention.noPeriod')
            : formatMessageWithValues('biometric.retention.days', { days: row.days })}
        </Typography>
        <ColorChip
          size="small"
          color={row.enabled ? 'success' : 'default'}
          variant={row.enabled ? 'default' : 'outlined'}
          label={formatMessage(row.enabled ? 'biometric.retention.enabled' : 'biometric.retention.disabled')}
        />
      </div>
    ));
  }

  return (
    <StyledCard>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="subtitle1">{formatMessage('biometric.retention.title')}</Typography>
        <Button size="small" onClick={() => refetch()} disabled={isLoading}>{formatMessage('common.refresh')}</Button>
      </Box>
      {body}
      <Box mt={2}>
        <Typography variant="caption" color="textSecondary" display="block">
          {formatMessage('biometric.retention.explanation')}
        </Typography>
      </Box>
    </StyledCard>
  );
}

export default RetentionPolicyPanel;
