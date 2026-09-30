import * as React from 'react';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import {
  clearConfirm, coreConfirm, useModulesManager, useTranslations,
} from '@openimis/fe-core';
import { resolveDuplicateCandidate } from '../../adminActions';
import { MODULE_KEY } from '../../constants';
import { useResolveCheck } from '../../hooks';
import { DECISION_DIFFERENT, DECISION_SAME, keepOptions } from '../../util/candidates';
import { toUuid } from '../../util/gql';
import { checkBlocksDecision, checkRefusalText } from '../../util/resolveCheck';
import { useAdminStyles } from '../common/adminStyles';
import { StyledCard } from './SubjectCard';

// Resolve controls of an OPEN candidate. The kept subject is always chosen
// explicitly; when another kind of this pair was already merged, keep is locked
// to the subject that merge kept, and merging is blocked when that subject is unknown.
// Such a pair can no longer be dismissed as different persons. Each decision is
// checked with the server as soon as it can be taken (the merge once a record to
// keep is chosen), and its button stays disabled, with the refusal shown, while the
// server would refuse it.
function ResolvePanel({ candidate, pairState, submitting }) {
  const classes = useAdminStyles();
  const dispatch = useDispatch();
  const intl = useIntl();
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues } = useTranslations(MODULE_KEY, modulesManager);
  const confirmed = useSelector((state) => state.core?.confirmed);
  const [keep, setKeep] = React.useState(null);
  const [note, setNote] = React.useState('');
  const [pending, setPending] = React.useState(null);
  const [error, setError] = React.useState(null);

  const locked = pairState.mergedAlready;
  const lockedKeep = locked ? pairState.keptId : null;
  const effectiveKeep = locked ? lockedKeep : keep;
  const candidateId = toUuid(candidate.id);
  const checkSame = useResolveCheck({
    candidateId,
    decision: DECISION_SAME,
    keep: effectiveKeep,
    subjectA: candidate.subjectA,
    subjectB: candidate.subjectB,
  });
  const checkDifferent = useResolveCheck({
    candidateId,
    decision: DECISION_DIFFERENT,
    subjectA: candidate.subjectA,
    subjectB: candidate.subjectB,
  });
  const refusalSame = checkRefusalText(checkSame, intl.messages);
  const refusalDifferent = pairState.canDismiss ? checkRefusalText(checkDifferent, intl.messages) : null;
  const canMerge = !submitting && !!effectiveKeep && !pairState.conflictingKeep(effectiveKeep)
    && !checkBlocksDecision(checkSame);

  React.useEffect(() => {
    if (!pending || confirmed === null || confirmed === undefined) return;
    const decision = pending;
    setPending(null);
    dispatch(clearConfirm(null));
    if (!confirmed) return;
    try {
      dispatch(resolveDuplicateCandidate(
        {
          uuid: toUuid(candidate.id),
          decision,
          keep: decision === DECISION_SAME ? effectiveKeep : null,
          note,
        },
        candidate,
        formatMessage(decision === DECISION_SAME ? 'resolve.mutationLabel.same' : 'resolve.mutationLabel.different'),
      ));
      setError(null);
    } catch (e) {
      setError(formatMessage(`resolve.error.${e.message}`));
    }
  }, [confirmed]);

  const ask = (decision) => {
    setPending(decision);
    if (decision === DECISION_SAME) {
      dispatch(coreConfirm(
        formatMessage('resolve.confirm.same.title'),
        formatMessageWithValues('resolve.confirm.same.message', {
          kept: effectiveKeep,
          retired: keepOptions(candidate).find((id) => id !== effectiveKeep),
        }),
      ));
    } else {
      dispatch(coreConfirm(
        formatMessage('resolve.confirm.different.title'),
        formatMessage('resolve.confirm.different.message'),
      ));
    }
  };

  return (
    <StyledCard>
      <Typography variant="subtitle1" gutterBottom>{formatMessage('resolve.title')}</Typography>
      {locked && (
        <Box mb={1}>
          <Alert severity="info">
            {lockedKeep
              ? formatMessageWithValues('resolve.lockedKeep', { kept: lockedKeep })
              : formatMessage('resolve.lockedUnknown')}
          </Alert>
        </Box>
      )}
      <Typography variant="body2">{formatMessage('resolve.keepLabel')}</Typography>
      <RadioGroup value={effectiveKeep ?? ''} onChange={(e) => setKeep(e.target.value)}>
        {keepOptions(candidate).map((id, index) => (
          <FormControlLabel
            key={id}
            value={id}
            disabled={locked}
            control={<Radio />}
            label={formatMessageWithValues(index === 0 ? 'resolve.keepA' : 'resolve.keepB', { id })}
          />
        ))}
      </RadioGroup>
      <TextField
        fullWidth
        multiline
        minRows={2}
        margin="dense"
        label={formatMessage('resolve.note')}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      {[refusalSame, refusalDifferent].filter(Boolean).map((text) => (
        <Box mt={1} key={text}><Alert severity="warning">{text}</Alert></Box>
      ))}
      {error && <Box mt={1}><Alert severity="error">{error}</Alert></Box>}
      <Box mt={2} className={classes.row}>
        <Button variant="contained" color="primary" disabled={!canMerge} onClick={() => ask(DECISION_SAME)}>
          {formatMessage('resolve.same')}
        </Button>
        <Button
          variant="outlined"
          disabled={submitting || !pairState.canDismiss || checkBlocksDecision(checkDifferent)}
          onClick={() => ask(DECISION_DIFFERENT)}
        >
          {formatMessage('resolve.different')}
        </Button>
      </Box>
      {!pairState.canDismiss && (
        <Box mt={1}>
          <Typography variant="caption">{formatMessage('resolve.refusal.pair_already_merged')}</Typography>
        </Box>
      )}
    </StyledCard>
  );
}

export default ResolvePanel;
