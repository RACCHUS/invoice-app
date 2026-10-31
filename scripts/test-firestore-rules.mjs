// Checks firestore.rules with the Firebase Rules API (nothing is deployed and no data is touched).
// Requires the Firebase CLI to be logged in: npx firebase login
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const projectId = JSON.parse(readFileSync('.firebaserc', 'utf8')).projects.default;
const source = readFileSync(process.argv[2] || 'firestore.rules', 'utf8');

// Any authenticated CLI command refreshes the stored access token.
execSync('npx --no-install firebase projects:list --json', { stdio: 'ignore', shell: true });
const configPath = process.env.XDG_CONFIG_HOME
  ? join(process.env.XDG_CONFIG_HOME, 'configstore', 'firebase-tools.json')
  : join(homedir(), '.config', 'configstore', 'firebase-tools.json');
const token = JSON.parse(readFileSync(configPath, 'utf8')).tokens?.access_token;
if (!token) throw new Error('Firebase CLI is not logged in. Run: npx firebase login');

const owner = 'owner-uid';
const other = 'other-uid';
const path = (collection, id = 'doc1') => `/databases/(default)/documents/${collection}/${id}`;
const cases = [];
const add = (name, expectation, request, resource) => cases.push({ name, testCase: { expectation, request, resource } });

for (const collection of ['invoices', 'clients', 'items']) {
  const mine = { data: { userId: owner, name: 'x' } };
  const theirs = { data: { userId: other, name: 'x' } };
  const p = path(collection);
  add(`${collection}: owner can read`, 'ALLOW', { auth: { uid: owner }, path: p, method: 'get' }, mine);
  add(`${collection}: owner can list`, 'ALLOW', { auth: { uid: owner }, path: p, method: 'list' }, mine);
  add(`${collection}: owner can create`, 'ALLOW', { auth: { uid: owner }, path: p, method: 'create', resource: mine });
  add(`${collection}: owner can update`, 'ALLOW', { auth: { uid: owner }, path: p, method: 'update', resource: mine }, mine);
  add(`${collection}: owner can delete`, 'ALLOW', { auth: { uid: owner }, path: p, method: 'delete' }, mine);
  add(`${collection}: other user cannot read`, 'DENY', { auth: { uid: other }, path: p, method: 'get' }, mine);
  add(`${collection}: other user cannot delete`, 'DENY', { auth: { uid: other }, path: p, method: 'delete' }, mine);
  add(`${collection}: other user cannot take over by update`, 'DENY',
    { auth: { uid: owner }, path: p, method: 'update', resource: mine }, theirs);
  add(`${collection}: owner cannot give a document away`, 'DENY',
    { auth: { uid: owner }, path: p, method: 'update', resource: theirs }, mine);
  add(`${collection}: cannot create for another user`, 'DENY', { auth: { uid: owner }, path: p, method: 'create', resource: theirs });
  add(`${collection}: signed-out cannot read`, 'DENY', { path: p, method: 'get' }, mine);
  add(`${collection}: signed-out cannot delete`, 'DENY', { path: p, method: 'delete' }, mine);
}
add('unknown collections are denied', 'DENY',
  { auth: { uid: owner }, path: path('secrets'), method: 'create', resource: { data: { userId: owner } } });

const response = await fetch(`https://firebaserules.googleapis.com/v1/projects/${projectId}:test`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    source: { files: [{ name: 'firestore.rules', content: source }] },
    testSuite: { testCases: cases.map(c => c.testCase) }
  })
});
const result = await response.json();
if (!response.ok) throw new Error(`Rules API error: ${JSON.stringify(result.error || result)}`);
const issues = (result.issues || []).filter(issue => issue.severity === 'ERROR');
if (issues.length) throw new Error(`Rules do not compile: ${JSON.stringify(issues)}`);

let failed = 0;
result.testResults.forEach((testResult, i) => {
  const ok = testResult.state === 'SUCCESS';
  if (!ok) failed++;
  console.log(`${ok ? 'ok' : 'FAIL'} - ${cases[i].name}${ok ? '' : ` ${JSON.stringify(testResult.debugMessages || [])}`}`);
});
console.log(`\n${cases.length - failed}/${cases.length} rule checks passed`);
process.exit(failed ? 1 : 0);
