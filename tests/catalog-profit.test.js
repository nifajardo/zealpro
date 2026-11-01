import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemo } from '../src/data.js';
import { saveService, saveProduct, setCatalogActive, scheduleVisit, completeVisit, reviseReport, availableStock, calendarRange, calendarProfit, migrateState, validateState, addAssessment } from '../src/model.js';

const usage = { timeIn: '13:00', timeOut: '14:00', expense: 200, actualRevenue: 7000, pest: 'Rodents', pestCount: 2, location: 'Storage', findings: 'Door gap', recommendation: 'Seal gap', method: 'Baiting', remarks: '' };

test('services support multiple estimated products, editing and archival without rewriting visits', () => {
  const state = createDemo();
  const input = { name: 'Integrated warehouse care', description: 'Monitor and treat warehouse activity.', price: 7000, plannedExpense: 250, products: [{ productId: 'm1', quantity: 100 }, { productId: 'm5', quantity: 2 }] };
  const service = saveService(state, input);
  const visit = scheduleVisit(state, { clientId: 'c1', serviceId: service.id, date: '2026-11-03', time: '09:00', technician: 'Marco Reyes', rate: 7000, plannedExpense: 250, products: input.products });
  const saved = structuredClone(visit);
  saveService(state, { ...input, name: 'Revised warehouse care', price: 8500 }, service.id);
  assert.deepEqual(visit, saved);
  assert.throws(() => saveService(state, { ...input, name: ' Revised warehouse care ' }), /already/i);
  setCatalogActive(state, 'services', service.id, false);
  assert.throws(() => scheduleVisit(state, { ...visit, date: '2026-11-05' }), /active/i);
  setCatalogActive(state, 'services', service.id, true);
  assert.equal(validateState(state), true);
});

test('products can be defined and priced; reserved products and referenced units are protected', () => {
  const state = createDemo();
  const product = saveProduct(state, { name: 'New monitoring card', description: 'Disposable monitoring card.', unit: 'pcs', cost: 20, minimum: 5, stock: 10 });
  saveProduct(state, { ...product, cost: 25 }, product.id);
  assert.equal(product.cost, 25);
  assert.throws(() => saveProduct(state, { ...product, unit: 'g' }, product.id), /unit/i);
  setCatalogActive(state, 'materials', product.id, false);
  assert.equal(product.active, false);
  assert.throws(() => setCatalogActive(state, 'materials', 'm1', false), /service|allocated/i);
  assert.throws(() => saveProduct(state, { ...product, name: 'New monitoring card' }), /already/i);
  assert.equal(validateState(state), true);
});

test('multiple actual product lines deduct atomically and reports can correct usage', () => {
  const state = createDemo();
  const visit = state.visits.find(v => v.status === 'Scheduled');
  const before = structuredClone(state);
  const products = [{ productId: 'm1', quantity: 100, unitCost: 2 }, { productId: 'm5', quantity: 3, unitCost: 90 }];
  assert.throws(() => completeVisit(state, visit.id, { ...usage, products: [...products, { productId: 'm3', quantity: 1e8 }] }));
  assert.deepEqual(state, before);
  const report = completeVisit(state, visit.id, { ...usage, products });
  assert.equal(state.materials[0].stock, before.materials[0].stock - 100);
  assert.equal(state.materials[4].stock, before.materials[4].stock - 3);
  const after = structuredClone(state);
  assert.throws(() => reviseReport(state, report.id, { ...usage, products: [{ productId: 'm1', quantity: 1e8 }] }));
  assert.deepEqual(state, after);
  reviseReport(state, report.id, { ...usage, products: [{ productId: 'm1', quantity: 70, unitCost: 2 }, { productId: 'm5', quantity: 2, unitCost: 90 }] });
  assert.equal(state.materials[0].stock, before.materials[0].stock - 70);
  assert.equal(state.materials[4].stock, before.materials[4].stock - 2);
  assert.equal(report.financialsConfirmed, true);
  assert.throws(() => completeVisit(state, visit.id, { ...usage, products }), /already/);
  assert.equal(validateState(state), true);
});

test('profit uses captured quantities and prices, scoped to calendar range', () => {
  const state = createDemo();
  const visit = scheduleVisit(state, { clientId: 'c1', serviceId: state.services[0].id, date: '2026-12-01', time: '09:00', technician: 'Marco Reyes', rate: 1000, plannedExpense: 100, products: [{ productId: 'm1', quantity: 50 }] });
  const report = completeVisit(state, visit.id, { ...usage, timeIn: '09:00', timeOut: '10:00', actualRevenue: 950, expense: 80, products: [{ productId: 'm1', quantity: 40, unitCost: 3 }] });
  const range = calendarRange('2026-12-01', 'day');
  const totals = calendarProfit(state, range.start, range.end);
  assert.equal(totals.theoreticalProfit, 800);
  assert.equal(totals.actualProfit, 750);
  assert.equal(totals.variance, -50);
  saveProduct(state, { ...state.materials[0], cost: 99 }, 'm1');
  assert.deepEqual(calendarProfit(state, range.start, range.end), totals);
  assert.equal(report.products[0].unitCost, 3);
  assert.equal(visit.estimatedProducts[0].unitCost, 2);
  assert.equal(calendarProfit(state, '2027-01-01', '2027-01-31').actualProfit, null);
});

