import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { AUDIT_ACTIONS, MODULE_KEY } from '../src/constants.js';

const read = (name) => JSON.parse(readFileSync(new URL(`../src/translations/${name}`, import.meta.url), 'utf8'));
const en = read('en.json');
const fr = read('fr.json');

// The ACTION_* constants of biometric/audit_chain.py (openimis-be-biometric-verification_py).
const SERVER_ACTIONS = [
  'template.enrol',
  'template.enrol_refused',
  'verify',
  'verify.multimodal',
  'identify',
  'impersonation.suspected',
  'template.consolidate',
  'template.purge',
  'template.read',
  'template.list',
  'alert.acknowledge',
  'alert.resolve',
];

test('the audit action filter offers every action the server records', () => {
  assert.deepEqual([...AUDIT_ACTIONS].sort(), [...SERVER_ACTIONS].sort());
});

test('every audit action has an English and a French label', () => {
  AUDIT_ACTIONS.forEach((action) => {
    const key = `${MODULE_KEY}.biometric.audit.action.${action}`;
    assert.ok(en[key], `en ${key}`);
    assert.ok(fr[key], `fr ${key}`);
  });
});
