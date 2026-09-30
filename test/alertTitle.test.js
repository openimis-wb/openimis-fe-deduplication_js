import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { alertTitleMessage } from '../src/util/biometric.js';

const read = (name) => JSON.parse(readFileSync(new URL(`../src/translations/${name}`, import.meta.url), 'utf8'));
const en = read('en.json');
const fr = read('fr.json');

// Details as biometric/audit_rules.py writes them.
const failed = {
  ruleKind: 'FAILED_VERIFICATIONS',
  title: '3 failed biometric verifications within 60 minutes',
  detail: JSON.stringify({ attempts: 4, threshold: 3, window_minutes: 60, modality: null }),
};
const burst = {
  ruleKind: 'ACCESS_BURST',
  title: '25 biometric reads by one account within 10 minutes',
  detail: { actor: 'agent', events: 25, max_events: 20, window_minutes: 10 },
};
const impersonation = {
  ruleKind: 'IMPERSONATION_SUSPECTED',
  title: 'Possible impersonation on a face verification',
  detail: JSON.stringify({ modality: 'face', matched_score: 0.9 }),
};

test('alertTitleMessage builds the label of each rule from its detail', () => {
  assert.deepEqual(alertTitleMessage(failed), {
    key: 'biometric.alert.label.FAILED_VERIFICATIONS', values: { count: 4, minutes: 60 },
  });
  assert.deepEqual(alertTitleMessage(burst), {
    key: 'biometric.alert.label.ACCESS_BURST', values: { count: 25, minutes: 10 },
  });
  assert.deepEqual(alertTitleMessage(impersonation), {
    key: 'biometric.alert.label.IMPERSONATION_SUSPECTED', values: { modality: 'face' },
  });
});

test('alertTitleMessage returns null for an unknown rule or missing parameters', () => {
  assert.equal(alertTitleMessage({ ruleKind: 'SOMETHING_NEW', detail: '{}' }), null);
  assert.equal(alertTitleMessage({ ...failed, detail: JSON.stringify({ attempts: 4 }) }), null);
  assert.equal(alertTitleMessage({ ...burst, detail: { events: '25', window_minutes: 10 } }), null);
  assert.equal(alertTitleMessage({ ...impersonation, detail: JSON.stringify({ modality: '' }) }), null);
  assert.equal(alertTitleMessage({ ...failed, detail: 'not json' }), null);
  assert.equal(alertTitleMessage(null), null);
});

test('every rule label exists in English and French with its placeholders', () => {
  const placeholders = {
    FAILED_VERIFICATIONS: ['{count}', '{minutes}'],
    ACCESS_BURST: ['{count}', '{minutes}'],
    IMPERSONATION_SUSPECTED: ['{modality}'],
  };
  Object.entries(placeholders).forEach(([rule, names]) => {
    const key = `deduplication.biometric.alert.label.${rule}`;
    [en, fr].forEach((messages) => {
      assert.ok(messages[key], key);
      names.forEach((name) => assert.ok(messages[key].includes(name), `${key} ${name}`));
    });
  });
});
