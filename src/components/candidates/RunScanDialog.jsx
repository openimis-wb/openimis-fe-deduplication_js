import * as React from 'react';
import { useDispatch } from 'react-redux';
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  Typography,
} from '@mui/material';
import { useModulesManager, useTranslations } from '@openimis/fe-core';
import { useIntl } from 'react-intl';
import { runDuplicateScan } from '../../adminActions';
import { MODULE_KEY } from '../../constants';
import { candidateKinds } from '../../config';
import { labelOr } from '../../util/gql';

// Starts runDuplicateScan for the chosen kinds; none chosen scans every source.
// The outcome is reported by the mutation journal.
function RunScanDialog({ open, onClose }) {
  const dispatch = useDispatch();
  const intl = useIntl();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(MODULE_KEY, modulesManager);
  const kinds = candidateKinds(modulesManager);
  const [selected, setSelected] = React.useState([]);

  React.useEffect(() => {
    if (open) setSelected([]);
  }, [open]);

  const toggle = (kind) => setSelected((current) => (
    current.includes(kind) ? current.filter((k) => k !== kind) : [...current, kind]
  ));

  const confirm = () => {
    dispatch(runDuplicateScan(selected, formatMessage('scan.mutationLabel')));
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{formatMessage('scan.title')}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" gutterBottom>{formatMessage('scan.explanation')}</Typography>
        <FormGroup>
          {kinds.map((kind) => (
            <FormControlLabel
              key={kind}
              control={<Checkbox checked={selected.includes(kind)} onChange={() => toggle(kind)} />}
              label={labelOr(intl.messages, `${MODULE_KEY}.candidate.kind.${kind}`, kind)}
            />
          ))}
        </FormGroup>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{formatMessage('common.cancel')}</Button>
        <Button variant="contained" color="primary" onClick={confirm}>
          {formatMessage(selected.length ? 'scan.confirmSelected' : 'scan.confirmAll')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default RunScanDialog;
