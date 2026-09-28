import * as React from 'react';
import { Box, Typography } from '@mui/material';
import { useModulesManager, useTranslations } from '@openimis/fe-core';
import { useIntl } from 'react-intl';
import { MODULE_KEY } from '../../constants';
import { labelOr } from '../../util/gql';

const EMPTY = '—';

// Label / value lines of fusionRuleRows() output.
function FusionRules({ rows }) {
  const intl = useIntl();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(MODULE_KEY, modulesManager);
  const modalityLabel = (modality) => labelOr(intl.messages, `${MODULE_KEY}.biometric.modality.${modality}`, modality);
  const number = (value) => (value === null ? EMPTY : String(value));

  const valueText = (row) => {
    switch (row.type) {
      case 'number':
        return number(row.value);
      case 'text':
        return row.value === null
          ? EMPTY
          : labelOr(intl.messages, `${MODULE_KEY}.biometric.criteria.decision.${row.value}`, row.value);
      case 'list':
        return row.value.length ? row.value.map(modalityLabel).join(', ') : EMPTY;
      case 'modalities':
        return row.value.length
          ? row.value.map((item) => `${modalityLabel(item.modality)} ${number(item.value)}`).join(' ; ')
          : EMPTY;
      default:
        return EMPTY;
    }
  };

  return (
    <Box component="dl" sx={{ m: 0 }}>
      {rows.map((row) => (
        <Box key={row.key} display="flex" gap={2} py={0.5}>
          <Typography component="dt" variant="body2" color="textSecondary" sx={{ minWidth: 280 }}>
            {formatMessage(`biometric.criteria.rule.${row.key}`)}
          </Typography>
          <Typography component="dd" variant="body2" sx={{ m: 0 }}>{valueText(row)}</Typography>
        </Box>
      ))}
    </Box>
  );
}

export default FusionRules;
