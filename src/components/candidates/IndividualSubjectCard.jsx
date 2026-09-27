import * as React from 'react';
import {
  Chip, CircularProgress, Stack, Typography,
} from '@mui/material';
import { useModulesManager, useTranslations } from '@openimis/fe-core';
import { MODULE_KEY } from '../../constants';
import { isPermissionError, useGqlQuery } from '../../hooks';
import { INDIVIDUAL_SUBJECT_QUERY } from '../../queries';
import { isPlainObject, parseJson } from '../../util/gql';
import { StyledCard } from './SubjectCard';

// The default subject card for individual.Individual. The individual query
// applies no validity filter unless asked, so soft-deleted (merged) records are shown.
function IndividualSubjectCard({ subjectId, title, onState }) {
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues, formatDateFromISO } = useTranslations(MODULE_KEY, modulesManager);
  const { isLoading, data, errors } = useGqlQuery(INDIVIDUAL_SUBJECT_QUERY, { id: subjectId });
  const individual = data?.individual?.edges?.[0]?.node ?? null;
  const jsonExt = parseJson(individual?.jsonExt);
  const retiredInto = isPlainObject(jsonExt) ? jsonExt.retired_into ?? null : null;
  const conflicts = isPlainObject(jsonExt) && Array.isArray(jsonExt.merge_conflicts)
    ? jsonExt.merge_conflicts.length : 0;

  React.useEffect(() => {
    if (individual && onState) {
      onState(subjectId, { isDeleted: !!individual.isDeleted, retiredInto });
    }
  }, [individual?.id, individual?.isDeleted, retiredInto]);

  let body;
  if (isLoading) {
    body = <CircularProgress size={20} />;
  } else if (isPermissionError(errors)) {
    body = <Typography color="error">{formatMessage('subject.notReadable')}</Typography>;
  } else if (errors) {
    body = <Typography color="error">{formatMessage('subject.loadError')}</Typography>;
  } else if (!individual) {
    body = <Typography>{formatMessage('subject.notFound')}</Typography>;
  } else {
    body = (
      <>
        <Typography variant="h6">{`${individual.firstName} ${individual.lastName}`}</Typography>
        <Typography variant="body2">
          {`${formatMessage('subject.dob')}: ${formatDateFromISO(individual.dob)}`}
        </Typography>
        <Typography variant="body2">
          {`${formatMessage('subject.dateCreated')}: ${formatDateFromISO(individual.dateCreated)}`}
        </Typography>
        <Stack direction="row" spacing={1} mt={1} flexWrap="wrap" useFlexGap>
          {individual.isDeleted && (
            <Chip size="small" color="warning" label={formatMessage('subject.retired')} />
          )}
          {conflicts > 0 && (
            <Chip
              size="small"
              variant="outlined"
              label={formatMessageWithValues('subject.mergeConflicts', { count: conflicts })}
            />
          )}
        </Stack>
        {individual.isDeleted && retiredInto && (
          <Typography variant="caption" display="block" mt={1}>
            {formatMessageWithValues('subject.retiredInto', { id: retiredInto })}
          </Typography>
        )}
      </>
    );
  }

  return (
    <StyledCard>
      {title && <Typography variant="subtitle1" gutterBottom>{title}</Typography>}
      <Typography variant="caption" color="textSecondary" display="block" gutterBottom>{subjectId}</Typography>
      {body}
    </StyledCard>
  );
}

export default IndividualSubjectCard;
