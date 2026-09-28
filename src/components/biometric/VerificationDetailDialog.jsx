import * as React from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useModulesManager, useTranslations } from '@openimis/fe-core';
import { useIntl } from 'react-intl';
import { MODULE_KEY } from '../../constants';
import { isPermissionError, useGqlQuery } from '../../hooks';
import { VERIFICATION_RECORD_QUERY } from '../../queries';
import { formatNumber } from '../../util/biometric';
import {
  codeLabel as moduleCodeLabel,
  verificationGlobalId,
  verificationImpersonation,
} from '../../util/verifications';

export const codeLabel = (messages, prefix, code) => moduleCodeLabel(messages, `${MODULE_KEY}.${prefix}`, code);

function DefinitionList({ rows }) {
  return (
    <Box component="dl" sx={{ m: 0 }}>
      {rows.map(([label, value]) => (
        <Box key={label} display="flex" gap={2} py={0.5}>
          <Typography component="dt" variant="body2" color="textSecondary" sx={{ minWidth: 240 }}>
            {label}
          </Typography>
          <Typography component="dd" variant="body2" sx={{ m: 0 }}>{value}</Typography>
        </Box>
      ))}
    </Box>
  );
}

function ImpersonationSection({ record, canIdentify }) {
  const modulesManager = useModulesManager();
  const intl = useIntl();
  const { formatMessage } = useTranslations(MODULE_KEY, modulesManager);
  const probe = verificationImpersonation(record, canIdentify);
  const yesNo = (value) => formatMessage(value ? 'common.yes' : 'common.no');

  if (!probe) {
    return (
      <Typography variant="body2">
        {record.impersonationSkipReason
          ? codeLabel(intl.messages, 'biometric.verification.impersonationSkip', record.impersonationSkipReason)
          : formatMessage('biometric.verification.probeNotRun')}
      </Typography>
    );
  }

  let matched = '—';
  if (!probe.matchedSubject.visible && probe.matchedScore !== null) {
    matched = formatMessage('biometric.impersonation.matchedHidden');
  } else if (probe.matchedSubject.label) {
    matched = probe.matchedSubject.label;
  }

  const rows = [
    [formatMessage('biometric.verification.probeStatus'), codeLabel(
      intl.messages,
      'biometric.verification.probeStatus',
      probe.status,
    )],
    [formatMessage('biometric.impersonation.suspected'), yesNo(probe.suspected)],
    [formatMessage('biometric.impersonation.matchedSubject'), matched],
    [formatMessage('biometric.impersonation.matchedScore'), formatNumber(probe.matchedScore, 3)],
    [formatMessage('biometric.impersonation.claimedScore'), formatNumber(probe.claimedScore, 3)],
    [formatMessage('biometric.impersonation.threshold'), formatNumber(probe.threshold, 3)],
    [formatMessage('biometric.impersonation.margin'), formatNumber(probe.margin, 3)],
    [formatMessage('biometric.verification.topK'), probe.topK ?? '—'],
    ...(probe.error ? [[formatMessage('biometric.verification.probeError'), probe.error]] : []),
  ];

  let candidates;
  if (probe.candidates === null) {
    candidates = <Typography variant="body2">{formatMessage('biometric.impersonation.matchedHidden')}</Typography>;
  } else if (!probe.candidates.length) {
    candidates = <Typography variant="body2">{formatMessage('biometric.verification.noCandidate')}</Typography>;
  } else {
    candidates = (
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{formatMessage('biometric.verification.candidate')}</TableCell>
            <TableCell>{formatMessage('biometric.verification.score')}</TableCell>
            <TableCell>{formatMessage('biometric.verification.candidateSuspect')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {probe.candidates.map((candidate, index) => (
            // Candidates carry no id of their own; the server keeps them in rank order.
            // eslint-disable-next-line react/no-array-index-key
            <TableRow key={index}>
              <TableCell>{candidate.label ?? '—'}</TableCell>
              <TableCell>{formatNumber(candidate.score, 3)}</TableCell>
              <TableCell>{yesNo(candidate.suspect)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <>
      <DefinitionList rows={rows} />
      <Typography variant="subtitle2" mt={2}>{formatMessage('biometric.verification.candidates')}</Typography>
      {candidates}
      <Typography variant="caption" color="textSecondary" display="block" mt={2}>
        {formatMessage('biometric.impersonation.explanation')}
      </Typography>
    </>
  );
}

function VerificationDetails({ record, canIdentify }) {
  const modulesManager = useModulesManager();
  const intl = useIntl();
  const { formatMessage, formatDateTimeFromISO } = useTranslations(MODULE_KEY, modulesManager);
  const rows = [
    [formatMessage('biometric.verification.createdAt'), formatDateTimeFromISO(record.createdAt)],
    [formatMessage('biometric.verification.subject'), `${record.subjectModel} ${record.subjectId}`],
    [formatMessage('biometric.verification.modality'), codeLabel(intl.messages, 'biometric.modality', record.modality)],
    [formatMessage('biometric.verification.verified'), formatMessage(
      record.verified ? 'biometric.verification.verified.true' : 'biometric.verification.verified.false',
    )],
    [formatMessage('biometric.verification.score'), formatNumber(record.score, 3)],
    [formatMessage('biometric.verification.threshold'), formatNumber(record.threshold, 3)],
    [formatMessage('biometric.verification.riskProfile'),
      record.riskProfile || formatMessage('biometric.criteria.base')],
    [formatMessage('biometric.verification.origin'), codeLabel(
      intl.messages,
      'biometric.verification.origin',
      record.origin,
    )],
    [formatMessage('biometric.verification.fallback'), formatMessage(record.fallback ? 'common.yes' : 'common.no')],
    [formatMessage('biometric.verification.deviceId'), record.deviceId || '—'],
    [formatMessage('biometric.verification.actor'), record.actor || '—'],
    [formatMessage('biometric.verification.templateSkipReason'), codeLabel(
      intl.messages,
      'biometric.verification.templateSkip',
      record.templateSkipReason,
    )],
    [formatMessage('biometric.verification.impersonationSkipReason'), codeLabel(
      intl.messages,
      'biometric.verification.impersonationSkip',
      record.impersonationSkipReason,
    )],
  ];
  return (
    <>
      <DefinitionList rows={rows} />
      <Typography variant="subtitle1" mt={2}>{formatMessage('biometric.verification.probeTitle')}</Typography>
      <ImpersonationSection record={record} canIdentify={canIdentify} />
    </>
  );
}

// Reads one verification through the root node lookup; mounted once per id.
function FetchedVerification({ verificationId, canIdentify }) {
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(MODULE_KEY, modulesManager);
  const globalId = verificationGlobalId(verificationId);
  const { isLoading, data, errors } = useGqlQuery(
    VERIFICATION_RECORD_QUERY,
    { id: globalId },
    { skip: !globalId },
  );
  if (!globalId) return <Alert severity="warning">{formatMessage('biometric.verification.notFound')}</Alert>;
  if (isLoading) return <CircularProgress size={24} />;
  if (errors) {
    return (
      <Alert severity="warning">
        {formatMessage(isPermissionError(errors)
          ? 'biometric.verification.notReadable'
          : 'biometric.verification.unavailable')}
      </Alert>
    );
  }
  if (!data?.node) return <Alert severity="warning">{formatMessage('biometric.verification.notFound')}</Alert>;
  return <VerificationDetails record={data.node} canIdentify={canIdentify} />;
}

// One verification record: given as `record`, or read from its UUID `verificationId`.
function VerificationDetailDialog({
  record, verificationId, canIdentify, onClose,
}) {
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(MODULE_KEY, modulesManager);
  const open = !!record || !!verificationId;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{formatMessage('biometric.verification.detailTitle')}</DialogTitle>
      {open && (
        <DialogContent>
          {record
            ? <VerificationDetails record={record} canIdentify={canIdentify} />
            : <FetchedVerification key={verificationId} verificationId={verificationId} canIdentify={canIdentify} />}
        </DialogContent>
      )}
      <DialogActions>
        <Button onClick={onClose}>{formatMessage('common.close')}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default VerificationDetailDialog;
