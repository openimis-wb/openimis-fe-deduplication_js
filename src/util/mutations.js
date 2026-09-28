// Pure helpers for the admin mutation responses. No imports.

// True when the response of `service` carries no registered mutation: the
// server answered with GraphQL errors, or without the service's result.
// fe-core's dispatchMutationResp reads data[service].internalId and throws then.
// eslint-disable-next-line import/prefer-default-export
export function mutationRejected(action, service) {
  const payload = action?.payload;
  if (Array.isArray(payload?.errors) && payload.errors.length) return true;
  const result = payload?.data?.[service];
  return result === null || result === undefined;
}
