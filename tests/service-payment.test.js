import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemo } from '../src/data.js';
import { completeVisit, reviseReport, recordPayment, paymentSummary, serviceDueDate, linkServicePayment, migrateState, validateState } from '../src/model.js';

const usage = { timeIn: '13:00', timeOut: '14:00', products: [], actualRevenue: 7000, expense: 0, pest: 'Rodents', pestCount: 0, location: 'Storage', findings: 'No activity', recommendation: 'Monitor', method: 'Inspection' };

test('service payment is due 30 calendar days after delivery across month and leap-year boundaries', () => {
  assert.equal(serviceDueDate('2026-11-02'), '2026-12-02');
  assert.equal(serviceDueDate('2026-12-15'), '2027-01-14');
  assert.equal(serviceDueDate('2028-02-01'), '2028-03-02');
  assert.throws(() => serviceDueDate('2026-02-30'));
  assert.throws(() => serviceDueDate('9999-12-31'), /range/);
});

test('completion creates exactly one linked unpaid balance without changing service fulfillment', () => {
  const state = createDemo(), visit = state.visits.find(v => v.status === 'Scheduled');
  const count = state.invoices.length;
  const report = completeVisit(state, visit.id, usage);
  const invoice = state.invoices.find(i => i.visitId === visit.id);
  assert.equal(invoice.amount, 7000);
  assert.equal(invoice.due, '2026-12-02');
  assert.equal(paymentSummary(invoice, '2026-11-02').status, 'Unpaid');
  assert.equal(visit.status, 'Completed');
  assert.equal(invoice.paid, 0);
  assert.equal(state.invoices.length, count + 1);
  assert.throws(() => completeVisit(state, visit.id, usage), /already/);
  assert.equal(state.invoices.length, count + 1);
  assert.equal(report.visitId, visit.id);
  assert.equal(validateState(state), true);
});

test('due-day, partial, overdue and settled balances remain independent of completed service status', () => {
  const state = createDemo(), visit = state.visits.find(v => v.status === 'Scheduled');
  completeVisit(state, visit.id, usage);
  const invoice = state.invoices.find(i => i.visitId === visit.id);
  assert.equal(paymentSummary(invoice, '2026-11-20').timing, 'Due in 12 days');
  assert.equal(paymentSummary(invoice, '2026-12-02').timing, 'Due today');
  assert.equal(paymentSummary(invoice, '2026-12-02').status, 'Unpaid');
  recordPayment(state, invoice.id, 1000, 'Cash', 'PARTIAL');
  assert.equal(paymentSummary(invoice, '2026-11-20').status, 'Partially paid');
  assert.deepEqual(paymentSummary(invoice, '2026-12-07'), { status: 'Overdue', balance: 6000, timing: 'Overdue by 5 days' });
  recordPayment(state, invoice.id, 6000, 'Bank transfer', 'SETTLED');
  assert.deepEqual(paymentSummary(invoice, '2026-12-07'), { status: 'Paid', balance: 0, timing: 'Paid in full' });
  assert.equal(visit.status, 'Completed');
});

test('report corrections keep linked balances accurate and reject charges below collected amounts atomically', () => {
  const state = createDemo(), visit = state.visits.find(v => v.status === 'Scheduled');
  const report = completeVisit(state, visit.id, usage);
  const invoice = state.invoices.find(i => i.visitId === visit.id);
  recordPayment(state, invoice.id, 5000, 'Cash', 'PARTIAL');
  reviseReport(state, report.id, { ...usage, actualRevenue: 6000 });
  assert.equal(invoice.amount, 6000);
  assert.equal(invoice.due, '2026-12-02');
  const saved = structuredClone(state);
  assert.throws(() => reviseReport(state, report.id, { ...usage, actualRevenue: 4000 }), /collected/);
  assert.deepEqual(state, saved);
});

test('older unlinked records preserve invoices and require an explicit reviewed payment link', () => {
  const state = createDemo(), visit = state.visits.find(v => v.status === 'Completed');
  state.invoices = state.invoices.filter(i => !i.visitId);
  const migrated = migrateState(state);
  assert.deepEqual(migrated.invoices, state.invoices);
  assert.equal(migrated.invoices.some(i => i.visitId === visit.id), false);
  const before = structuredClone(migrated);
  assert.throws(() => linkServicePayment(migrated, visit.id, migrated.invoices.find(i => i.clientId !== visit.clientId).id), /matching/);
  assert.deepEqual(migrated, before);
  const invoice = linkServicePayment(migrated, visit.id);
  assert.equal(invoice.due, '2026-12-02');
  assert.equal(invoice.amount, state.reports.find(r => r.visitId === visit.id).actualRevenue);
  assert.throws(() => linkServicePayment(migrated, visit.id), /already/);
  assert.equal(validateState(migrated), true);
});

test('review can link a matching existing service invoice without duplicating or rewriting payments and terms', () => {
  const state = createDemo(), visit = state.visits.find(v => v.status === 'Completed');
  state.invoices = state.invoices.filter(i => !i.visitId);
  const invoice = { id: 'OLD-SERVICE', clientId: visit.clientId, date: visit.date, due: '2026-12-05', amount: 4500, paid: 1000, treatment: visit.treatment, payments: [] };
  state.invoices.push(invoice);
  const old = structuredClone(invoice), count = state.invoices.length;
  linkServicePayment(state, visit.id, invoice.id);
  assert.deepEqual(invoice, { ...old, visitId: visit.id });
  assert.equal(state.invoices.length, count);
  const duplicate = structuredClone(invoice); duplicate.id = 'DUPLICATE'; state.invoices.push(duplicate);
  assert.equal(validateState(state), false);
  state.invoices.pop(); invoice.clientId = 'c2';
  assert.equal(validateState(state), false);
});

test('unconfirmed legacy charges cannot create a guessed balance and a free completed service is settled', () => {
  const state = createDemo(), oldVisit = state.visits.find(v => v.status === 'Completed');
  state.invoices = state.invoices.filter(i => !i.visitId);
  state.reports.find(r => r.visitId === oldVisit.id).financialsConfirmed = false;
  const before = structuredClone(state);
  assert.throws(() => linkServicePayment(state, oldVisit.id), /Confirm/);
  assert.deepEqual(state, before);
  const visit = state.visits.find(v => v.status === 'Scheduled');
  completeVisit(state, visit.id, { ...usage, actualRevenue: 0 });
  assert.deepEqual(paymentSummary(state.invoices.find(i => i.visitId === visit.id), '2027-01-01'), { status: 'Paid', balance: 0, timing: 'Paid in full' });
});
