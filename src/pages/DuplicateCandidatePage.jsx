import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Alert, Box, Chip, Grid, Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Helmet,
  ProgressOrError,
  Searcher,
  useModulesManager,
  useParams,
  useTranslations,
} from '@openimis/fe-core';
import { useIntl } from 'react-intl';
import { fetchDuplicateCandidate, fetchPairSiblings } from '../adminActions';
import { ADMIN_ACTION_TYPE } from '../adminReducer';
import {
  ADMIN_STORE_KEY, MODULE_KEY, RIGHT_BIOMETRIC_READ, RIGHT_DUPLICATE_SEARCH,
} from '../constants';
import {
  canResolve, evidenceRows, scoreLabel, siblingState,
} from '../util/candidates';
import {
  hasRight, isUuid, labelOr, toUuid,
} from '../util/gql';
import {
  mutationLogError, useAdminSlice, useMutationSettled, useUserRights,
} from '../components/common/adminHooks';
import SubjectCard, { StyledCard } from '../components/candidates/SubjectCard';
import ResolvePanel from '../components/candidates/ResolvePanel';
import BiometricTemplatesPanel from '../components/biometric/BiometricTemplatesPanel';

const StyledPage = styled('div')(({ theme }) => ({
  ...(theme.page ?? {}),
}));

const BIOMETRIC_KIND = 'biometric';

