import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemo } from '../src/data.js';
import { summary, scheduleVisit, completeVisit, recordPayment, restock, validateState, addAssessment, enrollClient } from '../src/model.js';

test('overview reconciles with visits and invoice balances', () => {
  const state = createDemo();
  const totals = summary(state, '2026-11-02');
  assert.equal(totals.scheduled, 8);
  assert.equal(totals.completed, 3);
  assert.equal(totals.projected, state.visits.filter(v => v.date === '2026-11-02').reduce((n, v) => n + v.rate, 0));
  assert.equal(totals.receivable, state.invoices.reduce((n, i) => n + i.amount - i.paid, 0));
});

test('schedule validates client, material availability and technician conflicts atomically', () => {
  const state = createDemo();
  const visit = { clientId: 'c1', date: '2026-11-03', time: '09:00', technician: 'Marco Reyes', treatment: 'Surface spraying', materialId: 'm1', quantity: 100, rate: 4500 };
  assert.throws(() => scheduleVisit(state, { ...visit, clientId: '<unknown>' }));
  assert.throws(() => scheduleVisit(state, { ...visit, quantity: -1 }));
  assert.throws(() => scheduleVisit(state, { ...visit, quantity: 1e9 }));
  assert.throws(() => scheduleVisit(state, { ...visit, date: '2026-02-30' }));
  const created = scheduleVisit(state, visit);
  assert.equal(created.status, 'Scheduled');
  assert.throws(() => scheduleVisit(state, visit), /already/);
});

test('fulfillment deducts once, compiles report, preserves state on invalid input', () => {
  const state = createDemo();
  const visit = state.visits.find(v => v.status === 'Scheduled');
  const before = structuredClone(state);
  const input = { timeIn: '13:00', timeOut: '14:00', materialId: 'm1', quantity: 100, expense: 200, pest: 'Cockroaches', pestCount: 2, location: 'Storage area', findings: 'Entry gap near door', recommendation: 'Seal entry gap', method: 'Surface spraying' };
  assert.throws(() => completeVisit(state, visit.id, { ...input, quantity: 1e9 }));
  assert.deepEqual(state, before);
  assert.throws(() => completeVisit(state, visit.id, { ...input, timeOut: '12:00' }));
  const report = completeVisit(state, visit.id, input);
  assert.equal(state.materials[0].stock, before.materials[0].stock - 100);
  assert.equal(report.visitId, visit.id);
  assert.equal(report.location, input.location);
  assert.equal(report.pest, 'Cockroaches');
  assert.equal(visit.status, 'Completed');
  const saved = structuredClone(state);
  assert.throws(() => completeVisit(state, visit.id, input), /already/);
  assert.deepEqual(state, saved);
});

test('a prospect can be assessed before enrollment', () => {
  const state = createDemo();
  const before = state.clients.length;
  const assessment = addAssessment(state, { clientId: '', accountName: 'Sample account', branch: 'New branch', date: '2026-11-02', time: '10:00', assessor: 'Marco Reyes', location: 'Loading bay', problem: 'Rodent activity', solution: 'Rodent traps', materialId: 'm5', notes: 'Inspect entry points.' });
  assert.equal(state.clients.length, before);
  assert.equal(assessment.accountName, 'Sample account');
  assert.equal(validateState(state), true);
  assert.throws(() => addAssessment(state, { ...assessment, accountName: '' }));
});

test('enrollment rejects duplicate branches and preserves valid user text', () => {
  const state = createDemo();
  const values = { name: '<Sample & company>', branch: 'Branch A', address: 'City', contact: 'Administrator', duration: '6 months', package: 'General pest control', rate: 4500, since: '2026-11-02' };
  const created = enrollClient(state, values);
  assert.equal(created.name, '<Sample & company>');
  assert.throws(() => enrollClient(state, values), /already/);
  assert.equal(validateState(state), true);
});

test('restock and payments reject invalid amounts and overpayment', () => {
  const state = createDemo();
  const invoice = state.invoices.find(i => i.amount > i.paid);
  assert.throws(() => recordPayment(state, invoice.id, -1, 'Bank transfer', 'REF'));
  assert.throws(() => recordPayment(state, invoice.id, invoice.amount + 1, 'Bank transfer', 'REF'));
  recordPayment(state, invoice.id, invoice.amount - invoice.paid, 'Bank transfer', 'DEMO-001');
  assert.equal(invoice.paid, invoice.amount);
  const before = state.materials[0].stock;
  assert.throws(() => restock(state, 'm1', 0));
  restock(state, 'm1', 100);
  assert.equal(state.materials[0].stock, before + 100);
});

test('stored state must have valid records and references', () => {
  assert.equal(validateState(createDemo()), true);
  assert.equal(validateState(null), false);
  assert.equal(validateState({ version: 1 }), false);
  const state = createDemo();
  state.visits[0].clientId = 'missing';
  assert.equal(validateState(state), false);
});