test('calendar scopes handle month and Monday-start week boundaries', () => {
  assert.deepEqual(calendarRange('2026-11-01', 'month'), { start: '2026-11-01', end: '2026-11-30' });
  assert.deepEqual(calendarRange('2026-11-01', 'week'), { start: '2026-10-26', end: '2026-11-01' });
  assert.deepEqual(calendarRange('2028-02-29', 'month'), { start: '2028-02-01', end: '2028-02-29' });
  assert.throws(() => calendarRange('2026-02-30', 'month'));
});

test('legacy records migrate without modifying input; unconfirmed profits stay excluded', () => {
  const legacy = createDemo();
  legacy.version = 1;
  legacy.invoices = legacy.invoices.filter(i => !i.visitId);
  delete legacy.services;
  for (const p of legacy.materials) { delete p.active; delete p.description; }
  for (const v of legacy.visits) { delete v.serviceId; delete v.estimatedProducts; delete v.plannedExpense; }
  for (const r of legacy.reports) { delete r.products; delete r.actualRevenue; delete r.financialsConfirmed; }
  const before = structuredClone(legacy);
  const upgraded = migrateState(legacy);
  assert.deepEqual(legacy, before);
  assert.equal(upgraded.version, 2);
  assert.equal(upgraded.clients.length, legacy.clients.length);
  assert.equal(upgraded.visits.length, legacy.visits.length);
  assert.deepEqual(upgraded.invoices, legacy.invoices);
  assert.equal(validateState(upgraded), true);
  const totals = calendarProfit(upgraded, '2026-11-01', '2026-11-30');
  assert.equal(totals.actualProfit, null);
  assert.equal(totals.unconfirmed, 3);
  assert.equal(upgraded.materials[0].stock, legacy.materials[0].stock);
  assert.equal(validateState({ ...upgraded, services: null }), false);
});

test('duplicate and fractional piece lines are rejected without reservation changes', () => {
  const state = createDemo();
  const input = { clientId: 'c1', serviceId: state.services[0].id, date: '2026-11-03', time: '09:00', technician: 'Marco Reyes', rate: 1000, plannedExpense: 0 };
  const before = availableStock(state, 'm5');
  assert.throws(() => scheduleVisit(state, { ...input, products: [{ productId: 'm5', quantity: 1.5 }] }));
  assert.throws(() => scheduleVisit(state, { ...input, products: [{ productId: 'm5', quantity: 1 }, { productId: 'm5', quantity: 1 }] }));
  assert.equal(availableStock(state, 'm5'), before);
});

test('migration preserves legacy fractional piece balances and quantities for review', () => {
  const legacy = createDemo();
  legacy.version = 1;
  legacy.invoices = legacy.invoices.filter(i => !i.visitId);
  delete legacy.services;
  legacy.materials.find(p => p.id === 'm5').stock = 35.5;
  const trapVisit = legacy.visits.find(v => v.materialId === 'm5');
  trapVisit.quantity = 1.5;
  const migrated = migrateState(legacy);
  assert.equal(migrated.materials.find(p => p.id === 'm5').stock, 35.5);
  assert.equal(migrated.visits.find(v => v.id === trapVisit.id).estimatedProducts[0].quantity, 1.5);
  assert.equal(validateState(migrated), true);
  assert.equal(migrateState(migrated).visits.length, legacy.visits.length);
  assert.throws(() => scheduleVisit(migrated, { clientId: 'c1', serviceId: 's6', date: '2026-11-03', time: '09:00', technician: 'Marco Reyes', rate: 1000, products: [{ productId: 'm5', quantity: 1.5 }] }), /whole/);
});

test('assessments retain stable service IDs after renaming or archiving', () => {
  const state = createDemo();
  const service = saveService(state, { name: 'Prospect care', description: 'Prospect service.', price: 5000, plannedExpense: 100, products: [] });
  const assessment = addAssessment(state, { clientId: 'c1', date: '2026-11-03', time: '09:00', assessor: 'Marco Reyes', location: 'Store', problem: 'Rodent activity', solution: service.name, materialId: 'm5', notes: '' });
  assert.equal(assessment.serviceId, service.id);
  saveService(state, { ...service, name: 'Renamed prospect care' }, service.id);
  assert.equal(state.services.find(s => s.id === assessment.serviceId).name, 'Renamed prospect care');
  setCatalogActive(state, 'services', service.id, false);
  assert.equal(state.services.find(s => s.id === assessment.serviceId).active, false);
  assert.equal(validateState(state), true);
});
