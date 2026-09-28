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
import { DEFAULT_DEBOUNCE_TIME, MODULE_KEY } from '../../constants';
import { labelOr } from '../../util/gql';
import { SUSPECTED_VALUES, VERIFICATION_MODALITIES, verificationFilterFragment } from '../../util/verifications';
import FilterSelect from '../common/FilterSelect';

const StyledForm = styled('div')(() => ({
  padding: '0 0 10px 0',
  width: '100%',
}));

const StyledItem = styled('div')(({ theme }) => ({
  padding: theme.spacing(1),
}));

// The record id is the only free-text filter.
function BiometricVerificationFilter({ filters, onChangeFilters }) {
  const intl = useIntl();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(MODULE_KEY, modulesManager);
  const filterValue = (id) => filters?.[id]?.value ?? null;

  const change = (id) => (value) => onChangeFilters([{
    id,
    value: value === '' || value === undefined ? null : value,
    filter: verificationFilterFragment(id, value),
  }]);
  const debouncedSubjectId = useDebounceCb(change('subjectId'), DEFAULT_DEBOUNCE_TIME);

  return (
    <Grid container component={StyledForm}>
      <Grid size={GRID_RESPONSIVE_STANDARD} component={StyledItem}>
        <FilterSelect
          name="modality"
          label={formatMessage('biometric.verification.modality')}
          anyLabel={formatMessage('filter.any')}
          values={VERIFICATION_MODALITIES}
          optionLabel={(v) => labelOr(intl.messages, `${MODULE_KEY}.biometric.modality.${v}`, v)}
          value={filterValue('modality')}
          onChange={change('modality')}
        />
      </Grid>
      <Grid size={GRID_RESPONSIVE_STANDARD} component={StyledItem}>
        <FilterSelect
          name="suspected"
          label={formatMessage('biometric.verification.suspected')}
          anyLabel={formatMessage('filter.any')}
          values={SUSPECTED_VALUES}
          optionLabel={(v) => formatMessage(v === 'true' ? 'common.yes' : 'common.no')}
          value={filterValue('suspected')}
          onChange={change('suspected')}
        />
      </Grid>
      <Grid size={GRID_RESPONSIVE_STANDARD} component={StyledItem}>
        <TextInput
          module={MODULE_KEY}
          label="biometric.verification.subjectId"
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

export default BiometricVerificationFilter;
