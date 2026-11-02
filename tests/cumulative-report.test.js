import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemo } from '../src/data.js';
import { accountKey, accountOptions, pestObservations, buildCumulativeReport } from '../src/reporting.js';

function workspace() {
  const state = createDemo();
  state.clients = [
    { ...state.clients[0], id: 'north', name: '  Café   Group ', branch: 'North' },
    { ...state.clients[0], id: 'south', name: 'CAFÉ GROUP', branch: 'South' },
    { ...state.clients[0], id: 'other', name: 'Another account', branch: 'East' },
  ];
  const baseVisit = state.visits[0], baseReport = state.reports[0];
  const rows = [['before', 'north', '2026-10-31'], ['first', 'north', '2026-11-01'], ['last', 'south', '2026-11-30'], ['after', 'south', '2026-12-01'], ['outside', 'other', '2026-11-15']];
  state.visits = rows.map(([id, clientId, date]) => ({ ...baseVisit, id, clientId, date, rate: 8765.43 }));
  state.reports = rows.map(([id, clientId, date]) => ({ ...baseReport, id: `SR-${id}`, visitId: id, clientId, date, actualRevenue: 7654.32, expense: 123.45, products: [{ productId: 'm1', name: 'Captured concentrate', unit: 'mL', quantity: 10, unitCost: 17.89 }] }));
  state.assessments = [
    { ...state.assessments[0], id: 'ocular-first', clientId: 'north', date: '2026-11-01', findings: undefined },
    { ...state.assessments[0], id: 'ocular-last', clientId: 'south', date: '2026-11-30', findings: [{ location: 'Store', problem: 'Rodent activity', serviceId: 's4', materialIds: ['m3', 'm5'], notes: 'Door gap' }, { location: 'Roof', problem: 'Termite activity', serviceId: 's5', materialIds: ['m4'], notes: 'Inspect timber' }] },
    { ...state.assessments[0], id: 'ocular-outside', clientId: 'other', date: '2026-11-15' },
  ];
  state.observations = [{ id: 'reading', clientId: 'north', date: '2026-11-20', pest: 'Rodents', count: 0, source: 'Manual inspection' }];
  return state;
}

const november = { account: 'account:café group', start: '2026-11-01', end: '2026-11-30' };

test('account identity collapses whitespace and case without merging different names', () => {
  assert.equal(accountKey('  Café \t GROUP '), 'account:café group');
  assert.deepEqual(accountOptions(workspace()), [{ key: 'account:another account', name: 'Another account' }, { key: 'account:café group', name: 'Café Group' }]);
});

test('cumulative reports include both account branches and exact inclusive date boundaries', () => {
  const state = workspace(), before = structuredClone(state);
  const report = buildCumulativeReport(state, november);
  assert.deepEqual(report.totals, { visits: 2, completed: 2, reports: 2, assessments: 2 });
  assert.deepEqual(report.visits.map(v => v.id), ['first', 'last']);
  assert.deepEqual(report.reports.map(r => r.id), ['SR-first', 'SR-last']);
  assert.deepEqual(report.clients.map(c => c.id), ['north', 'south']);
  assert.deepEqual(report.branches, [
    { clientId: 'north', name: '  Café   Group ', branch: 'North', visits: 1, completed: 1, reports: 1, assessments: 1 },
    { clientId: 'south', name: 'CAFÉ GROUP', branch: 'South', visits: 1, completed: 1, reports: 1, assessments: 1 },
  ]);
  assert.equal(report.accountLabel, 'Café Group');
  assert.equal(report.branchLabel, 'All branches');
  assert.equal(report.observations.length, 3);
  assert.deepEqual(state, before);
  assert.equal(buildCumulativeReport(state, { ...november, branch: 'south' }).totals.visits, 1);
});

test('cumulative filters reject unknown accounts, mismatched branches and invalid real dates', () => {
  const state = workspace();
  for (const filters of [{ account: 'missing' }, { account: 'Café Group' }, { branch: 'other' }, { branch: 'North' }, { start: '2026-02-30' }, { start: '11/01/2026' }, { start: '2026-12-01' }, { end: '' }]) {
    assert.throws(() => buildCumulativeReport(state, { ...november, ...filters }), /account|branch|date|range/i);
  }
  assert.equal(buildCumulativeReport(state, { ...november, account: 'all', branch: 'other' }).totals.visits, 1);
  assert.equal(buildCumulativeReport(state, { account: 'all', start: '2028-02-29', end: '2028-02-29' }).totals.visits, 0);
});

