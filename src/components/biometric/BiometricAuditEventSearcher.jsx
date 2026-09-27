import * as React from 'react';
import { useDispatch } from 'react-redux';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  GetIconComponent, Searcher, useModulesManager, useTranslations,
} from '@openimis/fe-core';
import { useIntl } from 'react-intl';
import { fetchBiometricAuditEvents } from '../../adminActions';
import { MODULE_KEY } from '../../constants';
import { rowsPerPageOptions } from '../../config';
import { prettyJson } from '../../util/biometric';
import { useAdminSlice } from '../common/adminHooks';
import BiometricAuditEventFilter, { auditActionLabel } from './BiometricAuditEventFilter';

const DetailsIcon = GetIconComponent('ReceiptLong');

const MONOSPACE = { fontFamily: 'monospace', wordBreak: 'break-all' };

function AuditEventDialog({ event, onClose }) {
  const intl = useIntl();
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues, formatDateTimeFromISO } = useTranslations(
    MODULE_KEY,
    modulesManager,
  );
  return (
    <Dialog open={!!event} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {event && formatMessageWithValues('biometric.audit.eventTitle', {
          sequence: event.sequence,
          at: formatDateTimeFromISO(event.createdAt),
        })}
      </DialogTitle>
      {event && (
        <DialogContent>
          <Typography variant="body2">
            {`${formatMessage('biometric.audit.action')}: ${auditActionLabel(intl.messages, event.action)}`}
          </Typography>
          <Typography variant="body2">{`${formatMessage('biometric.audit.actor')}: ${event.actor}`}</Typography>
          <Typography variant="subtitle2" mt={2}>{formatMessage('biometric.audit.payload')}</Typography>
          <Box component="pre" sx={{ ...MONOSPACE, whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>
            {prettyJson(event.payload) || '{}'}
          </Box>
          <Typography variant="subtitle2" mt={2}>{formatMessage('biometric.audit.prevHash')}</Typography>
          <Typography variant="body2" sx={MONOSPACE}>{event.prevHash || '—'}</Typography>
          <Typography variant="subtitle2" mt={2}>{formatMessage('biometric.audit.hash')}</Typography>
          <Typography variant="body2" sx={MONOSPACE}>{event.hash || '—'}</Typography>
          <Typography variant="caption" color="textSecondary" display="block" mt={2}>
            {formatMessage('biometric.audit.hashExplanation')}
          </Typography>
        </DialogContent>
      )}
      <DialogActions>
        <Button onClick={onClose}>{formatMessage('common.close')}</Button>
      </DialogActions>
    </Dialog>
  );
}

function BiometricAuditEventSearcher() {
  const dispatch = useDispatch();
  const intl = useIntl();
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues, formatDateTimeFromISO } = useTranslations(
    MODULE_KEY,
    modulesManager,
  );
  const slice = useAdminSlice('biometricAuditEvents');
  const [selected, setSelected] = React.useState(null);

  const fetch = (params) => dispatch(fetchBiometricAuditEvents(params));

  const itemFormatters = () => [
    (e) => e.sequence,
    (e) => formatDateTimeFromISO(e.createdAt),
    (e) => e.actor,
    (e) => auditActionLabel(intl.messages, e.action),
    (e) => (e.subjectId ? `${e.subjectModel} ${e.subjectId}` : '—'),
    (e) => (
      <Tooltip title={formatMessage('biometric.audit.details')}>
        <IconButton size="small" onClick={() => setSelected(e)}>
          <DetailsIcon />
        </IconButton>
      </Tooltip>
    ),
  ];

  return (
    <>
      <Searcher
        module={MODULE_KEY}
        cacheFiltersKey="deduplicationBiometricAuditSearcher"
        FilterPane={BiometricAuditEventFilter}
        fetch={fetch}
        items={slice?.items ?? []}
        itemsPageInfo={slice?.pageInfo}
        fetchedItems={slice?.fetched}
        fetchingItems={slice?.fetching}
        errorItems={slice?.error}
        tableTitle={formatMessageWithValues('biometric.audit.searcherTitle', { count: slice?.totalCount ?? 0 })}
        headers={() => [
          'biometric.audit.sequence',
          'biometric.audit.createdAt',
          'biometric.audit.actor',
          'biometric.audit.action',
          'biometric.audit.subject',
          '',
        ]}
        itemFormatters={itemFormatters}
        sorts={() => [['sequence', false], ['createdAt', false], null, null, null, null]}
        rowsPerPageOptions={rowsPerPageOptions(modulesManager)}
        defaultPageSize={rowsPerPageOptions(modulesManager)[0]}
        defaultOrderBy="-sequence"
        rowIdentifier={(e) => e.id}
        onDoubleClick={(e) => setSelected(e)}
      />
      <AuditEventDialog event={selected} onClose={() => setSelected(null)} />
    </>
  );
}

export default BiometricAuditEventSearcher;
