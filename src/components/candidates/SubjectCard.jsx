import * as React from 'react';
import { Paper, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useModulesManager, useTranslations } from '@openimis/fe-core';
import { MODULE_KEY, SUBJECT_CARD_CONTRIBUTION_KEY } from '../../constants';

export const StyledCard = styled(Paper)(({ theme }) => ({
  ...(theme.paper?.paper ?? {}),
  padding: theme.spacing(2),
  height: '100%',
}));

// Renders the card contributed for the subject model under
// 'deduplication.SubjectCard' ({subjectModel, component}); without one it shows
// the model and the id only. onState(subjectId, {isDeleted, retiredInto}) lets
// a card report the record state it read.
function SubjectCard({
  subjectModel, subjectId, title, onState,
}) {
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(MODULE_KEY, modulesManager);
  const contribution = (modulesManager.getContribs(SUBJECT_CARD_CONTRIBUTION_KEY) || [])
    .find((entry) => entry?.subjectModel === subjectModel && entry?.component);

  if (contribution) {
    const Card = contribution.component;
    return <Card subjectModel={subjectModel} subjectId={subjectId} title={title} onState={onState} />;
  }
  return (
    <StyledCard>
      {title && <Typography variant="subtitle1" gutterBottom>{title}</Typography>}
      <Typography variant="body2">{`${formatMessage('subject.model')}: ${subjectModel}`}</Typography>
      <Typography variant="body2">{`${formatMessage('subject.id')}: ${subjectId}`}</Typography>
      <Typography variant="caption" color="textSecondary">{formatMessage('subject.noCard')}</Typography>
    </StyledCard>
  );
}

export default SubjectCard;
