import * as React from 'react';
import { useDispatch } from 'react-redux';
import { IconButton, Tooltip } from '@material-ui/core';
import ReceiptIcon from '@material-ui/icons/Receipt';
import { Searcher, useModulesManager, useTranslations } from '@openimis/fe-core';
import { useIntl } from 'react-intl';
import { fetchBiometricVerificationRecords } from '../../adminActions';
import { MODULE_KEY } from '../../constants';
import { rowsPerPageOptions } from '../../config';
import { formatNumber } from '../../util/biometric';
import { suspectedState } from '../../util/verifications';
import { useAdminSlice } from '../common/adminHooks';
import ColorChip from '../common/ColorChip';
import BiometricVerificationFilter from './BiometricVerificationFilter';
import VerificationDetailDialog, { codeLabel } from './VerificationDetailDialog';

const SUSPECTED_COLOR = { yes: 'error', no: 'default', notRun: 'default' };

// Verification records across subjects, newest first.
function BiometricVerificationSearcher({ canIdentify }) {
  const dispatch = useDispatch();
  const intl = useIntl();
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues, formatDateTimeFromISO } = useTranslations(
    MODULE_KEY,
    modulesManager,
  );
  const slice = useAdminSlice('biometricVerifications');
  const [selected, setSelected] = React.useState(null);

  const fetch = (params) => dispatch(fetchBiometricVerificationRecords(params));

  const itemFormatters = () => [
    (v) => formatDateTimeFromISO(v.createdAt),
    (v) => `${v.subjectModel} ${v.subjectId}`,
    (v) => codeLabel(intl.messages, 'biometric.modality', v.modality),
    (v) => (
      <ColorChip
        size="small"
        color={v.verified ? 'success' : 'warning'}
        label={formatMessage(v.verified
          ? 'biometric.verification.verified.true'
          : 'biometric.verification.verified.false')}
      />
    ),
    (v) => `${formatNumber(v.score, 3)} / ${formatNumber(v.threshold, 3)}`,
    (v) => v.riskProfile || formatMessage('biometric.criteria.base'),
    (v) => codeLabel(intl.messages, 'biometric.verification.templateSkip', v.templateSkipReason),
    (v) => codeLabel(intl.messages, 'biometric.verification.impersonationSkip', v.impersonationSkipReason),
    (v) => {
      const state = suspectedState(v);
      return (
        <ColorChip
          size="small"
          variant={state === 'notRun' ? 'outlined' : 'default'}
          color={SUSPECTED_COLOR[state]}
          label={formatMessage(`biometric.verification.suspected.${state}`)}
        />
      );
    },
    (v) => (
      <Tooltip title={formatMessage('biometric.verification.details')}>
        <IconButton size="small" onClick={() => setSelected(v)}>
          <ReceiptIcon />
        </IconButton>
      </Tooltip>
    ),
  ];

  return (
    <>
      <Searcher
        module={MODULE_KEY}
        cacheFiltersKey="deduplicationBiometricVerificationSearcher"
        FilterPane={BiometricVerificationFilter}
        fetch={fetch}
        items={slice?.items ?? []}
        itemsPageInfo={slice?.pageInfo}
        fetchedItems={slice?.fetched}
        fetchingItems={slice?.fetching}
        errorItems={slice?.error}
        tableTitle={formatMessageWithValues('biometric.verification.searcherTitle', { count: slice?.totalCount ?? 0 })}
        headers={() => [
          'biometric.verification.createdAt',
          'biometric.verification.subject',
          'biometric.verification.modality',
          'biometric.verification.verified',
          'biometric.verification.scoreThreshold',
          'biometric.verification.riskProfile',
          'biometric.verification.templateSkipReason',
          'biometric.verification.impersonationSkipReason',
          'biometric.verification.suspected',
          '',
        ]}
        itemFormatters={itemFormatters}
        sorts={() => [
          ['createdAt', false],
          ['subjectId', true],
          ['modality', true],
          ['verified', true],
          ['score', false],
          ['riskProfile', true],
          null,
          null,
          null,
          null,
        ]}
        rowsPerPageOptions={rowsPerPageOptions(modulesManager)}
        defaultPageSize={rowsPerPageOptions(modulesManager)[0]}
        defaultOrderBy="-createdAt"
        rowIdentifier={(v) => v.id}
        onDoubleClick={(v) => setSelected(v)}
      />
      <VerificationDetailDialog record={selected} canIdentify={canIdentify} onClose={() => setSelected(null)} />
    </>
  );
}

export default BiometricVerificationSearcher;
