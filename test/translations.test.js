import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (name) => JSON.parse(readFileSync(new URL(`../src/translations/${name}`, import.meta.url), 'utf8'));
const en = read('en.json');
const fr = read('fr.json');

const PRE_EXISTING_EN = {
  'deduplication.deduplicate': 'Deduplicate',
  'deduplication.deduplicate.title': 'Deduplication - {benefitPlanName}',
  'deduplication.deduplicate.button.cancel': 'Cancel',
  'deduplication.deduplicate.fields': 'Duplicate Detection Field Selection',
  'deduplication.deduplicate.fields.placeholder': 'Duplicate Detection Field Selection',
  'deduplication.deduplicate.button.showDuplicateSummary': 'Show Duplicate Summary',
  'deduplication.deduplicate.summary.title': 'Deduplication Summary',
  'deduplication.deduplicate.button.createDeduplicationReviewTask': 'Create Deduplication Review Tasks',
  'deduplication.deduplicationSummaryTable.group': 'Group',
  'deduplication.deduplicationSummaryTable.duplicates': 'Duplicates',
  'deduplication.tasks.deduplication.title': 'Benefit Plan Deduplication Task',
  'deduplication.deduplicate.mutation.createTasks': 'Deduplication tasks have been created.',
  'deduplication.BeneficiaryDuplicatesTable.checkbox.header': 'Select all columns',
  'deduplication.BeneficiaryDuplicatesTable.merge.header': "Don't merge",
  'deduplication.BeneficiaryDuplicatesTable.output': 'OUTPUT:',
  'deduplication.BeneficiaryDuplicatesTable.oldest': 'Oldest',
  'deduplication.gql_create_deduplication_review_perms': 'Deduplication | Create Deduplication Review',
  'deduplication.gql_create_deduplication_payment_review_perms': 'Deduplication | Create Deduplication Payment Review',
};

test('pre-existing English messages keep their values', () => {
  Object.entries(PRE_EXISTING_EN).forEach(([key, value]) => assert.equal(en[key], value, key));
});

test('every French key exists in English', () => {
  Object.keys(fr).forEach((key) => assert.ok(key in en, key));
});

test('every new English key has a French translation', () => {
  Object.keys(en)
    .filter((key) => !(key in PRE_EXISTING_EN))
    .forEach((key) => assert.ok(key in fr, key));
});

test('no message is empty', () => {
  [en, fr].forEach((messages) => Object.entries(messages).forEach(([key, value]) => {
    assert.equal(typeof value, 'string', key);
    assert.notEqual(value.trim(), '', key);
  }));
});

test('French messages keep « enrôlement » and « enregistrement » out of these screens', () => {
  Object.entries(fr).forEach(([key, value]) => {
    assert.doesNotMatch(value, /enr[ôo]l/i, key);
    assert.doesNotMatch(value, /enregistr/i, key);
  });
});
