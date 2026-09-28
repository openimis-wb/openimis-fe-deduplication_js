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
import { erasureFilterFragment } from '../../util/biometric';
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

function BiometricErasureFilter({ filters, onChangeFilters }) {
  const intl = useIntl();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(MODULE_KEY, modulesManager);
  const filterValue = (id) => filters?.[id]?.value ?? null;

  const change = (id) => (value) => onChangeFilters([{
    id,
    value: value === '' || value === undefined ? null : value,
    filter: erasureFilterFragment(id, value),
  }]);
  const debouncedSubjectModel = useDebounceCb(change('subjectModel'), DEFAULT_DEBOUNCE_TIME);
  const debouncedSubjectId = useDebounceCb(change('subjectId'), DEFAULT_DEBOUNCE_TIME);
  const debouncedErasedBy = useDebounceCb(change('erasedBy'), DEFAULT_DEBOUNCE_TIME);

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
        <TextInput
          module={MODULE_KEY}
          label="biometric.erasure.subjectModel"
          value={filterValue('subjectModel') ?? ''}
          onChange={debouncedSubjectModel}
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
        <TextInput
          module={MODULE_KEY}
          label="biometric.erasure.erasedBy"
          value={filterValue('erasedBy') ?? ''}
          onChange={debouncedErasedBy}
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
