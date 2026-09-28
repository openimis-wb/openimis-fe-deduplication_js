import * as React from 'react';
import {
  Alert, Box, Chip, Typography,
} from '@mui/material';
import { Searcher, useModulesManager, useTranslations } from '@openimis/fe-core';
import { useIntl } from 'react-intl';
import { MODULE_KEY } from '../../constants';
import { isPermissionError, useGqlQuery } from '../../hooks';
import { BIOMETRIC_TEMPLATES_QUERY } from '../../queries';
import {
  MEASURE_FAILED,
  MEASURE_PASSED,
  VERDICT_PASSED,
  VERDICT_REFUSED,
  formatNumber,
  measureBound,
  qualityMeasures,
  qualityVerdict,
} from '../../util/biometric';
import { labelOr } from '../../util/gql';

const VERDICT_COLOR = {
  [VERDICT_PASSED]: 'success',
  [VERDICT_REFUSED]: 'error',
};

const MEASURE_COLOR = {
  [MEASURE_PASSED]: 'success.main',
  [MEASURE_FAILED]: 'error.main',
};

// Active template metadata of one subject with the quality gate's verdict.
// Every biometricTemplates call is audited server-side, so exactly one caller
// triggers the fetch: the Searcher when it fetches on mount, the hook otherwise.
function BiometricTemplatesPanel({ subjectId, subjectModel, title }) {
  const intl = useIntl();
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues, formatDateTimeFromISO } = useTranslations(
    MODULE_KEY,
    modulesManager,
  );
  const searcherFetches = modulesManager.getConf('fe-core', 'shouldFetchInitially', true) !== false;
  const {
    isLoading, data, errors, refetch,
  } = useGqlQuery(
    BIOMETRIC_TEMPLATES_QUERY,
    { subjectId, subjectModel: subjectModel || null },
    { skip: searcherFetches },
  );

  if (isPermissionError(errors)) {
    return <Alert severity="warning">{formatMessage('biometric.templates.notReadable')}</Alert>;
  }

  const templates = data?.biometricTemplates ?? [];
  const reasonLabel = (code) => labelOr(intl.messages, `${MODULE_KEY}.biometric.quality.reason.${code}`, code);
  const measureText = (measure) => {
    const name = labelOr(intl.messages, `${MODULE_KEY}.biometric.quality.measure.${measure.name}`, measure.name);
    let value = formatNumber(measure.value);
    if (measure.value === null && measure.detail) {
      value = labelOr(intl.messages, `${MODULE_KEY}.biometric.quality.measureDetail.${measure.detail}`, measure.detail);
    }
    const bound = measureBound(measure);
    const outcome = formatMessage(`biometric.quality.measureOutcome.${measure.outcome}`);
    return bound
      ? formatMessageWithValues('biometric.quality.measureLine', {
        name, value, bound, outcome,
      })
      : formatMessageWithValues('biometric.quality.measureLineNoLimit', { name, value, outcome });
  };
  const measuresCell = (template) => {
    const measures = qualityMeasures(template);
    if (!measures.length) return '—';
    return (
      <Box>
        {measures.map((measure) => (
          <Typography
            key={measure.name}
            variant="body2"
            color={MEASURE_COLOR[measure.outcome] ?? 'text.secondary'}
            sx={{ whiteSpace: 'nowrap' }}
          >
            {measureText(measure)}
          </Typography>
        ))}
      </Box>
    );
  };

  const itemFormatters = () => [
    (t) => labelOr(intl.messages, `${MODULE_KEY}.biometric.modality.${t.modality}`, t.modality),
    (t) => t.position || '—',
    (t) => t.kind,
    (t) => t.provider,
    (t) => t.modelName,
    (t) => (t.quality === null || t.quality === undefined ? '—' : Number(t.quality).toFixed(2)),
    (t) => {
      const verdict = qualityVerdict(t);
      return (
        <Chip
          size="small"
          color={VERDICT_COLOR[verdict.status] ?? 'default'}
          variant={VERDICT_COLOR[verdict.status] ? 'filled' : 'outlined'}
          label={formatMessage(`biometric.quality.verdict.${verdict.status}`)}
        />
      );
    },
    (t) => qualityVerdict(t).reasons.map(reasonLabel).join(', '),
    measuresCell,
    (t) => (t.validityFrom ? formatDateTimeFromISO(t.validityFrom) : '—'),
    (t) => formatMessage(t.encrypted ? 'common.yes' : 'common.no'),
  ];

  return (
    <Searcher
      module={MODULE_KEY}
      fetch={() => refetch()}
      items={templates}
      fetchedItems={!isLoading}
      fetchingItems={isLoading}
      errorItems={errors ? { message: errors.map((e) => e.message).join('; ') } : null}
      tableTitle={title || formatMessage('biometric.templates.title')}
      headers={() => [
        'biometric.templates.modality',
        'biometric.templates.position',
        'biometric.templates.kind',
        'biometric.templates.provider',
        'biometric.templates.model',
        'biometric.templates.quality',
        'biometric.templates.verdict',
        'biometric.templates.reasons',
        'biometric.templates.measures',
        'biometric.templates.validityFrom',
        'biometric.templates.encrypted',
      ]}
      itemFormatters={itemFormatters}
      rowIdentifier={(t) => t.id}
      withPagination={false}
    />
  );
}

export default BiometricTemplatesPanel;
