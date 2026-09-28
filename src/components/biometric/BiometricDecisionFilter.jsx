import * as React from 'react';
import { Grid } from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  GRID_RESPONSIVE_STANDARD,
  PublishedComponent,
  useModulesManager,
  useTranslations,
} from '@openimis/fe-core';
import { MODULE_KEY, RIGHT_BIOMETRIC_IDENTIFY, RIGHT_BIOMETRIC_READ } from '../../constants';
import { configReadRights } from '../../config';
import { useGqlQuery } from '../../hooks';
import { RISK_PROFILE_NAMES_QUERY } from '../../queries';
import { filterSelectValues } from '../../util/biometric';
import {
  DECISION_OUTCOMES, decisionFilterFragment, riskProfileNames, verificationScreenAccess,
} from '../../util/verifications';
import { useUserRights } from '../common/adminHooks';
import FilterSelect from '../common/FilterSelect';

const StyledForm = styled('div')(() => ({
  padding: '0 0 10px 0',
  width: '100%',
}));

const StyledItem = styled('div')(({ theme }) => ({
  padding: theme.spacing(1),
}));

// The risk profile filter lists the configured profiles; it is hidden from
// callers without the configuration read right, and when no profile is read.
function BiometricDecisionFilter({ filters, onChangeFilters }) {
  const modulesManager = useModulesManager();
  const rights = useUserRights();
  const { formatMessage } = useTranslations(MODULE_KEY, modulesManager);
  const { canFilterProfiles: canReadProfiles } = verificationScreenAccess(rights, {
    readRights: [RIGHT_BIOMETRIC_READ],
    identifyRights: [RIGHT_BIOMETRIC_IDENTIFY],
    configRights: configReadRights(modulesManager),
  });
  const { data, errors } = useGqlQuery(RISK_PROFILE_NAMES_QUERY, {}, { skip: !canReadProfiles });
  const profiles = canReadProfiles && !errors ? riskProfileNames(data) : [];
  const filterValue = (id) => filters?.[id]?.value ?? null;

  const change = (id) => (value) => onChangeFilters([{
    id,
    value: value === '' || value === undefined ? null : value,
    filter: decisionFilterFragment(id, value),
  }]);

  return (
    <Grid container component={StyledForm}>
      <Grid size={GRID_RESPONSIVE_STANDARD} component={StyledItem}>
        <FilterSelect
          name="outcome"
          label={formatMessage('biometric.decision.outcome')}
          anyLabel={formatMessage('filter.any')}
          values={DECISION_OUTCOMES}
          optionLabel={(v) => formatMessage(`biometric.decision.outcome.${v}`)}
          value={filterValue('outcome')}
          onChange={change('outcome')}
        />
      </Grid>
      {profiles.length > 0 && (
        <Grid size={GRID_RESPONSIVE_STANDARD} component={StyledItem}>
          <FilterSelect
            name="riskProfile"
            label={formatMessage('biometric.decision.riskProfile')}
            anyLabel={formatMessage('filter.any')}
            values={filterSelectValues(profiles, filterValue('riskProfile'))}
            optionLabel={(v) => v}
            value={filterValue('riskProfile')}
            onChange={change('riskProfile')}
          />
        </Grid>
      )}
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

export default BiometricDecisionFilter;
