import * as React from 'react';
import { Grid } from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  GRID_RESPONSIVE_STANDARD,
  PublishedComponent,
  TextInput,
  useDebounceCb,
  useModulesManager,
  useTranslations,
} from '@openimis/fe-core';
import { useIntl } from 'react-intl';
import { AUDIT_ACTIONS, DEFAULT_DEBOUNCE_TIME, MODULE_KEY } from '../../constants';
import { auditFilterFragment } from '../../util/biometric';
import { labelOr } from '../../util/gql';
import FilterSelect from '../common/FilterSelect';

const StyledForm = styled('div')(() => ({
  padding: '0 0 10px 0',
  width: '100%',
}));

const StyledItem = styled('div')(({ theme }) => ({
  padding: theme.spacing(1),
}));

export const auditActionLabel = (messages, action) => labelOr(
  messages,
  `${MODULE_KEY}.biometric.audit.action.${action}`,
  action,
);

function BiometricAuditEventFilter({ filters, onChangeFilters }) {
  const intl = useIntl();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(MODULE_KEY, modulesManager);
  const filterValue = (id) => filters?.[id]?.value ?? null;

  const change = (id) => (value) => onChangeFilters([{
    id,
    value: value === '' || value === undefined ? null : value,
    filter: auditFilterFragment(id, value),
  }]);
  const debouncedActor = useDebounceCb(change('actor'), DEFAULT_DEBOUNCE_TIME);
  const debouncedSubjectId = useDebounceCb(change('subjectId'), DEFAULT_DEBOUNCE_TIME);

  return (
    <Grid container component={StyledForm}>
      <Grid size={GRID_RESPONSIVE_STANDARD} component={StyledItem}>
        <FilterSelect
          name="action"
          label={formatMessage('biometric.audit.action')}
          anyLabel={formatMessage('filter.any')}
          values={AUDIT_ACTIONS}
          optionLabel={(v) => auditActionLabel(intl.messages, v)}
          value={filterValue('action')}
          onChange={change('action')}
        />
      </Grid>
      <Grid size={GRID_RESPONSIVE_STANDARD} component={StyledItem}>
        <TextInput
          module={MODULE_KEY}
          label="biometric.audit.actor"
          value={filterValue('actor') ?? ''}
          onChange={debouncedActor}
        />
      </Grid>
      <Grid size={GRID_RESPONSIVE_STANDARD} component={StyledItem}>
        <TextInput
          module={MODULE_KEY}
          label="biometric.audit.subjectId"
          value={filterValue('subjectId') ?? ''}
          onChange={debouncedSubjectId}
        />
      </Grid>
      <Grid size={GRID_RESPONSIVE_STANDARD} component={StyledItem}>
        <PublishedComponent
          pubRef="core.DatePicker"
          module={MODULE_KEY}
          label="filter.dateFrom"
          value={filterValue('createdAt_Gte')}
          onChange={change('createdAt_Gte')}
        />
      </Grid>
      <Grid size={GRID_RESPONSIVE_STANDARD} component={StyledItem}>
        <PublishedComponent
          pubRef="core.DatePicker"
          module={MODULE_KEY}
          label="filter.dateTo"
          value={filterValue('createdAt_Lte')}
          onChange={change('createdAt_Lte')}
        />
      </Grid>
    </Grid>
  );
}

export default BiometricAuditEventFilter;
