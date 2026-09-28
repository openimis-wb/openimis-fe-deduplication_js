import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ADMIN_PAGE, adminRouteSpecs, canOpenPage, numericRights,
} from '../src/util/adminRoutes.js';

const byPage = (specs) => Object.fromEntries(specs.pages.map((spec) => [spec.page, spec]));
const BIOMETRIC_PAGES = [
  ADMIN_PAGE.BIOMETRIC_ALERTS,
  ADMIN_PAGE.BIOMETRIC_AUDIT,
  ADMIN_PAGE.BIOMETRIC_CRITERIA,
  ADMIN_PAGE.BIOMETRIC_RETENTION,
  ADMIN_PAGE.BIOMETRIC_VERIFICATIONS,
];

test('every route requires a non-empty list of numeric rights', () => {
  [undefined, {}, { 'rights.auditRead': ['174005', 'x'] }].forEach((cfg) => {
    adminRouteSpecs(cfg).pages.forEach((spec) => {
      assert.ok(Array.isArray(spec.requiredRights), spec.page);
      assert.ok(spec.requiredRights.length > 0, spec.page);
      spec.requiredRights.forEach((right) => assert.equal(typeof right, 'number', spec.page));
    });
  });
});

test('default configuration: the seven pages with their rights and paths', () => {
  const specs = adminRouteSpecs(undefined);
  assert.equal(specs.biometricEnabled, true);
  const pages = byPage(specs);
  assert.deepEqual(Object.keys(pages).sort(), Object.values(ADMIN_PAGE).sort());
  assert.deepEqual(pages.candidates.requiredRights, [172005]);
  assert.equal(pages.candidates.path, 'deduplication/candidates');
  assert.deepEqual(pages.candidate.requiredRights, [172005]);
  assert.equal(pages.candidate.path, 'deduplication/candidates/candidate/:candidate_id');
  assert.deepEqual(pages.biometricAlerts.requiredRights, [174005]);
  assert.equal(pages.biometricAlerts.path, 'deduplication/biometric/alerts');
  assert.deepEqual(pages.biometricAudit.requiredRights, [174005]);
  assert.equal(pages.biometricAudit.path, 'deduplication/biometric/audit');
  assert.deepEqual(pages.biometricCriteria.requiredRights, [174007]);
  assert.equal(pages.biometricCriteria.path, 'deduplication/biometric/criteria');
  assert.deepEqual(pages.biometricRetention.requiredRights, [174007, 174005]);
  assert.equal(pages.biometricRetention.path, 'deduplication/biometric/retention');
  assert.deepEqual(pages.biometricVerifications.requiredRights, [174004]);
  assert.equal(pages.biometricVerifications.path, 'deduplication/biometric/verifications');
});

test('biometricAdmin.enabled false keeps the duplicate pages only', () => {
  const specs = adminRouteSpecs({ 'biometricAdmin.enabled': false });
  assert.equal(specs.biometricEnabled, false);
  assert.deepEqual(specs.pages.map((spec) => spec.page), [ADMIN_PAGE.CANDIDATES, ADMIN_PAGE.CANDIDATE]);
});

test('only false disables the biometric pages', () => {
  [true, 'false', 0, null].forEach((value) => {
    const pages = byPage(adminRouteSpecs({ 'biometricAdmin.enabled': value }));
    BIOMETRIC_PAGES.forEach((page) => assert.ok(page in pages, `${value} ${page}`));
  });
});

test('configured rights are normalised to numbers and replace the defaults', () => {
  const pages = byPage(adminRouteSpecs({
    'rights.auditRead': ['900001', 900002, 'not-a-right'],
    'rights.configRead': [900003],
  }));
  assert.deepEqual(pages.biometricAlerts.requiredRights, [900001, 900002]);
  assert.deepEqual(pages.biometricAudit.requiredRights, [900001, 900002]);
  assert.deepEqual(pages.biometricCriteria.requiredRights, [900003]);
  assert.deepEqual(pages.biometricRetention.requiredRights, [900003, 900001, 900002]);
});

test('an empty or invalid rights configuration falls back to the defaults', () => {
  assert.deepEqual(numericRights([], [174005]), [174005]);
  assert.deepEqual(numericRights('174005', [174005]), [174005]);
  assert.deepEqual(numericRights(undefined, [174007]), [174007]);
});

test('menu entries: one per listed page, stable ids, message ids and v4 icon names', () => {
  const menus = adminRouteSpecs(undefined).pages.filter((spec) => spec.menu).map((spec) => spec.menu);
  assert.deepEqual(menus, [
    { id: 'deduplication.candidates', text: 'menu.candidates', icon: 'FileCopy' },
    { id: 'deduplication.biometricAlerts', text: 'menu.biometricAlerts', icon: 'NotificationsActive' },
    { id: 'deduplication.biometricAudit', text: 'menu.biometricAudit', icon: 'Receipt' },
    { id: 'deduplication.biometricCriteria', text: 'menu.biometricCriteria', icon: 'Gavel' },
    { id: 'deduplication.biometricRetention', text: 'menu.biometricRetention', icon: 'DeleteSweep' },
    { id: 'deduplication.biometricVerifications', text: 'menu.biometricVerifications', icon: 'Fingerprint' },
  ]);
  assert.equal(byPage(adminRouteSpecs(undefined)).candidate.menu, null);
});

test('canOpenPage matches numeric rights exactly', () => {
  assert.equal(canOpenPage([172005], [172005]), true);
  assert.equal(canOpenPage(['172005'], [172005]), false);
  assert.equal(canOpenPage([174005], [174007, 174005]), true);
  assert.equal(canOpenPage([], [172005]), false);
  assert.equal(canOpenPage(undefined, [172005]), false);
});