function DuplicateCandidatePage() {
  const dispatch = useDispatch();
  const intl = useIntl();
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues, formatDateTimeFromISO } = useTranslations(
    MODULE_KEY,
    modulesManager,
  );
  const rights = useUserRights();
  const { candidate_id: candidateUuid } = useParams();
  const candidateSlice = useAdminSlice('candidate');
  const siblingsSlice = useAdminSlice('pairSiblings');
  const submitting = useSelector((state) => state[ADMIN_STORE_KEY]?.submittingMutation);
  const [subjectStates, setSubjectStates] = React.useState({});
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [outcome, setOutcome] = React.useState(null);

  const validId = isUuid(candidateUuid);
  const loaded = candidateSlice?.items?.[0] ?? null;
  const candidate = loaded && toUuid(loaded.id) === candidateUuid ? loaded : null;

  React.useEffect(() => {
    if (validId) dispatch(fetchDuplicateCandidate(candidateUuid));
  }, [candidateUuid]);

  useMutationSettled([ADMIN_ACTION_TYPE.RESOLVE_CANDIDATE], (log) => {
    const failure = log?.status === 1 ? (mutationLogError(log) || formatMessage('resolve.failed')) : null;
    setOutcome(failure ? { severity: 'error', text: failure } : null);
    if (validId) dispatch(fetchDuplicateCandidate(candidateUuid));
    setRefreshKey((key) => key + 1);
  });

  const onSubjectState = React.useCallback((subjectId, state) => {
    setSubjectStates((current) => ({ ...current, [subjectId]: state }));
  }, []);

  if (!hasRight(rights, RIGHT_DUPLICATE_SEARCH)) return null;

  if (!validId) {
    return <StyledPage><Alert severity="error">{formatMessage('candidate.invalidId')}</Alert></StyledPage>;
  }

  if (!candidate) {
    return (
      <StyledPage>
        <ProgressOrError progress={candidateSlice?.fetching} error={candidateSlice?.error} />
        {candidateSlice?.fetched && !candidateSlice?.error && (
          <Alert severity="warning">{formatMessage('candidate.notFound')}</Alert>
        )}
      </StyledPage>
    );
  }

  const pairState = siblingState(candidate, siblingsSlice?.items ?? [], subjectStates);
  const kindLabel = labelOr(intl.messages, `${MODULE_KEY}.candidate.kind.${candidate.kind}`, candidate.kind);
  const evidence = evidenceRows(candidate).map(([key, value]) => ({
    key,
    label: labelOr(intl.messages, `${MODULE_KEY}.candidate.evidence.${key}`, key),
    value,
  }));
  const siblings = (siblingsSlice?.items ?? []).filter((row) => row.id !== candidate.id);

  return (
    <StyledPage>
      <Helmet title={formatMessage('candidate.helmet')} />
      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" mb={2}>
        <Typography variant="h6">{formatMessage('candidate.title')}</Typography>
        <Chip
          label={formatMessage(`candidate.status.${candidate.status}`)}
          color={candidate.status === 'OPEN' ? 'primary' : 'default'}
        />
        <Chip variant="outlined" label={kindLabel} />
        <Typography variant="body2">
          {formatMessageWithValues('candidate.scoreSource', { score: scoreLabel(candidate), source: candidate.source })}
        </Typography>
      </Box>
      {outcome && <Alert severity={outcome.severity} sx={{ mb: 2 }}>{outcome.text}</Alert>}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <SubjectCard
            key={`a-${refreshKey}`}
            subjectModel={candidate.subjectModel}
            subjectId={candidate.subjectA}
            title={formatMessage('candidate.subjectA')}
            onState={onSubjectState}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <SubjectCard
            key={`b-${refreshKey}`}
            subjectModel={candidate.subjectModel}
            subjectId={candidate.subjectB}
            title={formatMessage('candidate.subjectB')}
            onState={onSubjectState}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Searcher
            module={MODULE_KEY}
            fetch={() => null}
            items={evidence}
            fetchedItems
            fetchingItems={false}
            errorItems={null}
            tableTitle={formatMessage('candidate.evidenceTitle')}
            headers={() => ['candidate.evidence.field', 'candidate.evidence.value']}
            itemFormatters={() => [(row) => row.label, (row) => row.value]}
            rowIdentifier={(row) => row.key}
            withPagination={false}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Searcher
            key={refreshKey}
            module={MODULE_KEY}
            fetch={() => dispatch(fetchPairSiblings(candidate.subjectModel, candidate.subjectA, candidate.subjectB))}
            items={siblings}
            fetchedItems={siblingsSlice?.fetched}
            fetchingItems={siblingsSlice?.fetching}
            errorItems={siblingsSlice?.error}
            tableTitle={formatMessage('candidate.siblingsTitle')}
            headers={() => ['candidates.kind', 'candidates.status', 'candidates.score', 'candidates.reviewedBy']}
            itemFormatters={() => [
              (row) => labelOr(intl.messages, `${MODULE_KEY}.candidate.kind.${row.kind}`, row.kind),
              (row) => formatMessage(`candidate.status.${row.status}`),
              (row) => scoreLabel(row),
              (row) => row.reviewedBy || '',
            ]}
            rowIdentifier={(row) => row.id}
            withPagination={false}
          />
        </Grid>
        {candidate.kind === BIOMETRIC_KIND && hasRight(rights, RIGHT_BIOMETRIC_READ) && (
          <>
            <Grid size={{ xs: 12, md: 6 }}>
              <BiometricTemplatesPanel
                subjectModel={candidate.subjectModel}
                subjectId={candidate.subjectA}
                title={formatMessage('candidate.templatesA')}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <BiometricTemplatesPanel
                subjectModel={candidate.subjectModel}
                subjectId={candidate.subjectB}
                title={formatMessage('candidate.templatesB')}
              />
            </Grid>
          </>
        )}
        <Grid size={12}>
          {canResolve(candidate, rights) && (
            <ResolvePanel
              key={`${candidate.id}-${candidate.status}`}
              candidate={candidate}
              pairState={pairState}
              submitting={!!submitting}
            />
          )}
          {candidate.status !== 'OPEN' && (
            <StyledCard>
              <Typography variant="subtitle1" gutterBottom>{formatMessage('candidate.decision')}</Typography>
              <Typography variant="body2">
                {formatMessageWithValues('candidate.reviewed', {
                  by: candidate.reviewedBy || '—',
                  at: candidate.reviewedAt ? formatDateTimeFromISO(candidate.reviewedAt) : '—',
                })}
              </Typography>
              {candidate.decisionNote && (
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{candidate.decisionNote}</Typography>
              )}
            </StyledCard>
          )}
        </Grid>
      </Grid>
    </StyledPage>
  );
}

export default DuplicateCandidatePage;
