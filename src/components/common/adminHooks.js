import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { journalize } from '@openimis/fe-core';
import { awaitMutationLog } from '../../adminActions';
import { ADMIN_STORE_KEY } from '../../constants';

const EMPTY_RIGHTS = [];

export function useUserRights() {
  return useSelector((state) => state.core?.user?.i_user?.rights ?? EMPTY_RIGHTS);
}

export function useAdminSlice(slice) {
  return useSelector((state) => state[ADMIN_STORE_KEY]?.[slice]);
}

// Journalizes the admin mutations of the given action types when their request
// completes, waits for the asynchronous mutation to leave the pending state,
// then calls onSettled(log, mutation). log.status: 1 failed, 2 succeeded;
// log is null when the log could not be read in time.
export function useMutationSettled(actionTypes, onSettled) {
  const dispatch = useDispatch();
  const submittingMutation = useSelector((state) => state[ADMIN_STORE_KEY]?.submittingMutation);
  const mutation = useSelector((state) => state[ADMIN_STORE_KEY]?.mutation);
  const previous = React.useRef(submittingMutation);
  const callback = React.useRef(onSettled);
  callback.current = onSettled;
  const types = actionTypes.join('|');

  React.useEffect(() => {
    const wasSubmitting = previous.current;
    previous.current = submittingMutation;
    if (!wasSubmitting || submittingMutation) return;
    if (!mutation || !types.split('|').includes(mutation.actionType)) return;
    if (mutation.requestFailed) {
      callback.current?.({ status: 1, error: null }, mutation);
      return;
    }
    dispatch(journalize(mutation));
    dispatch(awaitMutationLog(mutation.clientMutationId)).then((log) => callback.current?.(log, mutation));
  }, [submittingMutation, mutation, types, dispatch]);
}
