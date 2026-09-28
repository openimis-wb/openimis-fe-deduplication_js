# openIMIS Frontend Deduplication module
This repository holds the files of the openIMIS Frontend Deduplication module.



It is dedicated to be bootstrap development of [openimis-fe_js](https://github.com/openimis/openimis-fe_js) modules, providing an empty (yet deployable) module.

Please refer to [openimis-fe_js](https://github.com/openimis/openimis-fe_js) to see how to build and and deploy (in developement or server mode).

## Duplicate review and biometric administration

| Screen | Route | Rights | Backend fields |
|---|---|---|---|
| Duplicate candidates | `deduplication/candidates` | 172005; 172004 runs a scan; 172001 creates review tasks | `duplicateCandidates`, `runDuplicateScan`, `createDuplicateReviewTasks` |
| Duplicate candidate | `deduplication/candidates/candidate/<uuid>` | 172005; 172003 resolves | `duplicateCandidates(id:)`, `resolveDuplicateCandidate`, `individual(id:)` |
| Biometric alerts | `deduplication/biometric/alerts` | 174005; 174006 acknowledges and resolves | `biometricAlerts` (impersonation evidence from `detail`), `acknowledgeBiometricAlert`, `resolveBiometricAlert` |
| Biometric audit log | `deduplication/biometric/audit` | 174005; 174008 with 174005 runs the chain verification | `biometricAuditEvents`, `biometricAuditChainStatus`, `verifyBiometricAuditChain` |
| Biometric decision criteria | `deduplication/biometric/criteria` | 174007 | `biometricDecisionCriteria` |
| Biometric retention and erasures | `deduplication/biometric/retention` | 174007 shows the policy; 174005 lists the erasures | `biometricRetentionPolicy`, `biometricErasures`, `biometricErasureFilterValues` (record type and author selects) |
| Biometric verifications | `deduplication/biometric/verifications` | 174004; 174003 shows the matched and ranked records of the impersonation check; 174007 adds the risk profile filter on decisions | `biometricVerificationRecords`, `biometricMultimodalDecisions`, `node` (a decision leg's verification), `biometricDecisionCriteria` (profile names) |
| Individual "Biometrics" tab | fe-individual `individual.TabPanel.*` | 174004 | `biometricTemplates` with `qualityVerdict` and its `measures` |

Tasks with source `deduplication_candidate` get a review form in the task screen. The decision is stored as the task's
additional data; completing the task resolves the candidate on the server.

Subject cards come from the `deduplication.SubjectCard` contribution, a list of `{ subjectModel, component }`. The
module contributes the card for `individual.Individual`; other subject models show their model name and id.

Configuration keys (`fe-deduplication`):

| Key | Default |
|---|---|
| `candidateKinds` | `["demographic", "identifier", "biometric"]` |
| `candidatesPageSize` | `10` |
| `rowsPerPageOptions` | `[10, 20, 50, 100]` |
| `biometricAdmin.enabled` | `true`; `false` removes the biometric screens and the individual tab |
| `alertRuleKinds` | `["FAILED_VERIFICATIONS", "IMPERSONATION_SUSPECTED", "ACCESS_BURST"]`; an empty list hides the rule filter |
| `rights.auditRead` | `[174005]` |
| `rights.alertTriage` | `[174006]` |
| `rights.configRead` | `[174007]` |
| `rights.auditVerify` | `[174008]` |

A deployment that stores its menus in the `fe-core.menus` configuration shows the new menu entries only once they are
added there.

`yarn test` runs the unit tests of the pure helpers in `src/util` with the Node test runner.

The module is built with [rollup](https://rollupjs.org/).
In development mode, you can use `yarn link` and `yarn start` to continuously scan for changes and automatically update your development server.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Total alerts](https://img.shields.io/lgtm/alerts/g/openimis/openimis-fe-deduplication_js.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/openimis/openimis-fe-deduplication_js/alerts/)
