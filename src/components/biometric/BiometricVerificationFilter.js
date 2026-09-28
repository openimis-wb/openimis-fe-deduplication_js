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
import { DEFAULT_DEBOUNCE_TIME, MODULE_KEY } from '../../constants';
import { labelOr } from '../../util/gql';
import { SUSPECTED_VALUES, VERIFICATION_MODALITIES, verificationFilterFragment } from '../../util/verifications';
import { useFilterStyles } from '../common/adminStyles';
import FilterSelect from '../common/FilterSelect';

// The record id is the only free-text filter.
function BiometricVerificationFilter({ filters, onChangeFilters }) {
  const classes = useFilterStyles();
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
    <Grid container className={classes.form}>
      <Grid item xs={12} sm={6} md={4} lg={3} className={classes.item}>
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
      <Grid item xs={12} sm={6} md={4} lg={3} className={classes.item}>
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
      <Grid item xs={12} sm={6} md={4} lg={3} className={classes.item}>
        <TextInput
          module={MODULE_KEY}
          label="biometric.verification.subjectId"
          value={filterValue('subjectId') ?? ''}
          onChange={debouncedSubjectId}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3} className={classes.item}>
        <PublishedComponent
          pubRef="core.DatePicker"
          module={MODULE_KEY}
          label="filter.dateFrom"
          value={filterValue('createdAt_Gte')}
          onChange={change('createdAt_Gte')}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3} className={classes.item}>
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
