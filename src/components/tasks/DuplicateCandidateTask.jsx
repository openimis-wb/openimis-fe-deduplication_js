import * as React from 'react';
import {
  Alert,
  Box,
  FormControlLabel,
  Grid,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from '@mui/material';
import { useModulesManager, useTranslations } from '@openimis/fe-core';
import { useIntl } from 'react-intl';
import { MODULE_KEY } from '../../constants';
import { useGqlQuery } from '../../hooks';
import { CANDIDATE_STATUS_QUERY } from '../../queries';
import {
  DECISION_DIFFERENT, DECISION_SAME, STATUS_OPEN, evidenceRows,
} from '../../util/candidates';
import {
  isPlainObject, isUuid, labelOr, parseJson,
} from '../../util/gql';
import {
  buildTaskResolution,
  decodeCompletedResolution,
  encodeAdditionalData,
} from '../../util/taskResolveData';
import SubjectCard from '../candidates/SubjectCard';

// Review form of a deduplication_candidate task. The decision goes to the task
// as additionalData; completing the task resolves the candidate server-side.
// A candidate already resolved elsewhere turns the form read-only and sends no
// decision. When its status cannot be read, the form stays open.
function DuplicateCandidateTaskDisplay({ businessData, jsonExt, setAdditionalData }) {
  const intl = useIntl();
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues, formatDateTimeFromISO } = useTranslations(
    MODULE_KEY,
    modulesManager,
  );
  const [decision, setDecision] = React.useState(null);
  const [keep, setKeep] = React.useState(null);
  const [note, setNote] = React.useState('');

  const data = parseJson(businessData);
  const recorded = decodeCompletedResolution(parseJson(jsonExt));
  const candidateUuid = isPlainObject(data) && isUuid(data.id) ? data.id : null;
  const { data: statusData } = useGqlQuery(
    CANDIDATE_STATUS_QUERY,
    { id: candidateUuid },
    { skip: !!recorded || !candidateUuid },
  );
  const current = statusData?.duplicateCandidates?.edges?.[0]?.node ?? null;
  const resolvedElsewhere = !recorded && !!current && current.status !== STATUS_OPEN;

  React.useEffect(() => {
    if (recorded || !setAdditionalData || !isPlainObject(data)) return;
    if (resolvedElsewhere) {
      setAdditionalData(null);
      return;
    }
    try {
      setAdditionalData(encodeAdditionalData(buildTaskResolution({ decision, keep, note }, data)));
    } catch {
      setAdditionalData(null);
    }
  }, [decision, keep, note, resolvedElsewhere]);

  if (!isPlainObject(data) || !data.subject_a || !data.subject_b) return null;

  const pair = [data.subject_a, data.subject_b];
  const evidence = evidenceRows({ evidence: data.evidence })
    .map(([key, value]) => `${labelOr(intl.messages, `${MODULE_KEY}.candidate.evidence.${key}`, key)}: ${value}`)
    .join(' · ');
  const kindLabel = labelOr(intl.messages, `${MODULE_KEY}.candidate.kind.${data.kind}`, data.kind);

  let valid = true;
  try {
    buildTaskResolution({ decision, keep, note }, data);
  } catch {
    valid = false;
  }

  return (
    <Box textAlign="left" fontWeight="normal">
      <Typography variant="body2" gutterBottom>
        {formatMessageWithValues('tasks.candidate.summary', { kind: kindLabel, evidence })}
      </Typography>
      <Grid container spacing={2}>
        {pair.map((subjectId, index) => (
          <Grid size={{ xs: 12, md: 6 }} key={subjectId}>
            <SubjectCard
              subjectModel={data.subject_model}
              subjectId={subjectId}
              title={formatMessage(index === 0 ? 'candidate.subjectA' : 'candidate.subjectB')}
            />
          </Grid>
        ))}
      </Grid>
      {resolvedElsewhere && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          {formatMessageWithValues('tasks.candidate.alreadyResolved', {
            status: formatMessage(`candidate.status.${current.status}`),
            by: current.reviewedBy || '—',
            at: current.reviewedAt ? formatDateTimeFromISO(current.reviewedAt) : '—',
          })}
        </Alert>
      )}
      {recorded && (
        <Alert severity="info" sx={{ mt: 2 }}>
          {formatMessageWithValues(
            recorded.decision === DECISION_SAME
              ? 'tasks.candidate.recorded.same'
              : 'tasks.candidate.recorded.different',
            { keep: recorded.keep ?? '—', note: recorded.note || '—' },
          )}
        </Alert>
      )}
      {!recorded && !resolvedElsewhere && (
        <Box mt={2}>
          <Typography variant="subtitle2">{formatMessage('tasks.candidate.decision')}</Typography>
          <RadioGroup value={decision ?? ''} onChange={(e) => setDecision(e.target.value)}>
            <FormControlLabel value={DECISION_SAME} control={<Radio />} label={formatMessage('resolve.same')} />
            <FormControlLabel
              value={DECISION_DIFFERENT}
              control={<Radio />}
              label={formatMessage('resolve.different')}
            />
          </RadioGroup>
          {decision === DECISION_SAME && (
            <>
              <Typography variant="subtitle2">{formatMessage('resolve.keepLabel')}</Typography>
              <RadioGroup value={keep ?? ''} onChange={(e) => setKeep(e.target.value)}>
                {pair.map((subjectId, index) => (
                  <FormControlLabel
                    key={subjectId}
                    value={subjectId}
                    control={<Radio />}
                    label={formatMessageWithValues(index === 0 ? 'resolve.keepA' : 'resolve.keepB', { id: subjectId })}
                  />
                ))}
              </RadioGroup>
            </>
          )}
          <TextField
            fullWidth
            multiline
            minRows={2}
            margin="dense"
            label={formatMessage('resolve.note')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          {!valid && <Alert severity="warning">{formatMessage('tasks.candidate.incomplete')}</Alert>}
        </Box>
      )}
    </Box>
  );
}

const DuplicateCandidateTaskTableHeaders = () => [];

const DuplicateCandidateTaskItemFormatters = () => [
  (businessData, jsonExt, formatterIndex, setAdditionalData) => (businessData ? (
    <DuplicateCandidateTaskDisplay
      businessData={businessData}
      jsonExt={jsonExt}
      setAdditionalData={setAdditionalData}
    />
  ) : null),
];

export { DuplicateCandidateTaskTableHeaders, DuplicateCandidateTaskItemFormatters };
