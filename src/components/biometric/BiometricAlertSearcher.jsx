import * as React from 'react';
import { useDispatch } from 'react-redux';
import {
  Alert, Box, Button, Chip,
} from '@mui/material';
import { Searcher, useModulesManager, useTranslations } from '@openimis/fe-core';
import { useIntl } from 'react-intl';
import {
  acknowledgeBiometricAlert, fetchBiometricAlerts, resolveBiometricAlert,
} from '../../adminActions';
import { MODULE_KEY } from '../../constants';
import { alertTriageRights, rowsPerPageOptions } from '../../config';
import { alertTransitions } from '../../util/biometric';
import { hasAnyRight, labelOr, toUuid } from '../../util/gql';
import { useAdminSlice } from '../common/adminHooks';
import BiometricAlertFilter from './BiometricAlertFilter';
import ResolveAlertDialog from './ResolveAlertDialog';

const SEVERITY_COLOR = { HIGH: 'error', MEDIUM: 'warning', LOW: 'default' };

// Alerts raised by the audit rules. The acknowledge and resolve mutations are
// synchronous: each answers with the updated alert or an error, then the list reloads.
function BiometricAlertSearcher({ rights }) {
  const dispatch = useDispatch();
  const intl = useIntl();
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues, formatDateTimeFromISO } = useTranslations(
    MODULE_KEY,
    modulesManager,
  );
  const slice = useAdminSlice('biometricAlerts');
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [resolving, setResolving] = React.useState(null);
  const [busyId, setBusyId] = React.useState(null);
  const [actionError, setActionError] = React.useState(null);
  const [hasFilters, setHasFilters] = React.useState(false);
  const canTriage = hasAnyRight(rights, alertTriageRights(modulesManager));

  const fetch = (params) => dispatch(fetchBiometricAlerts(params));

  const acknowledge = async (alert) => {
    setBusyId(alert.id);
    const result = await dispatch(acknowledgeBiometricAlert(toUuid(alert.id)));
    setBusyId(null);
    setActionError(result.error);
    setRefreshKey((key) => key + 1);
  };

  const resolve = async (note) => {
    const result = await dispatch(resolveBiometricAlert(toUuid(resolving.id), note));
    if (!result.error) setRefreshKey((key) => key + 1);
    return result.error;
  };

  const ruleLabel = (kind) => labelOr(intl.messages, `${MODULE_KEY}.biometric.alert.rule.${kind}`, kind);

  const headers = () => [
    'biometric.alert.severity',
    'biometric.alert.title',
    'biometric.alert.ruleKind',
    'biometric.alert.subject',
    'biometric.alert.occurrences',
    'biometric.alert.lastSeenAt',
    'biometric.alert.state',
    ...(canTriage ? [''] : []),
  ];

  const sorts = () => [
    ['severity', true],
    null,
    ['ruleKind', true],
    null,
    ['occurrences', false],
    ['lastSeenAt', false],
    ['state', true],
    ...(canTriage ? [null] : []),
  ];

  const itemFormatters = () => [
    (a) => (
      <Chip
        size="small"
        color={SEVERITY_COLOR[a.severity] ?? 'default'}
        label={formatMessage(`biometric.alert.severity.${a.severity}`)}
      />
    ),
    (a) => a.title,
    (a) => ruleLabel(a.ruleKind),
    (a) => (a.subjectId ? `${a.subjectModel} ${a.subjectId}` : '—'),
    (a) => a.occurrences,
    (a) => formatDateTimeFromISO(a.lastSeenAt),
    (a) => formatMessage(`biometric.alert.state.${a.state}`),
    ...(canTriage ? [(a) => {
      const { canAcknowledge, canResolve } = alertTransitions(a);
      return (
        <Box display="flex" gap={1}>
          {canAcknowledge && (
            <Button size="small" disabled={busyId === a.id} onClick={() => acknowledge(a)}>
              {formatMessage('biometric.alert.acknowledge')}
            </Button>
          )}
          {canResolve && (
            <Button size="small" onClick={() => setResolving(a)}>
              {formatMessage('biometric.alert.resolve')}
            </Button>
          )}
        </Box>
      );
    }] : []),
  ];

  const empty = slice?.fetched && !slice?.error && (slice?.totalCount ?? 0) === 0;

  return (
    <>
      {actionError && (
        <Alert severity="error" sx={{ mb: 1 }} onClose={() => setActionError(null)}>
          {formatMessageWithValues('biometric.alert.actionFailed', { error: actionError })}
        </Alert>
      )}
      {empty && !hasFilters && (
        <Alert severity="success" sx={{ mb: 1 }}>{formatMessage('biometric.alert.none')}</Alert>
      )}
      <Searcher
        key={refreshKey}
        module={MODULE_KEY}
        cacheFiltersKey="deduplicationBiometricAlertsSearcher"
        FilterPane={BiometricAlertFilter}
        fetch={fetch}
        onFiltersApplied={(filters) => setHasFilters(Object.values(filters ?? {}).some((f) => !!f?.filter))}
        items={slice?.items ?? []}
        itemsPageInfo={slice?.pageInfo}
        fetchedItems={slice?.fetched}
        fetchingItems={slice?.fetching}
        errorItems={slice?.error}
        tableTitle={formatMessageWithValues('biometric.alert.searcherTitle', { count: slice?.totalCount ?? 0 })}
        headers={headers}
        itemFormatters={itemFormatters}
        sorts={sorts}
        rowsPerPageOptions={rowsPerPageOptions(modulesManager)}
        defaultPageSize={rowsPerPageOptions(modulesManager)[0]}
        defaultOrderBy="-triggeredAt"
        rowIdentifier={(a) => a.id}
      />
      <ResolveAlertDialog alert={resolving} onClose={() => setResolving(null)} onSubmit={resolve} />
    </>
  );
}

export default BiometricAlertSearcher;
