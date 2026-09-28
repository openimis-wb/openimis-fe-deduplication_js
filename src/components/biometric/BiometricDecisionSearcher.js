import * as React from 'react';
import { useDispatch } from 'react-redux';
import {
  Box, Button, Tooltip, Typography,
} from '@material-ui/core';
import { Searcher, useModulesManager, useTranslations } from '@openimis/fe-core';
import { useIntl } from 'react-intl';
import { fetchBiometricMultimodalDecisions } from '../../adminActions';
import { MODULE_KEY } from '../../constants';
import { rowsPerPageOptions } from '../../config';
import { formatNumber } from '../../util/biometric';
import { decisionLegs, fusionReason } from '../../util/verifications';
import { useAdminSlice } from '../common/adminHooks';
import { useAdminStyles } from '../common/adminStyles';
import ColorChip from '../common/ColorChip';
import BiometricDecisionFilter from './BiometricDecisionFilter';
import VerificationDetailDialog, { codeLabel } from './VerificationDetailDialog';

const OUTCOME_COLOR = { accept: 'success', review: 'warning', reject: 'error' };

// Fused decisions of multimodal verifications, newest first. Each leg links
// to its verification record.
function BiometricDecisionSearcher({ canIdentify }) {
  const classes = useAdminStyles();
  const dispatch = useDispatch();
  const intl = useIntl();
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues, formatDateTimeFromISO } = useTranslations(
    MODULE_KEY,
    modulesManager,
  );
  const slice = useAdminSlice('biometricMultimodalDecisions');
  const [verificationId, setVerificationId] = React.useState(null);

  const fetch = (params) => dispatch(fetchBiometricMultimodalDecisions(params));
  const modalityLabel = (modality) => codeLabel(intl.messages, 'biometric.modality', modality);

  const reasonLabel = (reason) => {
    const { code, values, raw } = fusionReason(reason);
    if (!code || !intl.messages[`${MODULE_KEY}.biometric.decision.reason.${code}`]) return raw;
    return formatMessageWithValues(`biometric.decision.reason.${code}`, {
      ...values,
      ...(values.modality ? { modality: modalityLabel(values.modality) } : {}),
    });
  };

  const itemFormatters = () => [
    (d) => formatDateTimeFromISO(d.createdAt),
    (d) => `${d.subjectModel} ${d.subjectId}`,
    (d) => (
      <ColorChip
        size="small"
        color={OUTCOME_COLOR[d.outcome] ?? 'default'}
        label={codeLabel(intl.messages, 'biometric.decision.outcome', d.outcome)}
      />
    ),
    (d) => formatNumber(d.score, 3),
    (d) => (d.reasons?.length ? (
      <ul className={classes.list}>
        {d.reasons.map((reason) => (
          <li key={reason}><Typography variant="body2">{reasonLabel(reason)}</Typography></li>
        ))}
      </ul>
    ) : '—'),
    (d) => d.riskProfile || formatMessage('biometric.criteria.base'),
    (d) => {
      const legs = decisionLegs(d);
      if (!legs.length) return '—';
      return (
        <Box className={classes.row}>
          {legs.map((leg, index) => {
            const label = modalityLabel(leg.modality);
            if (!leg.verificationId) {
              // eslint-disable-next-line react/no-array-index-key
              return <Typography key={index} variant="body2">{label}</Typography>;
            }
            return (
              <Tooltip key={leg.verificationId} title={formatMessage('biometric.decision.openVerification')}>
                <Button size="small" onClick={() => setVerificationId(leg.verificationId)}>{label}</Button>
              </Tooltip>
            );
          })}
        </Box>
      );
    },
  ];

  return (
    <>
      <Searcher
        module={MODULE_KEY}
        cacheFiltersKey="deduplicationBiometricDecisionSearcher"
        FilterPane={BiometricDecisionFilter}
        fetch={fetch}
        items={slice?.items ?? []}
        itemsPageInfo={slice?.pageInfo}
        fetchedItems={slice?.fetched}
        fetchingItems={slice?.fetching}
        errorItems={slice?.error}
        tableTitle={formatMessageWithValues('biometric.decision.searcherTitle', { count: slice?.totalCount ?? 0 })}
        headers={() => [
          'biometric.decision.createdAt',
          'biometric.decision.subject',
          'biometric.decision.outcome',
          'biometric.decision.score',
          'biometric.decision.reasons',
          'biometric.decision.riskProfile',
          'biometric.decision.legs',
        ]}
        itemFormatters={itemFormatters}
        sorts={() => [
          ['createdAt', false],
          ['subjectId', true],
          ['outcome', true],
          ['score', false],
          null,
          ['riskProfile', true],
          null,
        ]}
        rowsPerPageOptions={rowsPerPageOptions(modulesManager)}
        defaultPageSize={rowsPerPageOptions(modulesManager)[0]}
        defaultOrderBy="-createdAt"
        rowIdentifier={(d) => d.id}
      />
      <VerificationDetailDialog
        verificationId={verificationId}
        canIdentify={canIdentify}
        onClose={() => setVerificationId(null)}
      />
    </>
  );
}

export default BiometricDecisionSearcher;
