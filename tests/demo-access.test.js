import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemo } from '../src/data.js';
import { DEMO_USERS, DEFAULT_TEAMS, workspaceUsers, currentProfile, assignedPersonnel, authenticateDemo, can, canView, scopeWorkspace, assertDemoAction, protectedValues } from '../src/access.js';

const owner = () => authenticateDemo('owner@zealpro.demo', 'OwnerDemo!2026');
const supervisor = () => authenticateDemo('supervisor@zealpro.demo', 'SupervisorDemo!2026');
const technician = () => authenticateDemo('technician@zealpro.demo', 'TechnicianDemo!2026');
const administrator = () => authenticateDemo('admin@zealpro.demo', 'AdminDemo!2026');
const supervisor2 = () => authenticateDemo('supervisor2@zealpro.demo', 'SupervisorDemo!2026');

test('four roles have five public profiles, current activation and immutable assignment identities', () => {
  const state = createDemo();
  assert.equal(DEMO_USERS.length, 5);
  assert.equal(new Set(DEMO_USERS.map(user => user.role)).size, 4);
  assert.equal(administrator().role, 'admin');
  assert.equal(supervisor2().teamId, 't2');
  assert.equal(supervisor().label, 'Supervisor 1');
  assert.equal(workspaceUsers(state).some(user => 'password' in user), false);
  state.presentation = { users: [{ ...technician(), name: 'Changed identity', displayName: 'Marco R.', active: false, password: 'never persist' }] };
  assert.equal(authenticateDemo('technician@zealpro.demo', 'TechnicianDemo!2026', state), null);
  assert.equal(currentProfile(state, technician()), null);
  const stored = workspaceUsers(state).find(user => user.role === 'technician');
  assert.equal(stored.name, 'Marco Reyes');
  assert.equal(stored.displayName, 'Marco R.');
  assert.equal(stored.password, undefined);
});

test('safe editable contact fields and prepared invites never persist public passwords or tokens', () => {
  const state = createDemo();
  state.presentation = { users: [{ ...administrator(), email: 'office@example.test', phone: '09170000000', password: 'discard', token: 'discard' }, { id: 'invite-1', email: 'new@example.test', name: 'New staff', displayName: 'New staff', role: 'technician', teamId: 't2', active: false, invitationStatus: 'Prepared', password: 'discard' }] };
  const profile = authenticateDemo('admin@zealpro.demo', 'AdminDemo!2026', state);
  assert.equal(profile.email, 'office@example.test');
  assert.equal(profile.phone, '09170000000');
  assert.equal(profile.password, undefined);
  assert.equal(profile.token, undefined);
  assert.equal(workspaceUsers(state).find(user => user.id === 'invite-1').invitationStatus, 'Prepared');
  assert.equal(authenticateDemo('office@example.test', 'AdminDemo!2026', state), null);
});

test('administrator sees commercial operations but owner alone sees margins and reverses payments', () => {
  const state = createDemo();
  assert.equal(can(administrator(), 'commercial'), true);
  assert.equal(can(administrator(), 'finance'), false);
  assert.equal(canView(administrator(), 'billing'), true);
  assert.equal(can(administrator(), 'manageServices'), false);
  assert.equal(can(administrator(), 'manageProducts'), true);
  assert.equal(can(supervisor(), 'restock'), false);
  assert.equal(can(supervisor(), 'costs'), true);
  assert.equal(can(technician(), 'costs'), false);
  assert.doesNotThrow(() => assertDemoAction(administrator(), 'payment-verify', state, state.invoices[0].id));
  assert.throws(() => assertDemoAction(administrator(), 'payment-void', state, state.invoices[0].id), /role/);
  state.presentation = { users: [{ ...administrator(), canCollect: false }] };
  assert.throws(() => assertDemoAction(administrator(), 'payment-verify', state, state.invoices[0].id), /role/);
  assert.doesNotThrow(() => assertDemoAction(administrator(), 'payment-submit', state, state.invoices[0].id));
  state.presentation.payments = [{ id: 'payment-1', invoiceId: state.invoices[0].id }];
  state.presentation.reminders = [{ id: 'reminder-1', invoiceId: state.invoices[0].id }];
  assert.doesNotThrow(() => assertDemoAction(administrator(), 'payment-proof', state, 'payment-1'));
  assert.doesNotThrow(() => assertDemoAction(administrator(), 'reminder-retry', state, 'reminder-1'));
  assert.doesNotThrow(() => assertDemoAction(administrator(), 'user-save', state, technician().id));
  assert.throws(() => assertDemoAction(administrator(), 'team-save', state, 't1'), /role/);
});

