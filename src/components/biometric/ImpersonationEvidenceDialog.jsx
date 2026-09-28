import * as React from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { useModulesManager, useTranslations } from '@openimis/fe-core';
import { useIntl } from 'react-intl';
import { MODULE_KEY } from '../../constants';
import { formatNumber, impersonationEvidence } from '../../util/biometric';
import { labelOr } from '../../util/gql';

// The impersonation probe evidence an IMPERSONATION_SUSPECTED alert carries.
function ImpersonationEvidenceDialog({ alert, onClose }) {
  const intl = useIntl();
  const modulesManager = useModulesManager();
  const { formatMessage, formatDateTimeFromISO } = useTranslations(MODULE_KEY, modulesManager);
  const evidence = impersonationEvidence(alert);

  let matched = '—';
  if (evidence && !evidence.matchedSubject.visible) matched = formatMessage('biometric.impersonation.matchedHidden');
  else if (evidence?.matchedSubject.label) matched = evidence.matchedSubject.label;

  const rows = evidence ? [
    ['suspected', formatMessage(evidence.suspected ? 'common.yes' : 'common.no')],
    ['claimedSubject', alert.subjectId ? `${alert.subjectModel} ${alert.subjectId}` : '—'],
    ['modality', evidence.modality
      ? labelOr(intl.messages, `${MODULE_KEY}.biometric.modality.${evidence.modality}`, evidence.modality)
      : '—'],
    ['matchedSubject', matched],
    ['matchedScore', formatNumber(evidence.matchedScore, 3)],
    ['claimedScore', formatNumber(evidence.claimedScore, 3)],
    ['threshold', formatNumber(evidence.threshold, 3)],
    ['margin', formatNumber(evidence.margin, 3)],
    ['lastSeenAt', alert.lastSeenAt ? formatDateTimeFromISO(alert.lastSeenAt) : '—'],
  ] : [];

  return (
    <Dialog open={!!evidence} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{formatMessage('biometric.impersonation.title')}</DialogTitle>
      {evidence && (
        <DialogContent>
          <Box component="dl" sx={{ m: 0 }}>
            {rows.map(([key, value]) => (
              <Box key={key} display="flex" gap={2} py={0.5}>
                <Typography component="dt" variant="body2" color="textSecondary" sx={{ minWidth: 220 }}>
                  {formatMessage(`biometric.impersonation.${key}`)}
                </Typography>
                <Typography component="dd" variant="body2" sx={{ m: 0 }}>{value}</Typography>
              </Box>
            ))}
          </Box>
          <Typography variant="caption" color="textSecondary" display="block" mt={2}>
            {formatMessage('biometric.impersonation.explanation')}
          </Typography>
        </DialogContent>
      )}
      <DialogActions>
        <Button onClick={onClose}>{formatMessage('common.close')}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default ImpersonationEvidenceDialog;
