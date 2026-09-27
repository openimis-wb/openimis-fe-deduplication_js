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
import { CANDIDATE_STATUS, DEFAULT_DEBOUNCE_TIME, MODULE_KEY } from '../../constants';
import { candidateKinds } from '../../config';
import { candidateFilterFragment } from '../../util/candidates';
import { labelOr } from '../../util/gql';
import FilterSelect from '../common/FilterSelect';

const StyledForm = styled('div')(() => ({
  padding: '0 0 10px 0',
  width: '100%',
}));

const StyledItem = styled('div')(({ theme }) => ({
  padding: theme.spacing(1),
}));

function DuplicateCandidateFilter({ filters, onChangeFilters }) {
  const modulesManager = useModulesManager();
  const intl = useIntl();
  const { formatMessage } = useTranslations(MODULE_KEY, modulesManager);
  const filterValue = (id) => filters?.[id]?.value ?? null;

  const change = (id) => (value) => onChangeFilters([{
    id,
    value: value === '' || value === undefined ? null : value,
    filter: candidateFilterFragment(id, value),
  }]);
  const debouncedSubjectId = useDebounceCb(change('subjectId'), DEFAULT_DEBOUNCE_TIME);

  return (
    <Grid container component={StyledForm}>
      <Grid size={GRID_RESPONSIVE_STANDARD} component={StyledItem}>
        <FilterSelect
          name="status"
          label={formatMessage('candidates.filter.status')}
          anyLabel={formatMessage('filter.any')}
          values={Object.values(CANDIDATE_STATUS)}
          optionLabel={(v) => formatMessage(`candidate.status.${v}`)}
          value={filterValue('status')}
          onChange={change('status')}
        />
      </Grid>
      <Grid size={GRID_RESPONSIVE_STANDARD} component={StyledItem}>
        <FilterSelect
          name="kind"
          label={formatMessage('candidates.filter.kind')}
          anyLabel={formatMessage('filter.any')}
          values={candidateKinds(modulesManager)}
          optionLabel={(v) => labelOr(intl.messages, `${MODULE_KEY}.candidate.kind.${v}`, v)}
          value={filterValue('kind')}
          onChange={change('kind')}
        />
      </Grid>
      <Grid size={GRID_RESPONSIVE_STANDARD} component={StyledItem}>
        <TextInput
          module={MODULE_KEY}
          label="candidates.filter.subjectId"
          value={filterValue('subjectId') ?? ''}
          onChange={debouncedSubjectId}
        />
      </Grid>
      <Grid size={GRID_RESPONSIVE_STANDARD} component={StyledItem}>
        <PublishedComponent
          pubRef="core.DatePicker"
          module={MODULE_KEY}
          label="filter.dateFrom"
          value={filterValue('dateCreated_Gte')}
          onChange={change('dateCreated_Gte')}
        />
      </Grid>
      <Grid size={GRID_RESPONSIVE_STANDARD} component={StyledItem}>
        <PublishedComponent
          pubRef="core.DatePicker"
          module={MODULE_KEY}
          label="filter.dateTo"
          value={filterValue('dateCreated_Lte')}
          onChange={change('dateCreated_Lte')}
        />
      </Grid>
    </Grid>
  );
}

export default DuplicateCandidateFilter;
