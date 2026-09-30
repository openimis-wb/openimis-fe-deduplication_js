import * as React from 'react';
import { useSelector } from 'react-redux';
import { Fab, Paper } from '@mui/material';
import { GetIconComponent, useModulesManager, useTranslations } from '@openimis/fe-core';
import {
  ADMIN_STORE_KEY, MODULE_KEY, TASK_APPROVED, TASK_FAILED,
} from '../../constants';
import { canApproveTask, canRejectTask } from '../../util/taskResolveData';

const CheckIcon = GetIconComponent('Check');
const ClearIcon = GetIconComponent('Clear');

// Approve and reject buttons of a duplicate-candidate task, in place of the stock
// ones: those stay disabled for an approver already in the task's business status,
// which is the case after a completion the server refused. `defaultAction` opens the
// stock confirmation and sends the resolve with the form's decision. Both buttons
// stay disabled while the task form is in no-right mode.
function DuplicateCandidateTaskConfirmation({ defaultAction }) {
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(MODULE_KEY, modulesManager);
  const taskStatus = useSelector((state) => state.tasksManagement?.task?.status ?? null);
  const submitting = useSelector((state) => !!state.tasksManagement?.submittingMutation);
  const gate = useSelector((state) => state[ADMIN_STORE_KEY]?.taskFormGate);
  const approveEnabled = canApproveTask(taskStatus, submitting, gate);
  const rejectEnabled = canRejectTask(taskStatus, submitting, gate);

  return (
    <Paper sx={(theme) => ({ ...(theme.paper?.paper ?? {}), display: 'flex', justifyContent: 'center' })}>
      <Fab
        color="primary"
        sx={{ m: 1 }}
        disabled={!approveEnabled}
        aria-label={formatMessage('tasks.candidate.approve')}
        title={formatMessage('tasks.candidate.approve')}
        onClick={() => defaultAction(TASK_APPROVED)}
      >
        <CheckIcon />
      </Fab>
      <Fab
        color="primary"
        sx={{ m: 1 }}
        disabled={!rejectEnabled}
        aria-label={formatMessage('tasks.candidate.reject')}
        title={formatMessage('tasks.candidate.reject')}
        onClick={() => defaultAction(TASK_FAILED)}
      >
        <ClearIcon />
      </Fab>
    </Paper>
  );
}

export default DuplicateCandidateTaskConfirmation;
