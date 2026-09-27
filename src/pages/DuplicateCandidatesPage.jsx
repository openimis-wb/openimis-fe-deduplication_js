import * as React from 'react';
import { Box, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Helmet, useLocation, useModulesManager, useTranslations,
} from '@openimis/fe-core';
import { ADMIN_ACTION_TYPE } from '../adminReducer';
import { MODULE_KEY, RIGHT_DUPLICATE_SCAN, RIGHT_DUPLICATE_SEARCH } from '../constants';
import { hasRight } from '../util/gql';
import { useMutationSettled, useUserRights } from '../components/common/adminHooks';
import DuplicateCandidateSearcher from '../components/candidates/DuplicateCandidateSearcher';
import RunScanDialog from '../components/candidates/RunScanDialog';

const StyledPage = styled('div')(({ theme }) => ({
  ...(theme.page ?? {}),
}));

function DuplicateCandidatesPage() {
  const modulesManager = useModulesManager();
  const rights = useUserRights();
  const { formatMessage } = useTranslations(MODULE_KEY, modulesManager);
  const [scanOpen, setScanOpen] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const location = useLocation();
  const subjectId = new URLSearchParams(location?.search ?? '').get('subjectId') || null;

  useMutationSettled(
    [ADMIN_ACTION_TYPE.RUN_SCAN, ADMIN_ACTION_TYPE.CREATE_REVIEW_TASKS],
    () => setRefreshKey((key) => key + 1),
  );

  if (!hasRight(rights, RIGHT_DUPLICATE_SEARCH)) return null;

  return (
    <StyledPage>
      <Helmet title={formatMessage('candidates.helmet')} />
      {hasRight(rights, RIGHT_DUPLICATE_SCAN) && (
        <Box display="flex" justifyContent="flex-end" pb={1}>
          <Button variant="contained" color="primary" onClick={() => setScanOpen(true)}>
            {formatMessage('scan.button')}
          </Button>
        </Box>
      )}
      <DuplicateCandidateSearcher key={`${subjectId}-${refreshKey}`} rights={rights} defaultSubjectId={subjectId} />
      <RunScanDialog open={scanOpen} onClose={() => setScanOpen(false)} />
    </StyledPage>
  );
}

export default DuplicateCandidatesPage;
