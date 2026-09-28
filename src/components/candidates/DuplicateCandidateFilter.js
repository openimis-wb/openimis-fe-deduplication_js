import * as React from 'react';
import { Grid } from '@material-ui/core';
import {
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
import { useFilterStyles } from '../common/adminStyles';
import FilterSelect from '../common/FilterSelect';

function DuplicateCandidateFilter({ filters, onChangeFilters }) {
  const classes = useFilterStyles();
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
    <Grid container className={classes.form}>
      <Grid item xs={12} sm={6} md={4} lg={3} className={classes.item}>
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
      <Grid item xs={12} sm={6} md={4} lg={3} className={classes.item}>
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
      <Grid item xs={12} sm={6} md={4} lg={3} className={classes.item}>
        <TextInput
          module={MODULE_KEY}
          label="candidates.filter.subjectId"
          value={filterValue('subjectId') ?? ''}
          onChange={debouncedSubjectId}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3} className={classes.item}>
        <PublishedComponent
          pubRef="core.DatePicker"
          module={MODULE_KEY}
          label="filter.dateFrom"
          value={filterValue('dateCreated_Gte')}
          onChange={change('dateCreated_Gte')}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3} className={classes.item}>
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