test('supervisor scope needs team personnel and branch mapping even at an overlapping branch', () => {
  const state = createDemo(), before = structuredClone(state);
  assert.deepEqual(DEFAULT_TEAMS[0].memberNames, ['Marco Reyes', 'Paolo Santos']);
  assert.deepEqual(scopeWorkspace(state, supervisor()).visits.map(visit => visit.id), ['v1', 'v2', 'v4', 'v6', 'v8']);
  assert.deepEqual(scopeWorkspace(state, supervisor2()).visits.map(visit => visit.id), ['v3', 'v5', 'v7', 'v9', 'v10']);
  assert.throws(() => assertDemoAction(supervisor(), 'visit', state, 'v7'), /assigned/);
  assert.throws(() => assertDemoAction(supervisor2(), 'review-report', state, state.reports[0].id), /assigned/);
  assert.deepEqual(state, before);
  state.presentation = { jobs: { v7: { personnel: ['Luis Mendoza', 'Marco Reyes'] }, v5: { personnel: ['Marco Reyes'] } } };
  assert.deepEqual(assignedPersonnel(state, state.visits.find(visit => visit.id === 'v7')), ['Luis Mendoza', 'Marco Reyes']);
  assert.ok(scopeWorkspace(state, supervisor()).visits.some(visit => visit.id === 'v7'));
  assert.ok(!scopeWorkspace(state, supervisor()).visits.some(visit => visit.id === 'v5'));
  assert.ok(scopeWorkspace(state, technician()).visits.some(visit => visit.id === 'v7'));
  assert.ok(scopeWorkspace(state, technician()).materials.some(material => material.id === 'm3'));
  assert.ok(!scopeWorkspace(createDemo(), technician()).materials.some(material => material.id === 'm3'));
});

test('report-linked observations cannot cross team scope through a shared branch', () => {
  const state = createDemo();
  state.observations.push({ clientId: 'c2', date: '2026-11-02', pest: 'Termites', count: 999, visitId: 'v7' });
  state.observations.push({ clientId: 'c2', date: '2026-11-02', pest: 'Termites', count: 998, sourceKind: 'report', sourceId: 'foreign-report' });
  assert.ok(!scopeWorkspace(state, supervisor()).observations.some(observation => observation.count === 999));
  assert.ok(!scopeWorkspace(state, technician()).observations.some(observation => observation.count === 999));
  assert.ok(!scopeWorkspace(state, technician()).observations.some(observation => observation.count === 998));
  assert.ok(scopeWorkspace(state, supervisor2()).observations.some(observation => observation.count === 999));
});

test('explicit action policies deny foreign work and separate submission from review', () => {
  const state = createDemo();
  assert.throws(() => assertDemoAction(administrator(), 'submit-report', state, 'v4'), /role/);
  assert.throws(() => assertDemoAction(technician(), 'review-report', state, state.reports[0].id), /role/);
  assert.throws(() => assertDemoAction(supervisor(), 'submit-report', state, 'v4'), /assigned/);
  assert.throws(() => assertDemoAction(supervisor(), 'report-revision', state, state.reports[0].id), /role/);
  assert.throws(() => assertDemoAction(supervisor(), 'reschedule', state, 'v7'), /assigned/);
  assert.throws(() => assertDemoAction(technician(), 'edit-assessment', state, 'missing'), /found/);
  state.presentation = { jobs: { v4: { personnel: ['Marco Reyes', supervisor().name] } } };
  assert.doesNotThrow(() => assertDemoAction(supervisor(), 'submit-report', state, 'v4'));
  assert.doesNotThrow(() => assertDemoAction(technician(), 'submit-report', state, 'v4'));
  assert.throws(() => assertDemoAction(supervisor(), 'complete', state, 'v4'), /role/);
  assert.throws(() => assertDemoAction(administrator(), 'choose-report', state), /role/);
  assert.throws(() => assertDemoAction(supervisor(), 'choose-report', state), /role/);
  assert.doesNotThrow(() => assertDemoAction(technician(), 'choose-report', state));
  assert.doesNotThrow(() => assertDemoAction(administrator(), 'client-status', state, 'c1'));
  assert.throws(() => assertDemoAction(administrator(), 'client-status', state, 'missing'), /found/);
});

test('ocular drafts can be continued only by their author or office roles', () => {
  const state = createDemo();
  state.presentation = { assessmentDrafts: { 'draft-1': { id: 'draft-1', actorId: technician().id, values: { notes: 'Incomplete inspection' } } } };
  for (const action of ['edit-assessment', 'save-assessment-draft', 'submit-assessment', 'ocular-draft-save', 'ocular-submit']) {
    assert.doesNotThrow(() => assertDemoAction(technician(), action, state, 'draft-1'));
    assert.doesNotThrow(() => assertDemoAction(owner(), action, state, 'draft-1'));
    assert.doesNotThrow(() => assertDemoAction(administrator(), action, state, 'draft-1'));
    assert.throws(() => assertDemoAction(supervisor(), action, state, 'draft-1'), /own/);
    assert.throws(() => assertDemoAction(supervisor2(), action, state, 'draft-1'), /own/);
  }
  assert.throws(() => assertDemoAction(technician(), 'ocular-detail', state, 'draft-1'), /found/);
  assert.equal(canView(technician(), 'settings'), true);
  assert.equal(canView(supervisor(), 'activity'), true);
});

