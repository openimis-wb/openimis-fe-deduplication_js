import * as React from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@material-ui/core';
import { useModulesManager, useTranslations } from '@openimis/fe-core';
import { useIntl } from 'react-intl';
import { MODULE_KEY } from '../../constants';
import { formatNumber, impersonationEvidence } from '../../util/biometric';
import { labelOr } from '../../util/gql';
import { useAdminStyles } from '../common/adminStyles';

const LABEL_STYLE = { minWidth: 220 };

// The impersonation probe evidence an IMPERSONATION_SUSPECTED alert carries.
function ImpersonationEvidenceDialog({ alert, onClose }) {
  const classes = useAdminStyles();
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
          <dl className={classes.definitionList}>
            {rows.map(([key, value]) => (
              <div key={key} className={classes.definitionRow}>
                <Typography component="dt" variant="body2" color="textSecondary" style={LABEL_STYLE}>
                  {formatMessage(`biometric.impersonation.${key}`)}
                </Typography>
                <Typography component="dd" variant="body2" className={classes.definitionValue}>{value}</Typography>
              </div>
            ))}
          </dl>
          <Box mt={2}>
            <Typography variant="caption" color="textSecondary" display="block">
              {formatMessage('biometric.impersonation.explanation')}
            </Typography>
          </Box>
        </DialogContent>
      )}
      <DialogActions>
        <Button onClick={onClose}>{formatMessage('common.close')}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default ImpersonationEvidenceDialog;
