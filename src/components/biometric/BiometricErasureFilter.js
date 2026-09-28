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
import { DEFAULT_DEBOUNCE_TIME, ERASURE_REASONS, MODULE_KEY } from '../../constants';
import { erasureFilterFragment } from '../../util/biometric';
import { labelOr } from '../../util/gql';
import { useFilterStyles } from '../common/adminStyles';
import FilterSelect from '../common/FilterSelect';

export const erasureReasonLabel = (messages, reason) => labelOr(
  messages,
  `${MODULE_KEY}.biometric.erasure.reason.${reason}`,
  reason,
);

function BiometricErasureFilter({ filters, onChangeFilters }) {
  const classes = useFilterStyles();
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
    <Grid container className={classes.form}>
      <Grid item xs={12} sm={6} md={4} lg={3} className={classes.item}>
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
      <Grid item xs={12} sm={6} md={4} lg={3} className={classes.item}>
        <TextInput
          module={MODULE_KEY}
          label="biometric.erasure.subjectModel"
          value={filterValue('subjectModel') ?? ''}
          onChange={debouncedSubjectModel}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3} className={classes.item}>
        <TextInput
          module={MODULE_KEY}
          label="biometric.erasure.subjectId"
          value={filterValue('subjectId') ?? ''}
          onChange={debouncedSubjectId}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3} className={classes.item}>
        <TextInput
          module={MODULE_KEY}
          label="biometric.erasure.erasedBy"
          value={filterValue('erasedBy') ?? ''}
          onChange={debouncedErasedBy}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3} className={classes.item}>
        <PublishedComponent
          pubRef="core.DatePicker"
          module={MODULE_KEY}
          label="filter.dateFrom"
          value={filterValue('erasedAt_Gte')}
          onChange={change('erasedAt_Gte')}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3} className={classes.item}>
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