test('administrator may schedule commercial charges but cannot override historical unit costs', () => {
  const state = createDemo();
  assert.equal(protectedValues(administrator(), 'visit', state, '', { clientId: 'c1', serviceId: 's1', rate: 1234 }).rate, 1234);
  const values = protectedValues(administrator(), 'complete', state, 'v4', { actualRevenue: 1234, products: [{ productId: 'm1', quantity: 3, unitCost: 999 }] });
  assert.equal(values.actualRevenue, 1234);
  assert.equal(values.products[0].unitCost, state.materials[0].cost);
});

test('public demo credentials fail closed and return no password or persistent token', () => {
  assert.equal(owner().role, 'owner');
  assert.equal(supervisor().role, 'supervisor');
  assert.equal(technician().name, 'Marco Reyes');
  assert.equal(authenticateDemo('owner@zealpro.demo', 'bad'), null);
  assert.equal(authenticateDemo('__proto__', 'OwnerDemo!2026'), null);
  assert.equal(authenticateDemo(null, null), null);
  assert.equal(owner().password, undefined);
  assert.equal(owner().token, undefined);
  assert.equal(can(null, 'finance'), false);
  assert.equal(can({ role: 'unknown' }, 'finance'), false);
});

test('role capabilities and routes keep finance and administration with the owner', () => {
  assert.equal(can(owner(), 'finance'), true);
  assert.equal(can(supervisor(), 'schedule'), true);
  assert.equal(can(supervisor(), 'finance'), false);
  assert.equal(can(supervisor(), 'cumulative'), true);
  assert.equal(can(technician(), 'schedule'), false);
  assert.equal(canView(technician(), 'analytics'), false);
  assert.equal(canView(supervisor(), 'billing'), false);
  assert.equal(canView(null, 'overview'), false);
});

test('technician views preserve the full workspace and expose only assigned work', () => {
  const state = createDemo(), before = structuredClone(state);
  const scoped = scopeWorkspace(state, technician());
  assert.deepEqual(scoped.visits.map(v => v.id), ['v1', 'v4', 'v8']);
  assert.deepEqual(scoped.reports.map(r => r.visitId), ['v1']);
  assert.deepEqual(scoped.invoices, []);
  assert.ok(scoped.clients.every(c => ['c1', 'c2', 'c3'].includes(c.id)));
  assert.deepEqual(state, before);
});

test('action guards reject foreign records, owner-only operations and unconfirmed corrections', () => {
  const state = createDemo();
  assert.doesNotThrow(() => assertDemoAction(technician(), 'complete', state, 'v4'));
  assert.throws(() => assertDemoAction(technician(), 'complete', state, 'v5'), /assigned/);
  assert.throws(() => assertDemoAction(technician(), 'report', state, state.reports[1].id), /assigned/);
  assert.throws(() => assertDemoAction(supervisor(), 'payment', state, state.invoices[0].id), /role/);
  assert.throws(() => assertDemoAction(technician(), 'visit', state, 'missing'), /found/);
  assert.throws(() => assertDemoAction(owner(), 'invented-action', state), /supported/);
  state.reports[0].financialsConfirmed = false;
  assert.throws(() => assertDemoAction(supervisor(), 'report-revision', state, state.reports[0].id), /Owner/);
});

test('non-owner submitted values cannot change prices or impersonate another assessor', () => {
  const state = createDemo();
  const values = protectedValues(technician(), 'complete', state, 'v4', { actualRevenue: 1, products: [{ productId: 'm1', quantity: 1, unitCost: 0 }], expense: 25 });
  assert.equal(values.actualRevenue, state.visits.find(v => v.id === 'v4').rate);
  assert.equal(values.products[0].unitCost, state.materials[0].cost);
  assert.equal(values.expense, 25);
  assert.equal(protectedValues(technician(), 'assessment', state, '', { clientId: 'c1', assessor: 'Carlo Garcia' }).assessor, 'Marco Reyes');
  assert.throws(() => protectedValues(technician(), 'assessment', state, '', { clientId: 'c4' }), /assigned/);
  const scheduled = protectedValues(supervisor(), 'visit', state, '', { clientId: 'c1', serviceId: 's1', rate: 1, plannedExpense: 0 });
  assert.equal(scheduled.rate, state.clients[0].rate);
  assert.equal(scheduled.plannedExpense, state.services[0].plannedExpense);
});
