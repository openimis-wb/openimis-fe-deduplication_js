import * as React from 'react';
import { Typography } from '@mui/material';
import { useIntl } from 'react-intl';
import { MODULE_KEY } from '../../constants';
import { evidenceRows } from '../../util/candidates';
import { labelOr } from '../../util/gql';

const MAX_LENGTH = 80;

// One line of "label: value" pairs from the candidate evidence.
function EvidenceSummary({ candidate }) {
  const intl = useIntl();
  const text = evidenceRows(candidate)
    .map(([key, value]) => `${labelOr(intl.messages, `${MODULE_KEY}.candidate.evidence.${key}`, key)}: ${value}`)
    .join(' · ');
  const shown = text.length > MAX_LENGTH ? `${text.slice(0, MAX_LENGTH - 1)}…` : text;
  return (
    <Typography variant="body2" title={text}>
      {shown}
    </Typography>
  );
}

export default EvidenceSummary;
