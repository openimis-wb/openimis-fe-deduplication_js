import * as React from 'react';
import { useDispatch } from 'react-redux';
import { graphqlWithVariables } from '@openimis/fe-core';
import { RESOLVE_CHECK_QUERY } from './queries';
import { resolveCheckState, resolveCheckVariables } from './util/resolveCheck';

const PERMISSION_MESSAGE = /unauthori[sz]ed|permission/i;

export function isPermissionError(errors) {
  return Array.isArray(errors) && errors.some((error) => PERMISSION_MESSAGE.test(String(error?.message ?? error)));
}

// A variable-based query that keeps the GraphQL `errors` of a 200 response, so
// callers can tell a refusal apart from an empty result. With `skip` set the
// query runs only when `refetch` is called. `resolvedFor` is the serialised
// variables the current result was fetched for.
export function useGqlQuery(operation, variables, { skip = false } = {}) {
  const dispatch = useDispatch();
  const [state, setState] = React.useState({
    isLoading: !skip, data: null, errors: null, resolvedFor: null,
  });
  const variablesKey = JSON.stringify(variables ?? {});
  const latest = React.useRef(0);

  const refetch = React.useCallback(async () => {
    latest.current += 1;
    const call = latest.current;
    setState((previous) => ({ ...previous, isLoading: true }));
    const response = await dispatch(graphqlWithVariables(operation, JSON.parse(variablesKey)));
    if (call !== latest.current) return;
    const payload = response?.payload;
    const errors = payload?.errors || payload?.response?.errors
      || (response?.error ? [{ message: payload?.message || 'error' }] : null);
    setState({
      isLoading: false,
      data: payload?.data ?? null,
      errors: errors?.length ? errors : null,
      resolvedFor: variablesKey,
    });
  }, [dispatch, operation, variablesKey]);

  React.useEffect(() => {
    if (!skip) refetch();
  }, [refetch, skip]);

  return { ...state, refetch };
}

// The server's verdict on a decision (see resolveCheckState), asked again whenever the
// candidate, the decision or the record to keep changes. Nothing is asked while `active`
// is false or the decision is incomplete.
export function useResolveCheck({
  candidateId, decision, keep, subjectA, subjectB, active = true,
}) {
  const variables = active
    ? resolveCheckVariables({
      candidateId, decision, keep, subjectA, subjectB,
    })
    : null;
  const {
    isLoading, data, errors, resolvedFor,
  } = useGqlQuery(RESOLVE_CHECK_QUERY, variables ?? {}, { skip: !variables });
  return resolveCheckState({
    variables, resolvedFor, isLoading, data, errors, permissionRefused: isPermissionError(errors),
  });
}
