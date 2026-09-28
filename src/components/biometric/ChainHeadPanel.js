import * as React from 'react';
import {
  Box, Button, CircularProgress, Typography,
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { useModulesManager, useTranslations } from '@openimis/fe-core';
import { MODULE_KEY } from '../../constants';
import { isPermissionError, useGqlQuery } from '../../hooks';
import { AUDIT_HEAD_QUERY } from '../../queries';
import { chainHeadView } from '../../util/biometric';
import { useAdminStyles } from '../common/adminStyles';
import { StyledCard } from '../candidates/SubjectCard';

// The newest event of the biometric audit chain: its sequence, its hash and
// the event count. It states nothing about integrity; ChainStatusPanel shows
// the server's verification.
function ChainHeadPanel() {
  const classes = useAdminStyles();
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues, formatDateTimeFromISO } = useTranslations(
    MODULE_KEY,
    modulesManager,
  );
  const {
    isLoading, data, errors, refetch,
  } = useGqlQuery(AUDIT_HEAD_QUERY, {});
  const connection = data?.biometricAuditEvents;
  const latest = connection?.edges?.[0]?.node ?? null;
  const view = chainHeadView(latest, errors);

  let body;
  if (isLoading) {
    body = <CircularProgress size={20} />;
  } else if (view.kind === 'unavailable') {
    body = (
      <Alert
        severity="warning"
        action={<Button color="inherit" size="small" onClick={() => refetch()}>{formatMessage('common.retry')}</Button>}
      >
        {formatMessage(isPermissionError(errors) ? 'biometric.chain.notReadable' : 'biometric.chain.unavailable')}
      </Alert>
    );
  } else if (view.kind === 'empty') {
    body = <Typography>{formatMessage('biometric.chain.empty')}</Typography>;
  } else {
    body = (
      <>
        <Typography variant="body2">
          {formatMessageWithValues('biometric.chain.head', {
            sequence: view.sequence,
            count: connection?.totalCount ?? 0,
            at: latest?.createdAt ? formatDateTimeFromISO(latest.createdAt) : '—',
          })}
        </Typography>
        <Box mt={1}>
          <Typography variant="body2" component="div" className={classes.monospace}>
            {view.hash}
          </Typography>
        </Box>
      </>
    );
  }

  return (
    <StyledCard>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="subtitle1">{formatMessage('biometric.chain.title')}</Typography>
        <Button size="small" onClick={() => refetch()} disabled={isLoading}>{formatMessage('common.refresh')}</Button>
      </Box>
      {body}
      <Box mt={2}>
        <Typography variant="caption" color="textSecondary" display="block">
          {formatMessage('biometric.chain.disclaimer')}
        </Typography>
      </Box>
    </StyledCard>
  );
}

export default ChainHeadPanel;
