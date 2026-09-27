import * as React from 'react';
import { FormControlLabel, Grid, Switch } from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  GRID_RESPONSIVE_STANDARD,
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
import FilterSelect from '../common/FilterSelect';

const StyledForm = styled('div')(() => ({
  padding: '0 0 10px 0',
  width: '100%',
}));

const StyledItem = styled('div')(({ theme }) => ({
  padding: theme.spacing(1),
}));

function BiometricAlertFilter({ filters, onChangeFilters }) {
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
    <Grid container component={StyledForm}>
      <Grid size={GRID_RESPONSIVE_STANDARD} component={StyledItem}>
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
      <Grid size={GRID_RESPONSIVE_STANDARD} component={StyledItem}>
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
        <Grid size={GRID_RESPONSIVE_STANDARD} component={StyledItem}>
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
      <Grid size={GRID_RESPONSIVE_STANDARD} component={StyledItem}>
        <TextInput
          module={MODULE_KEY}
          label="biometric.alert.subjectId"
          value={filterValue('subjectId') ?? ''}
          onChange={debouncedSubjectId}
        />
      </Grid>
      <Grid size={GRID_RESPONSIVE_STANDARD} component={StyledItem}>
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