test('actual products aggregate captured units and costs independently of the live catalog', () => {
  const state = workspace();
  state.reports.find(r => r.id === 'SR-last').products = [
    { productId: 'm1', name: 'Captured concentrate', unit: 'mL', quantity: 5, unitCost: 20 },
    { productId: 'm1', name: 'Captured bulk concentrate', unit: 'L', quantity: 2, unitCost: 80 },
  ];
  state.materials[0].cost = 999999;
  const report = buildCumulativeReport(state, november);
  assert.deepEqual(report.products, [
    { productId: 'm1', name: 'Captured bulk concentrate', unit: 'L', quantity: 2, cost: 160 },
    { productId: 'm1', name: 'Captured concentrate', unit: 'mL', quantity: 15, cost: 278.9 },
  ]);
  assert.equal(report.financial.actualCost, 685.8);
  assert.equal(report.financial.actualRevenue, 15308.64);
});

test('unconfirmed reports count operationally while empty actual profit stays unknown', () => {
  const state = workspace();
  for (const report of state.reports) report.financialsConfirmed = false;
  const report = buildCumulativeReport(state, november);
  assert.equal(report.totals.completed, 2);
  assert.equal(report.totals.reports, 2);
  assert.equal(report.financial.actualProfit, null);
  assert.equal(report.financial.unconfirmed, 2);
  const empty = buildCumulativeReport(state, { ...november, start: '2027-01-01', end: '2027-01-31' });
  assert.deepEqual(empty.totals, { visits: 0, completed: 0, reports: 0, assessments: 0 });
  assert.deepEqual(empty.products, []);
  assert.deepEqual(empty.observations, []);
  assert.equal(empty.financial.actualProfit, null);
});

test('pest graph sources distinguish historical illustrative seed, recorded counts and identified reports', () => {
  const state = createDemo();
  state.observations.forEach(o => { delete o.source; delete o.sourceKind; });
  state.observations[0].source = 'Illustrative historical seed';
  state.observations.push({ id: 'imported', ...state.observations[1], source: 'Imported field log' });
  state.observations.push({ id: 'manual', clientId: 'c1', date: '2026-11-01', pest: 'Rodents', count: 0 });
  state.observations.push({ clientId: 'c1', date: state.reports[0].date, pest: state.reports[0].pest, count: state.reports[0].pestCount, sourceKind: 'report', sourceId: state.reports[0].id });
  const before = structuredClone(state), observations = pestObservations(state);
  assert.equal(observations.filter(o => o.sourceKind === 'seed').length, 15);
  assert.equal(observations.find(o => o.sourceId === 'imported').sourceKind, 'observation');
  assert.equal(observations.find(o => o.sourceId === 'imported').sourceLabel, 'Imported field log');
  assert.equal(observations.find(o => o.sourceId === 'manual').count, 0);
  assert.equal(observations.filter(o => o.sourceKind === 'report').length, state.reports.length);
  assert.match(observations.find(o => o.sourceKind === 'report').sourceLabel, new RegExp(state.reports[0].id));
  assert.equal(new Set(observations.map(o => `${o.sourceKind}:${o.sourceId}`)).size, observations.length);
  assert.deepEqual(pestObservations(state, 'c1'), observations.filter(o => o.clientId === 'c1'));
  assert.deepEqual(state, before);
  assert.equal(observations.some(o => o.sourceId === 'a1'), false);
});



test('cumulative findings resolve human-readable recommendations from stable catalog IDs without rewriting records', () => {
  const state = workspace();
  Object.assign(state.services.find(s => s.id === 's4'), { name: 'Revised rodent program', active: false });
  state.materials.find(m => m.id === 'm3').name = 'Revised bait label';
  const before = structuredClone(state), report = buildCumulativeReport(state, november);
  assert.equal(report.assessments[1].findings[0].serviceName, 'Revised rodent program');
  assert.deepEqual(report.assessments[1].findings[0].materialNames, ['Revised bait label', 'Monitoring traps']);
  assert.deepEqual(state, before);
});


test('cumulative report retains general instructions independently of per-finding notes', () => {
  const state = createDemo();
  state.assessments[0].notes = 'Wait for client clearance before entry.';
  state.assessments[0].findings[0].notes = 'Inspect the loading area first.';
  const report = buildCumulativeReport(state, { start: '2026-01-01', end: '2026-12-31' });
  assert.equal(report.assessments[0].notes, 'Wait for client clearance before entry.');
  assert.equal(report.assessments[0].findings[0].notes, 'Inspect the loading area first.');
});

test('an account named All never selects unrelated accounts', () => {
  const state = createDemo();
  state.clients[0].name = 'All';
  const report = buildCumulativeReport(state, { account: accountKey('All'), start: '2026-01-01', end: '2026-12-31' });
  assert.deepEqual(report.clients.map(c => c.id), ['c1']);
  assert.ok(report.visits.every(v => v.clientId === 'c1'));
  assert.equal(report.accountLabel, 'All');
});
