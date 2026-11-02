import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemo } from '../src/data.js';
import { authenticateDemo, can, canView, scopeWorkspace, assertDemoAction, protectedValues } from '../src/access.js';

const owner = () => authenticateDemo('owner@zealpro.demo', 'OwnerDemo!2026');
const supervisor = () => authenticateDemo('supervisor@zealpro.demo', 'SupervisorDemo!2026');
const technician = () => authenticateDemo('technician@zealpro.demo', 'TechnicianDemo!2026');

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
