import * as React from 'react';
import { useDispatch } from 'react-redux';
import { IconButton, Tooltip } from '@mui/material';
import {
  GetIconComponent,
  Searcher,
  useHistory,
  useModulesManager,
  useTranslations,
} from '@openimis/fe-core';
import { useIntl } from 'react-intl';
import { createDuplicateReviewTasks, fetchDuplicateCandidates } from '../../adminActions';
import {
  CANDIDATE_STATUS,
  MODULE_KEY,
  REF_ROUTE_CANDIDATE,
  RIGHT_DUPLICATE_REVIEW_TASKS,
} from '../../constants';
import { candidatesPageSize, rowsPerPageOptions } from '../../config';
import { candidateFilterFragment, scoreLabel } from '../../util/candidates';
import { hasRight, labelOr, toUuid } from '../../util/gql';
import { useAdminSlice } from '../common/adminHooks';
import DuplicateCandidateFilter from './DuplicateCandidateFilter';
import EvidenceSummary from './EvidenceSummary';

const VisibilityIcon = GetIconComponent('Visibility');

function DuplicateCandidateSearcher({ rights, defaultSubjectId = null }) {
  const dispatch = useDispatch();
  const history = useHistory();
  const intl = useIntl();
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues, formatDateTimeFromISO } = useTranslations(
    MODULE_KEY,
    modulesManager,
  );
  const slice = useAdminSlice('candidates');

  const fetch = (params) => dispatch(fetchDuplicateCandidates(params));

  const openCandidate = (candidate) => {
    const uuid = toUuid(candidate?.id);
    if (uuid) history.push(`/${modulesManager.getRef(REF_ROUTE_CANDIDATE)}/${uuid}`);
  };

  const headers = () => [
    'candidates.kind',
    'candidates.status',
    'candidates.score',
    'candidates.subjectA',
    'candidates.subjectB',
    'candidates.evidence',
    'candidates.source',
    'candidates.dateCreated',
    'candidates.reviewedBy',
    '',
  ];

  const sorts = () => [
    ['kind', true],
    ['status', true],
    ['score', false],
    null,
    null,
    null,
    null,
    ['dateCreated', false],
    null,
    null,
  ];

  const itemFormatters = () => [
    (c) => labelOr(intl.messages, `${MODULE_KEY}.candidate.kind.${c.kind}`, c.kind),
    (c) => formatMessage(`candidate.status.${c.status}`),
    (c) => scoreLabel(c),
    (c) => c.subjectA,
    (c) => c.subjectB,
    (c) => <EvidenceSummary candidate={c} />,
    (c) => c.source,
    (c) => formatDateTimeFromISO(c.dateCreated),
    (c) => c.reviewedBy || '',
    (c) => (
      <Tooltip title={formatMessage('candidates.open')}>
        <IconButton onClick={() => openCandidate(c)} size="small">
          <VisibilityIcon />
        </IconButton>
      </Tooltip>
    ),
  ];

  const defaultFilters = () => {
    const filters = {
      status: { value: CANDIDATE_STATUS.OPEN, filter: candidateFilterFragment('status', CANDIDATE_STATUS.OPEN) },
    };
    if (defaultSubjectId) {
      filters.subjectId = { value: defaultSubjectId, filter: candidateFilterFragment('subjectId', defaultSubjectId) };
    }
    return filters;
  };

  const createReviewTasks = (selection) => {
    const uuids = selection.map((c) => toUuid(c.id)).filter(Boolean);
    if (!uuids.length) return;
    dispatch(createDuplicateReviewTasks(
      uuids,
      formatMessageWithValues('candidates.mutation.createReviewTasks', { count: uuids.length }),
    ));
  };

  const canCreateTasks = hasRight(rights, RIGHT_DUPLICATE_REVIEW_TASKS);
  const actions = canCreateTasks
    ? [{
      label: `${MODULE_KEY}.candidates.action.createReviewTasks`,
      action: createReviewTasks,
      enabled: (selection) => selection.length > 0,
    }]
    : [];

  return (
    <Searcher
      module={MODULE_KEY}
      cacheFiltersKey={defaultSubjectId ? null : 'deduplicationCandidatesSearcher'}
      FilterPane={DuplicateCandidateFilter}
      fetch={fetch}
      items={slice?.items ?? []}
      itemsPageInfo={slice?.pageInfo}
      fetchedItems={slice?.fetched}
      fetchingItems={slice?.fetching}
      errorItems={slice?.error}
      tableTitle={formatMessageWithValues('candidates.searcherTitle', { count: slice?.totalCount ?? 0 })}
      headers={headers}
      itemFormatters={itemFormatters}
      sorts={sorts}
      rowsPerPageOptions={rowsPerPageOptions(modulesManager)}
      defaultPageSize={candidatesPageSize(modulesManager)}
      defaultOrderBy="-dateCreated"
      defaultFilters={defaultFilters()}
      rowIdentifier={(c) => c.id}
      onDoubleClick={openCandidate}
      withSelection={canCreateTasks ? 'multiple' : null}
      selectionMessage={canCreateTasks ? 'candidates.selection' : null}
      actions={actions}
    />
  );
}

export default DuplicateCandidateSearcher;
