import * as React from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { useModulesManager, useTranslations } from '@openimis/fe-core';
import { MODULE_KEY } from '../../constants';

// Collects the resolution note; onSubmit(note) returns the server error text or null.
function ResolveAlertDialog({ alert, onClose, onSubmit }) {
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(MODULE_KEY, modulesManager);
  const [note, setNote] = React.useState('');
  const [error, setError] = React.useState(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    setNote('');
    setError(null);
    setSubmitting(false);
  }, [alert?.id]);

  const submit = async () => {
    setSubmitting(true);
    const failure = await onSubmit(note);
    setSubmitting(false);
    if (failure) setError(failure);
    else onClose();
  };

  return (
    <Dialog open={!!alert} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{formatMessage('biometric.alert.resolve.title')}</DialogTitle>
      <DialogContent>
        {alert && <Typography variant="body2" gutterBottom>{alert.title}</Typography>}
        <TextField
          fullWidth
          multiline
          minRows={3}
          margin="dense"
          label={formatMessage('biometric.alert.resolve.note')}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        {error && <Box mt={1}><Alert severity="error">{error}</Alert></Box>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{formatMessage('common.cancel')}</Button>
        <Button variant="contained" color="primary" disabled={submitting} onClick={submit}>
          {formatMessage('biometric.alert.resolve.submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ResolveAlertDialog;
