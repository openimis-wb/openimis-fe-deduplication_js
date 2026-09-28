import * as React from 'react';
import { useDispatch } from 'react-redux';
import {
  Alert, Box, Button, CircularProgress, Typography,
} from '@mui/material';
import { useModulesManager, useTranslations } from '@openimis/fe-core';
import { useIntl } from 'react-intl';
import { verifyBiometricAuditChain } from '../../adminActions';
import { MODULE_KEY } from '../../constants';
import { isPermissionError, useGqlQuery } from '../../hooks';
import { AUDIT_CHAIN_STATUS_QUERY } from '../../queries';
import { chainStatusView } from '../../util/biometric';
import { labelOr } from '../../util/gql';
import { StyledCard } from '../candidates/SubjectCard';

const MONOSPACE = { fontFamily: 'monospace', wordBreak: 'break-all' };

// The last audit chain verification stored on the server. "Verify now" runs
// verifyBiometricAuditChain and shows the check it answers with.
function ChainStatusPanel({ canVerify }) {
  const dispatch = useDispatch();
  const intl = useIntl();
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues, formatDateTimeFromISO } = useTranslations(
    MODULE_KEY,
    modulesManager,
  );
  const {
    isLoading, data, errors, refetch,
  } = useGqlQuery(AUDIT_CHAIN_STATUS_QUERY, {});
  const [verified, setVerified] = React.useState(null);
  const [verifying, setVerifying] = React.useState(false);
  const [verifyError, setVerifyError] = React.useState(null);

  const status = verified ?? data?.biometricAuditChainStatus ?? null;
  const view = chainStatusView(status, verified ? null : errors);
  const divergenceLabel = (kind) => labelOr(intl.messages, `${MODULE_KEY}.biometric.chainStatus.divergence.${kind}`, kind);

  const verify = async () => {
    setVerifying(true);
    setVerifyError(null);
    const { result, error } = await dispatch(verifyBiometricAuditChain());
    setVerifying(false);
    if (error) setVerifyError(error);
    else if (result) setVerified(result);
  };

  const reload = () => {
    setVerified(null);
    refetch();
  };

  let body;
  if (isLoading && !verified) {
    body = <CircularProgress size={20} />;
  } else if (view.kind === 'unavailable') {
    body = (
      <Alert
        severity="warning"
        action={<Button color="inherit" size="small" onClick={reload}>{formatMessage('common.retry')}</Button>}
      >
        {formatMessage(isPermissionError(errors) ? 'biometric.chain.notReadable' : 'biometric.chainStatus.unavailable')}
      </Alert>
    );
  } else if (view.kind === 'never') {
    body = <Typography>{formatMessage('biometric.chainStatus.never')}</Typography>;
  } else {
    let outcome;
    if (view.kind === 'ok') {
      outcome = formatMessageWithValues('biometric.chainStatus.ok', {
        checked: view.checked ?? 0,
        head: view.headSequence ?? '—',
      });
    } else if (view.divergenceSequence !== null) {
      outcome = formatMessageWithValues('biometric.chainStatus.broken', {
        kind: view.divergenceKind ? divergenceLabel(view.divergenceKind) : '—',
        sequence: view.divergenceSequence,
        checked: view.checked ?? 0,
      });
    } else {
      outcome = formatMessageWithValues('biometric.chainStatus.brokenNoSequence', {
        kind: view.divergenceKind ? divergenceLabel(view.divergenceKind) : '—',
        checked: view.checked ?? 0,
      });
    }
    body = (
      <>
        <Alert severity={view.kind === 'ok' ? 'success' : 'error'}>{outcome}</Alert>
        {view.divergenceDetail && (
          <Typography variant="body2" component="div" sx={{ ...MONOSPACE, mt: 1 }}>
            {view.divergenceDetail}
          </Typography>
        )}
        <Typography variant="body2" mt={1}>
          {formatMessageWithValues('biometric.chainStatus.checkedAtBy', {
            at: view.checkedAt ? formatDateTimeFromISO(view.checkedAt) : '—',
            by: view.checkedBy || '—',
          })}
        </Typography>
        <Typography variant="body2">
          {formatMessageWithValues('biometric.chainStatus.head', { sequence: view.headSequence ?? '—' })}
        </Typography>
        <Typography variant="body2" component="div" sx={{ ...MONOSPACE, mt: 1 }}>
          {view.headHash || '—'}
        </Typography>
      </>
    );
  }

  return (
    <StyledCard>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} gap={1}>
        <Typography variant="subtitle1">{formatMessage('biometric.chainStatus.title')}</Typography>
        <Box display="flex" gap={1}>
          <Button size="small" onClick={reload} disabled={isLoading || verifying}>
            {formatMessage('common.refresh')}
          </Button>
          {canVerify && (
            <Button
              size="small"
              variant="contained"
              color="primary"
              onClick={verify}
              disabled={verifying}
              startIcon={verifying ? <CircularProgress size={14} color="inherit" /> : null}
            >
              {formatMessage('biometric.chainStatus.verify')}
            </Button>
          )}
        </Box>
      </Box>
      {verifyError && (
        <Alert severity="error" sx={{ mb: 1 }} onClose={() => setVerifyError(null)}>
          {formatMessageWithValues('biometric.chainStatus.verifyFailed', { error: verifyError })}
        </Alert>
      )}
      {body}
      <Typography variant="caption" color="textSecondary" display="block" mt={2}>
        {formatMessage('biometric.chainStatus.explanation')}
      </Typography>
    </StyledCard>
  );
}

export default ChainStatusPanel;
