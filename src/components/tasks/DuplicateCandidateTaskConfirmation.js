import * as React from 'react';
import { useSelector } from 'react-redux';
import { Fab, Paper, makeStyles } from '@material-ui/core';
import CheckIcon from '@material-ui/icons/Check';
import ClearIcon from '@material-ui/icons/Clear';
import { useModulesManager, useTranslations } from '@openimis/fe-core';
import {
  ADMIN_STORE_KEY, MODULE_KEY, TASK_APPROVED, TASK_FAILED,
} from '../../constants';
import { canApproveTask, canRejectTask } from '../../util/taskResolveData';

const useStyles = makeStyles((theme) => ({
  paper: theme.paper.paper,
  fabContainer: { display: 'flex', justifyContent: 'center' },
  fab: { margin: theme.spacing(1) },
}));

// Approve and reject buttons of a duplicate-candidate task, in place of the stock
// ones: those stay disabled for an approver already in the task's business status,
// which is the case after a completion the server refused. `defaultAction` opens the
// stock confirmation and sends the resolve with the form's decision. Both buttons
// stay disabled while the task form is in no-right mode.
function DuplicateCandidateTaskConfirmation({ defaultAction }) {
  const classes = useStyles();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(MODULE_KEY, modulesManager);
  const taskStatus = useSelector((state) => state.tasksManagement?.task?.status ?? null);
  const submitting = useSelector((state) => !!state.tasksManagement?.submittingMutation);
  const gate = useSelector((state) => state[ADMIN_STORE_KEY]?.taskFormGate);
  const approveEnabled = canApproveTask(taskStatus, submitting, gate);
  const rejectEnabled = canRejectTask(taskStatus, submitting, gate);

  return (
    <Paper className={classes.paper}>
      <div className={classes.fabContainer}>
        <div className={classes.fab}>
          <Fab
            color="primary"
            disabled={!approveEnabled}
            aria-label={formatMessage('tasks.candidate.approve')}
            title={formatMessage('tasks.candidate.approve')}
            onClick={() => defaultAction(TASK_APPROVED)}
          >
            <CheckIcon />
          </Fab>
        </div>
        <div className={classes.fab}>
          <Fab
            color="primary"
            disabled={!rejectEnabled}
            aria-label={formatMessage('tasks.candidate.reject')}
            title={formatMessage('tasks.candidate.reject')}
            onClick={() => defaultAction(TASK_FAILED)}
          >
            <ClearIcon />
          </Fab>
        </div>
      </div>
    </Paper>
  );
}

export default DuplicateCandidateTaskConfirmation;
