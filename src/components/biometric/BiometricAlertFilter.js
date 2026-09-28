import * as React from 'react';
import { FormControlLabel, Grid, Switch } from '@material-ui/core';
import {
  TextInput,
  useDebounceCb,
  useModulesManager,
  useTranslations,
} from '@openimis/fe-core';
import { useIntl } from 'react-intl';
import {
  ALERT_SEVERITIES, ALERT_STATES, DEFAULT_DEBOUNCE_TIME, MODULE_KEY,
} from '../../constants';
import { alertRuleKinds } from '../../config';
import { alertFilterFragment } from '../../util/biometric';
import { labelOr } from '../../util/gql';
import { useFilterStyles } from '../common/adminStyles';
import FilterSelect from '../common/FilterSelect';

function BiometricAlertFilter({ filters, onChangeFilters }) {
  const classes = useFilterStyles();
  const intl = useIntl();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(MODULE_KEY, modulesManager);
  const ruleKinds = alertRuleKinds(modulesManager);
  const filterValue = (id) => filters?.[id]?.value ?? null;

  const change = (id) => (value) => onChangeFilters([{
    id,
    value: value === '' || value === undefined || value === false ? null : value,
    filter: alertFilterFragment(id, value),
  }]);
  const debouncedSubjectId = useDebounceCb(change('subjectId'), DEFAULT_DEBOUNCE_TIME);

  return (
    <Grid container className={classes.form}>
      <Grid item xs={12} sm={6} md={4} lg={3} className={classes.item}>
        <FilterSelect
          name="state"
          label={formatMessage('biometric.alert.state')}
          anyLabel={formatMessage('filter.any')}
          values={ALERT_STATES}
          optionLabel={(v) => formatMessage(`biometric.alert.state.${v}`)}
          value={filterValue('state')}
          onChange={change('state')}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3} className={classes.item}>
        <FilterSelect
          name="severity"
          label={formatMessage('biometric.alert.severity')}
          anyLabel={formatMessage('filter.any')}
          values={ALERT_SEVERITIES}
          optionLabel={(v) => formatMessage(`biometric.alert.severity.${v}`)}
          value={filterValue('severity')}
          onChange={change('severity')}
        />
      </Grid>
      {ruleKinds.length > 0 && (
        <Grid item xs={12} sm={6} md={4} lg={3} className={classes.item}>
          <FilterSelect
            name="ruleKind"
            label={formatMessage('biometric.alert.ruleKind')}
            anyLabel={formatMessage('filter.any')}
            values={ruleKinds}
            optionLabel={(v) => labelOr(intl.messages, `${MODULE_KEY}.biometric.alert.rule.${v}`, v)}
            value={filterValue('ruleKind')}
            onChange={change('ruleKind')}
          />
        </Grid>
      )}
      <Grid item xs={12} sm={6} md={4} lg={3} className={classes.item}>
        <TextInput
          module={MODULE_KEY}
          label="biometric.alert.subjectId"
          value={filterValue('subjectId') ?? ''}
          onChange={debouncedSubjectId}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3} className={classes.item}>
        <FormControlLabel
          control={(
            <Switch
              checked={filterValue('open') === true}
              onChange={(e) => change('open')(e.target.checked)}
            />
          )}
          label={formatMessage('biometric.alert.openOnly')}
        />
      </Grid>
    </Grid>
  );
}

export default BiometricAlertFilter;
