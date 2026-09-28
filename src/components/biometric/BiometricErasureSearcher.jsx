import * as React from 'react';
import { useDispatch } from 'react-redux';
import { Searcher, useModulesManager, useTranslations } from '@openimis/fe-core';
import { useIntl } from 'react-intl';
import { fetchBiometricErasures } from '../../adminActions';
import { MODULE_KEY } from '../../constants';
import { rowsPerPageOptions } from '../../config';
import { erasedCounts } from '../../util/biometric';
import { labelOr } from '../../util/gql';
import { useAdminSlice } from '../common/adminHooks';
import BiometricErasureFilter, { erasureReasonLabel } from './BiometricErasureFilter';

// Tombstones left when a subject's templates were erased: who, when, why and
// how many rows per modality. They hold no biometric material.
function BiometricErasureSearcher() {
  const dispatch = useDispatch();
  const intl = useIntl();
  const modulesManager = useModulesManager();
  const { formatMessageWithValues, formatDateTimeFromISO } = useTranslations(MODULE_KEY, modulesManager);
  const slice = useAdminSlice('biometricErasures');

  const fetch = (params) => dispatch(fetchBiometricErasures(params));
  const modalityLabel = (modality) => labelOr(intl.messages, `${MODULE_KEY}.biometric.modality.${modality}`, modality);

  const itemFormatters = () => [
    (e) => formatDateTimeFromISO(e.erasedAt),
    (e) => (e.subjectId ? `${e.subjectModel} ${e.subjectId}` : '—'),
    (e) => erasureReasonLabel(intl.messages, e.reason),
    (e) => {
      const counts = erasedCounts(e);
      if (counts.length) return counts.map((c) => `${modalityLabel(c.modality)} ${c.count}`).join(' ; ');
      return (e.modalities ?? []).map(modalityLabel).join(', ') || '—';
    },
    (e) => e.erasedBy,
  ];

  return (
    <Searcher
      module={MODULE_KEY}
      cacheFiltersKey="deduplicationBiometricErasureSearcher"
      FilterPane={BiometricErasureFilter}
      fetch={fetch}
      items={slice?.items ?? []}
      itemsPageInfo={slice?.pageInfo}
      fetchedItems={slice?.fetched}
      fetchingItems={slice?.fetching}
      errorItems={slice?.error}
      tableTitle={formatMessageWithValues('biometric.erasure.searcherTitle', { count: slice?.totalCount ?? 0 })}
      headers={() => [
        'biometric.erasure.erasedAt',
        'biometric.erasure.subject',
        'biometric.erasure.reason',
        'biometric.erasure.erased',
        'biometric.erasure.erasedBy',
      ]}
      itemFormatters={itemFormatters}
      sorts={() => [['erasedAt', false], ['subjectId', true], ['reason', true], null, ['erasedBy', true]]}
      rowsPerPageOptions={rowsPerPageOptions(modulesManager)}
      defaultPageSize={rowsPerPageOptions(modulesManager)[0]}
      defaultOrderBy="-erasedAt"
      rowIdentifier={(e) => e.id}
    />
  );
}

export default BiometricErasureSearcher;
