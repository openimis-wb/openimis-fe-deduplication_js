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
import { AUDIT_ACTIONS, DEFAULT_DEBOUNCE_TIME, MODULE_KEY } from '../../constants';
import { auditFilterFragment } from '../../util/biometric';
import { labelOr } from '../../util/gql';
import { useFilterStyles } from '../common/adminStyles';
import FilterSelect from '../common/FilterSelect';

export const auditActionLabel = (messages, action) => labelOr(
  messages,
  `${MODULE_KEY}.biometric.audit.action.${action}`,
  action,
);

function BiometricAuditEventFilter({ filters, onChangeFilters }) {
  const classes = useFilterStyles();
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
    <Grid container className={classes.form}>
      <Grid item xs={12} sm={6} md={4} lg={3} className={classes.item}>
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
      <Grid item xs={12} sm={6} md={4} lg={3} className={classes.item}>
        <TextInput
          module={MODULE_KEY}
          label="biometric.audit.actor"
          value={filterValue('actor') ?? ''}
          onChange={debouncedActor}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3} className={classes.item}>
        <TextInput
          module={MODULE_KEY}
          label="biometric.audit.subjectId"
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

export default BiometricAuditEventFilter;
