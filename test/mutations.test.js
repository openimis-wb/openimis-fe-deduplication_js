import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mutationRejected } from '../src/util/mutations.js';

const SERVICE = 'resolveDuplicateCandidate';

test('a registered mutation is not rejected', () => {
  const action = { payload: { data: { [SERVICE]: { clientMutationId: 'c', internalId: 'i' } } } };
  assert.equal(mutationRejected(action, SERVICE), false);
});

test('GraphQL errors reject the mutation even when data is present', () => {
  const action = {
    payload: { errors: [{ message: 'User not authorized for this operation' }], data: { [SERVICE]: null } },
  };
  assert.equal(mutationRejected(action, SERVICE), true);
});

test('a null result of the service rejects the mutation', () => {
  assert.equal(mutationRejected({ payload: { data: { [SERVICE]: null } } }, SERVICE), true);
});

test('a response without data rejects the mutation', () => {
  assert.equal(mutationRejected({ payload: { data: null } }, SERVICE), true);
  assert.equal(mutationRejected({ payload: {} }, SERVICE), true);
  assert.equal(mutationRejected({}, SERVICE), true);
  assert.equal(mutationRejected(undefined, SERVICE), true);
});

test('the result of another service does not count', () => {
  const action = { payload: { data: { runDuplicateScan: { internalId: 'i' } } } };
  assert.equal(mutationRejected(action, SERVICE), true);
});

test('an empty error list does not reject a registered mutation', () => {
  const action = { payload: { errors: [], data: { [SERVICE]: { internalId: 'i' } } } };
  assert.equal(mutationRejected(action, SERVICE), false);
});
