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
import { DEFAULT_DEBOUNCE_TIME, ERASURE_REASONS, MODULE_KEY } from '../../constants';
import { useGqlQuery } from '../../hooks';
import { ERASURE_FILTER_VALUES_QUERY } from '../../queries';
import { erasureFilterFragment, erasureFilterValues, filterSelectValues } from '../../util/biometric';
import { labelOr } from '../../util/gql';
import FilterSelect from '../common/FilterSelect';

const StyledForm = styled('div')(() => ({
  padding: '0 0 10px 0',
  width: '100%',
}));

const StyledItem = styled('div')(({ theme }) => ({
  padding: theme.spacing(1),
}));

export const erasureReasonLabel = (messages, reason) => labelOr(
  messages,
  `${MODULE_KEY}.biometric.erasure.reason.${reason}`,
  reason,
);

// Record type and author are selects over the values the erasures hold; when
// the values cannot be read the selects offer "all" only.
function BiometricErasureFilter({ filters, onChangeFilters }) {
  const intl = useIntl();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(MODULE_KEY, modulesManager);
  const { data } = useGqlQuery(ERASURE_FILTER_VALUES_QUERY, {});
  const values = erasureFilterValues(data);
  const filterValue = (id) => filters?.[id]?.value ?? null;

  const change = (id) => (value) => onChangeFilters([{
    id,
    value: value === '' || value === undefined ? null : value,
    filter: erasureFilterFragment(id, value),
  }]);
  const debouncedSubjectId = useDebounceCb(change('subjectId'), DEFAULT_DEBOUNCE_TIME);

  return (
    <Grid container component={StyledForm}>
      <Grid size={GRID_RESPONSIVE_STANDARD} component={StyledItem}>
        <FilterSelect
          name="reason"
          label={formatMessage('biometric.erasure.reason')}
          anyLabel={formatMessage('filter.any')}
          values={ERASURE_REASONS}
          optionLabel={(v) => erasureReasonLabel(intl.messages, v)}
          value={filterValue('reason')}
          onChange={change('reason')}
        />
      </Grid>
      <Grid size={GRID_RESPONSIVE_STANDARD} component={StyledItem}>
        <FilterSelect
          name="subjectModel"
          label={formatMessage('biometric.erasure.subjectModel')}
          anyLabel={formatMessage('filter.any')}
          values={filterSelectValues(values.subjectModel, filterValue('subjectModel'))}
          optionLabel={(v) => v}
          value={filterValue('subjectModel')}
          onChange={change('subjectModel')}
        />
      </Grid>
      <Grid size={GRID_RESPONSIVE_STANDARD} component={StyledItem}>
        <TextInput
          module={MODULE_KEY}
          label="biometric.erasure.subjectId"
          value={filterValue('subjectId') ?? ''}
          onChange={debouncedSubjectId}
        />
      </Grid>
      <Grid size={GRID_RESPONSIVE_STANDARD} component={StyledItem}>
        <FilterSelect
          name="erasedBy"
          label={formatMessage('biometric.erasure.erasedBy')}
          anyLabel={formatMessage('filter.any')}
          values={filterSelectValues(values.erasedBy, filterValue('erasedBy'))}
          optionLabel={(v) => v}
          value={filterValue('erasedBy')}
          onChange={change('erasedBy')}
        />
      </Grid>
      <Grid size={GRID_RESPONSIVE_STANDARD} component={StyledItem}>
        <PublishedComponent
          pubRef="core.DatePicker"
          module={MODULE_KEY}
          label="filter.dateFrom"
          value={filterValue('erasedAt_Gte')}
          onChange={change('erasedAt_Gte')}
        />
      </Grid>
      <Grid size={GRID_RESPONSIVE_STANDARD} component={StyledItem}>
        <PublishedComponent
          pubRef="core.DatePicker"
          module={MODULE_KEY}
          label="filter.dateTo"
          value={filterValue('erasedAt_Lte')}
          onChange={change('erasedAt_Lte')}
        />
      </Grid>
    </Grid>
  );
}

export default BiometricErasureFilter;
