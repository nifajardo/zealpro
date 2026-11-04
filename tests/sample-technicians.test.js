import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemo, STAFF } from '../src/data.js';
import { DEMO_USERS, authenticateDemo, can, scopeWorkspace } from '../src/access.js';
import { ensurePresentation, scheduleDemoVisit, updateUser, canReadExpense } from '../src/presentation.js';
import { migrateState, validateState } from '../src/model.js';

const signIn = id => {
  const user = DEMO_USERS.find(row => row.id === id);
  return authenticateDemo(user.email, user.password);
};

test('all eight sample technicians have distinct public logins and restricted roles', () => {
  const state = createDemo();
  const technicians = DEMO_USERS.filter(user => user.role === 'technician');
  assert.equal(technicians.length, 8);
  assert.deepEqual(new Set(technicians.map(user => user.name)), new Set(STAFF));
  assert.equal(new Set(DEMO_USERS.map(user => user.id)).size, DEMO_USERS.length);
  assert.equal(new Set(DEMO_USERS.map(user => user.email)).size, DEMO_USERS.length);
  for (const user of technicians) {
    const profile = authenticateDemo(user.email, user.password, state);
    assert.equal(profile.name, user.name);
    assert.equal(profile.password, undefined);
    assert.equal(can(profile, 'finance'), false);
    assert.equal(can(profile, 'schedule'), false);
    assert.ok(scopeWorkspace(state, profile).visits.every(visit => visit.technician === user.name));
  }
});

test('saved workspaces gain sample profiles once without losing records or owner changes', () => {
  const state = createDemo();
  state.presentation = {
    users: DEMO_USERS.slice(0, 5).map(({ password, ...user }) => ({ ...user, displayName: user.name })),
    teams: [
      { id: 't1', name: 'Custom North', memberNames: ['Marco Reyes', 'Paolo Santos'], branchIds: ['c1'] },
      { id: 't2', name: 'South team', memberNames: ['Luis Mendoza', 'Carlo Garcia'], branchIds: ['c5'] },
    ],
  };
  Object.assign(state.presentation.users[4], { displayName: 'Marco R.', active: false });
  const paoloReport = state.reports.find(report => report.technician === 'Paolo Santos');
  state.presentation.reports = { [paoloReport.id]: { status: 'Approved', legacy: true, expenseOwnerId: 'Paolo Santos', history: [], versions: [] } };
  const records = structuredClone({ visits: state.visits, reports: state.reports, materials: state.materials });
  const p = ensurePresentation(state);
  assert.equal(p.users.length, 12);
  assert.equal(p.users.some(user => 'password' in user), false);
  assert.equal(canReadExpense(state, signIn('paolo'), paoloReport), true);
  assert.equal(p.users.find(user => user.id === 'technician').displayName, 'Marco R.');
  assert.equal(p.users.find(user => user.id === 'technician').active, false);
  assert.deepEqual(p.teams[0].branchIds, ['c1']);
  assert.equal(p.teams[0].name, 'Custom North');
  assert.deepEqual(p.teams[0].memberNames, ['Marco Reyes', 'Paolo Santos', 'Nina Cruz', 'Adrian Ramos']);
  assert.deepEqual({ visits: state.visits, reports: state.reports, materials: state.materials }, records);
  p.teams[0].memberNames = p.teams[0].memberNames.filter(name => name !== 'Nina Cruz');
  updateUser(state, signIn('owner'), 'nina', { active: false, displayName: 'Nina C.' });
  ensurePresentation(state);
  assert.equal(p.teams[0].memberNames.includes('Nina Cruz'), false);
  assert.equal(authenticateDemo('nina@zealpro.demo', 'TechnicianDemo!2026', state), null);
  assert.equal(state.presentation.users.find(user => user.id === 'nina').displayName, 'Nina C.');
  assert.equal(state.presentation.users.length, 12);
});

test('new technicians can be scheduled within team scope with conflicts and persistence preserved', () => {
  const state = createDemo();
  const input = { clientId: 'c1', date: '2026-11-12', time: '09:00', serviceId: 's1', technician: 'Nina Cruz', personnel: ['Nina Cruz', 'Adrian Ramos'], products: [] };
  const north = scheduleDemoVisit(state, signIn('supervisor1'), input);
  assert.throws(() => scheduleDemoVisit(state, signIn('supervisor1'), { ...input, time: '09:30', technician: 'Adrian Ramos', personnel: ['Adrian Ramos'] }), /conflict/i);
  assert.throws(() => scheduleDemoVisit(state, signIn('supervisor1'), { ...input, technician: 'Bea Torres', personnel: ['Bea Torres'] }), /team/i);
  const south = scheduleDemoVisit(state, signIn('supervisor2'), { ...input, clientId: 'c5', technician: 'Bea Torres', personnel: ['Bea Torres', 'Diego Santos'] });
  for (const id of ['nina', 'adrian']) assert.deepEqual(scopeWorkspace(state, signIn(id)).visits.map(visit => visit.id), [north.id]);
  for (const id of ['bea', 'diego']) assert.deepEqual(scopeWorkspace(state, signIn(id)).visits.map(visit => visit.id), [south.id]);
  updateUser(state, signIn('owner'), 'nina', { active: false });
  assert.throws(() => scheduleDemoVisit(state, signIn('owner'), { ...input, time: '13:00' }), /inactive/i);
  assert.equal(validateState(state), true);
  const restored = migrateState(JSON.parse(JSON.stringify(state)));
  assert.ok(restored.visits.some(visit => visit.id === north.id && visit.technician === 'Nina Cruz'));
  assert.equal(validateState(restored), true);
});
