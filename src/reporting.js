import { assessmentFindings, calendarProfit, roundMoney } from './model.js';

export const accountKey = name => 'account:' + name.trim().replace(/\s+/g, ' ').toLowerCase();
const accountName = name => name.trim().replace(/\s+/g, ' ');
const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const byDate = (a, b) => compare(a.date, b.date) || compare(a.time || a.timeIn || '', b.time || b.timeIn || '') || compare(a.id || a.sourceId || '', b.id || b.sourceId || '');

export function accountOptions(state) {
  const accounts = new Map();
  for (const client of state.clients) {
    const key = accountKey(client.name);
    if (!accounts.has(key)) accounts.set(key, { key, name: accountName(client.name) });
  }
  return [...accounts.values()].sort((a, b) => compare(a.key, b.key));
}

// Old browser workspaces predate provenance; recognize only the exact published sample counts.
function legacySeed(observation) {
  const month = ['2026-06-15', '2026-07-15', '2026-08-15', '2026-09-15', '2026-10-15'].indexOf(observation.date);
  const samples = { c1: ['Cockroaches', [18, 15, 11, 8, 5]], c2: ['Cockroaches', [22, 20, 15, 12, 7]], c4: ['Rodents', [9, 7, 8, 5, 3]] };
  const sample = samples[observation.clientId];
  return !observation.source && !observation.id && !observation.sourceKind && month >= 0 && sample?.[0] === observation.pest && sample[1][month] === observation.count;
}

export function pestObservations(state, clientId = 'all') {
  const occurrences = new Map();
  const observations = state.observations.filter(o => !(o.sourceKind === 'report' && state.reports.some(r => r.id === o.sourceId))).map(o => {
    const seed = o.source === 'Illustrative historical seed' || o.sourceKind === 'seed' || legacySeed(o);
    const tuple = JSON.stringify([o.clientId, o.date, o.pest, o.count]);
    const occurrence = (occurrences.get(tuple) || 0) + 1;
    occurrences.set(tuple, occurrence);
    return { ...o, sourceKind: seed ? 'seed' : 'observation', sourceLabel: seed ? 'Illustrative historical seed' : o.source || o.sourceLabel || 'Recorded observation', sourceId: o.sourceId || o.id || `${tuple}:${occurrence}` };
  });
  const reports = state.reports.map(r => ({ clientId: r.clientId, date: r.date, pest: r.pest, count: r.pestCount, sourceKind: 'report', sourceLabel: `Service report ${r.id}`, sourceId: r.id }));
  return [...observations, ...reports].filter(o => clientId === 'all' || o.clientId === clientId);
}

const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;

export function buildCumulativeReport(state, { account = 'all', branch = 'all', start, end }) {
  if (!validDate(start) || !validDate(end) || end < start) throw new Error('Choose valid start and end dates, with the end on or after the start date.');
  const selectedAccount = accountOptions(state).find(a => a.key === account);
  if (account !== 'all' && !selectedAccount) throw new Error('Choose an existing account.');
  const accountClients = state.clients.filter(c => account === 'all' || accountKey(c.name) === account);
  if (branch !== 'all' && !accountClients.some(c => c.id === branch)) throw new Error('Choose a branch belonging to the selected account.');
  const clients = accountClients.filter(c => branch === 'all' || c.id === branch).sort((a, b) => compare(accountKey(a.name), accountKey(b.name)) || compare(a.branch, b.branch) || compare(a.id, b.id));
  const clientIds = new Set(clients.map(c => c.id));
  const inScope = row => clientIds.has(row.clientId) && row.date >= start && row.date <= end;
  const visits = state.visits.filter(inScope).sort(byDate);
  const reports = state.reports.filter(inScope).sort(byDate);
  const assessments = state.assessments.filter(inScope).sort(byDate).map(a => ({ ...a, findings: assessmentFindings(a).map(f => ({
    ...f, serviceName: state.services.find(s => s.id === f.serviceId)?.name || a.solution || f.serviceId,
    materialNames: f.materialIds.map(id => state.materials.find(m => m.id === id)?.name || id),
  })) }));
  const observations = pestObservations(state).filter(inScope).sort(byDate);
  const productTotals = new Map();
  for (const report of reports) for (const line of report.products) {
    const key = JSON.stringify([line.productId, line.unit]);
    const total = productTotals.get(key) || { productId: line.productId, name: line.name, unit: line.unit, quantity: 0, cost: 0 };
    total.quantity += line.quantity;
    total.cost += line.quantity * line.unitCost;
    productTotals.set(key, total);
  }
  const products = [...productTotals.values()].map(p => ({ ...p, quantity: roundMoney(p.quantity), cost: roundMoney(p.cost) })).sort((a, b) => compare(a.productId, b.productId) || compare(a.unit, b.unit));
  const counts = clientId => ({ visits: visits.filter(v => v.clientId === clientId).length, completed: visits.filter(v => v.clientId === clientId && v.status === 'Completed').length, reports: reports.filter(r => r.clientId === clientId).length, assessments: assessments.filter(a => a.clientId === clientId).length });
  return {
    start, end, accountLabel: selectedAccount?.name || 'All accounts', branchLabel: branch === 'all' ? 'All branches' : clients[0].branch,
    clients, visits, reports, assessments, observations, products,
    branches: clients.map(c => ({ clientId: c.id, name: c.name, branch: c.branch, ...counts(c.id) })),
    totals: { visits: visits.length, completed: visits.filter(v => v.status === 'Completed').length, reports: reports.length, assessments: assessments.length },
    financial: calendarProfit({ ...state, visits, reports }, start, end),
  };
}
