import * as React from 'react';
import {
  Alert, Box, Button, CircularProgress, Typography,
} from '@mui/material';
import { useModulesManager, useTranslations } from '@openimis/fe-core';
import { MODULE_KEY } from '../../constants';
import { isPermissionError, useGqlQuery } from '../../hooks';
import { AUDIT_HEAD_QUERY } from '../../queries';
import { chainHeadOf, chainHeadView } from '../../util/biometric';
import { StyledCard } from '../candidates/SubjectCard';

// The newest event of the whole biometric audit chain: its sequence, its hash and
// the count of every event, whatever the caller's location scope. It states nothing
// about integrity; ChainStatusPanel shows the server's verification.
function ChainHeadPanel() {
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues, formatDateTimeFromISO } = useTranslations(
    MODULE_KEY,
    modulesManager,
  );
  const {
    isLoading, data, errors, refetch,
  } = useGqlQuery(AUDIT_HEAD_QUERY, {});
  const head = chainHeadOf(data);
  const view = chainHeadView(head, errors);

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
            count: head?.count ?? 0,
            at: head?.createdAt ? formatDateTimeFromISO(head.createdAt) : '—',
          })}
        </Typography>
        <Typography variant="body2" component="div" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', mt: 1 }}>
          {view.hash}
        </Typography>
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
      <Typography variant="caption" color="textSecondary" display="block" mt={2}>
        {formatMessage('biometric.chain.disclaimer')}
      </Typography>
    </StyledCard>
  );
}

export default ChainHeadPanel;
