import * as React from 'react';
import { Typography } from '@material-ui/core';
import { useModulesManager, useTranslations } from '@openimis/fe-core';
import { useIntl } from 'react-intl';
import { MODULE_KEY } from '../../constants';
import { labelOr } from '../../util/gql';
import { useAdminStyles } from '../common/adminStyles';

const EMPTY = '—';
const LABEL_STYLE = { minWidth: 280 };

// Label / value lines of fusionRuleRows() output.
function FusionRules({ rows }) {
  const classes = useAdminStyles();
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
    <dl className={classes.definitionList}>
      {rows.map((row) => (
        <div key={row.key} className={classes.definitionRow}>
          <Typography component="dt" variant="body2" color="textSecondary" style={LABEL_STYLE}>
            {formatMessage(`biometric.criteria.rule.${row.key}`)}
          </Typography>
          <Typography component="dd" variant="body2" className={classes.definitionValue}>{valueText(row)}</Typography>
        </div>
      ))}
    </dl>
  );
}

export default FusionRules;
