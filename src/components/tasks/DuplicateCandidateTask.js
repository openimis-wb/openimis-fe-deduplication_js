import * as React from 'react';
import {
  Box,
  FormControlLabel,
  Grid,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { useModulesManager, useTranslations } from '@openimis/fe-core';
import { useIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import { MODULE_KEY } from '../../constants';
import { isPermissionError, useGqlQuery } from '../../hooks';
import { CANDIDATE_STATUS_QUERY, USERNAME_QUERY } from '../../queries';
import { DECISION_DIFFERENT, DECISION_SAME, evidenceRows } from '../../util/candidates';
import {
  isPlainObject, isUuid, labelOr, parseJson,
} from '../../util/gql';
import {
  TASK_FORM_NO_RIGHT,
  TASK_FORM_OPEN,
  TASK_FORM_RESOLVED_ELSEWHERE,
  buildTaskResolution,
  finalResolutions,
  formStateFromResolution,
  otherResolutions,
  ownResolution,
  taskAdditionalData,
  taskAwaitsDecision,
  taskFormMode,
} from '../../util/taskResolveData';
import SubjectCard from '../candidates/SubjectCard';

// One approver's stored decision. The approver is named by username; the user id
// stands in when the name cannot be read.
function StoredResolution({ userId, resolution, own }) {
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues } = useTranslations(MODULE_KEY, modulesManager);
  const { data } = useGqlQuery(USERNAME_QUERY, { id: userId }, { skip: own || !isUuid(userId) });
  const who = own
    ? formatMessage('tasks.candidate.entry.you')
    : data?.users?.edges?.[0]?.node?.username ?? userId;
  return (
    <Typography variant="body2" component="div">
      {formatMessageWithValues(
        resolution.decision === DECISION_SAME ? 'tasks.candidate.entry.same' : 'tasks.candidate.entry.different',
        { who, keep: resolution.keep ?? '—', note: resolution.note || '—' },
      )}
    </Typography>
  );
}

// Review form of a deduplication_candidate task. The decision goes to the task
// as additionalData; completing the task resolves the candidate server-side with
// the entry of the approver who completes it. Until the task is COMPLETED the form
// stays editable and starts from the current user's own stored entry, since a
// refused completion leaves the entries on the task; only a COMPLETED task shows
// them as final. A candidate already resolved elsewhere turns the form read-only
// and sends no decision. When reading its status is refused for lack of rights,
// the form says so, disables its controls and sends no decision; when the status
// is otherwise unreadable, the form stays open.
function DuplicateCandidateTaskDisplay({ businessData, jsonExt, setAdditionalData }) {
  const intl = useIntl();
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues, formatDateTimeFromISO } = useTranslations(
    MODULE_KEY,
    modulesManager,
  );
  const currentUserId = useSelector((state) => state.core?.user?.id ?? null);
  const taskStatus = useSelector((state) => state.tasksManagement?.task?.status ?? null);

  const storedExt = parseJson(jsonExt);
  const own = ownResolution(storedExt, currentUserId);
  const others = otherResolutions(storedExt, currentUserId);
  const recorded = finalResolutions(storedExt, taskStatus);
  const ownKey = JSON.stringify(own);
  const [decision, setDecision] = React.useState(formStateFromResolution(own).decision);
  const [keep, setKeep] = React.useState(formStateFromResolution(own).keep);
  const [note, setNote] = React.useState(formStateFromResolution(own).note);

  React.useEffect(() => {
    const stored = formStateFromResolution(own);
    setDecision(stored.decision);
    setKeep(stored.keep);
    setNote(stored.note);
  }, [ownKey]);

  const data = parseJson(businessData);
  const candidateUuid = isPlainObject(data) && isUuid(data.id) ? data.id : null;
  const { data: statusData, errors: statusErrors } = useGqlQuery(
    CANDIDATE_STATUS_QUERY,
    { id: candidateUuid },
    { skip: !!recorded || !candidateUuid },
  );
  const current = statusData?.duplicateCandidates?.edges?.[0]?.node ?? null;
  const mode = taskFormMode(recorded, current, { statusRefused: isPermissionError(statusErrors) });
  const resolvedElsewhere = mode === TASK_FORM_RESOLVED_ELSEWHERE;
  const noRight = mode === TASK_FORM_NO_RIGHT;

  React.useEffect(() => {
    if (!setAdditionalData) return;
    const additionalData = taskAdditionalData(mode, { decision, keep, note }, data);
    if (additionalData !== undefined) setAdditionalData(additionalData);
  }, [decision, keep, note, mode]);

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
          <Grid item xs={12} md={6} key={subjectId}>
            <SubjectCard
              subjectModel={data.subject_model}
              subjectId={subjectId}
              title={formatMessage(index === 0 ? 'candidate.subjectA' : 'candidate.subjectB')}
            />
          </Grid>
        ))}
      </Grid>
      {resolvedElsewhere && (
        <Box mt={2}>
          <Alert severity="warning">
            {formatMessageWithValues('tasks.candidate.alreadyResolved', {
              status: formatMessage(`candidate.status.${current.status}`),
              by: current.reviewedBy || '—',
              at: current.reviewedAt ? formatDateTimeFromISO(current.reviewedAt) : '—',
            })}
          </Alert>
        </Box>
      )}
      {recorded && (
        <Box mt={2}>
          <Alert severity="info">
            <Typography variant="subtitle2">{formatMessage('tasks.candidate.recorded.title')}</Typography>
            {recorded.map((entry) => (
              <StoredResolution
                key={entry.userId}
                userId={entry.userId}
                resolution={entry.resolution}
                own={entry.userId === currentUserId}
              />
            ))}
          </Alert>
        </Box>
      )}
      {!recorded && others.length > 0 && (
        <Box mt={2}>
          <Alert severity="info">
            <Typography variant="subtitle2">{formatMessage('tasks.candidate.others.title')}</Typography>
            {others.map((entry) => (
              <StoredResolution key={entry.userId} userId={entry.userId} resolution={entry.resolution} />
            ))}
          </Alert>
        </Box>
      )}
      {mode === TASK_FORM_OPEN && own && taskAwaitsDecision(taskStatus) && (
        <Box mt={2}>
          <Alert severity="info">{formatMessage('tasks.candidate.pending')}</Alert>
        </Box>
      )}
      {noRight && (
        <Box mt={2}>
          <Alert severity="warning">{formatMessage('tasks.candidate.notReadable')}</Alert>
        </Box>
      )}
      {!recorded && !resolvedElsewhere && (
        <Box mt={2}>
          <Typography variant="subtitle2">{formatMessage('tasks.candidate.decision')}</Typography>
          <RadioGroup value={decision ?? ''} onChange={(e) => setDecision(e.target.value)}>
            <FormControlLabel
              value={DECISION_SAME}
              disabled={noRight}
              control={<Radio />}
              label={formatMessage('resolve.same')}
            />
            <FormControlLabel
              value={DECISION_DIFFERENT}
              disabled={noRight}
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
                    disabled={noRight}
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
            disabled={noRight}
            onChange={(e) => setNote(e.target.value)}
          />
          {!valid && !noRight && <Alert severity="warning">{formatMessage('tasks.candidate.incomplete')}</Alert>}
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
