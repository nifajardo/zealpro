import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemo } from '../src/data.js';
import { validateState, availableStock } from '../src/model.js';
import * as flow from '../src/presentation.js';

const owner = { id: 'owner', role: 'owner', name: 'General manager' };
const tech = { id: 'technician', role: 'technician', name: 'Marco Reyes' };
const supervisor = { id: 'supervisor1', role: 'supervisor', name: 'North supervisor' };
const supervisor2 = { id: 'supervisor2', role: 'supervisor', name: 'South supervisor' };
const values = { timeIn: '11:00', timeOut: '11:45', products: [{ productId: 'm1', quantity: 100 }], expense: 150, pest: 'Cockroaches', pestCount: 2, location: 'Storage', findings: 'Entry gap', recommendation: 'Seal gap', method: 'Surface spraying', remarks: '' };

test('submission posts stock once, revisions reconcile the net, approval bills once and locks', () => {
  const state = createDemo();
  const stock = state.materials[0].stock;
  flow.saveReportDraft(state, tech, 'v4', { findings: 'Incomplete draft' });
  assert.equal(state.reports.length, 3);
  const report = flow.submitReport(state, tech, 'v4', values);
  assert.equal(state.materials[0].stock, stock - 100);
  assert.equal(state.invoices.some(i => i.visitId === 'v4'), false);
  assert.equal(flow.jobStatus(state, state.visits.find(v => v.id === 'v4')), 'Submitted');
  assert.throws(() => flow.submitReport(state, tech, 'v4', values));
  assert.throws(() => flow.reviewReport(state, supervisor2, report.id, 'Approved', ''));
  flow.reviewReport(state, supervisor, report.id, 'Returned', 'Correct quantity');
  flow.submitReport(state, tech, 'v4', { ...values, products: [{ productId: 'm1', quantity: 120 }] });
  assert.equal(state.materials[0].stock, stock - 120);
  flow.reviewReport(state, supervisor, report.id, 'Approved', 'Checked field record');
  flow.reviewReport(state, supervisor, report.id, 'Approved', '');
  assert.equal(state.invoices.filter(i => i.visitId === 'v4').length, 1);
  assert.equal(state.materials[0].stock, stock - 120);
  assert.throws(() => flow.submitReport(state, tech, 'v4', values), /locked|approved/i);
  assert.equal(validateState(state), true);
});

test('co-personnel conflicts and cancellation release stock and time without deleting history', () => {
  const state = createDemo();
  const input = { clientId: 'c1', date: '2026-11-08', time: '09:00', serviceId: 's1', technician: 'Marco Reyes', personnel: ['Marco Reyes', 'Paolo Santos'], rate: 4500 };
  const before = availableStock(state, 'm1');
  const visit = flow.scheduleDemoVisit(state, owner, input);
  assert.throws(() => flow.scheduleDemoVisit(state, owner, { ...input, technician: 'Paolo Santos', personnel: ['Paolo Santos'], time: '09:30' }), /hour|conflict/i);
  flow.cancelDemoVisit(state, owner, visit.id, 'Customer rescheduled');
  assert.equal(availableStock(state, 'm1'), before);
  flow.scheduleDemoVisit(state, owner, input);
  assert.equal(flow.jobStatus(state, state.visits.find(v => v.id === visit.id)), 'Cancelled');
  assert.ok(state.presentation.jobs[visit.id].cancelledSnapshot.estimatedProducts.length);
  assert.equal(validateState(state), true);
});

test('payment verification credits once; reversal retains both original and audit', () => {
  const state = createDemo();
  const invoice = state.invoices.find(i => i.paid < i.amount);
  const before = invoice.paid;
  const payment = flow.recordPaymentDraft(state, owner, invoice.id, { amount: 100, method: 'Cash', reference: 'TEST', proof: { name: 'proof.jpg', size: 20, type: 'image/jpeg' } });
  assert.equal(state.invoices.find(i => i.id === invoice.id).paid, before);
  flow.verifyPayment(state, owner, payment.id);
  flow.verifyPayment(state, owner, payment.id);
  assert.equal(state.invoices.find(i => i.id === invoice.id).paid, before + 100);
  flow.voidPayment(state, owner, payment.id, 'Duplicate customer transfer');
  flow.voidPayment(state, owner, payment.id, 'Duplicate customer transfer');
  assert.equal(state.invoices.find(i => i.id === invoice.id).paid, before);
  assert.equal(state.invoices.find(i => i.id === invoice.id).payments.length, 1);
  assert.equal(state.presentation.payments.find(p => p.id === payment.id).status, 'Voided');
});

test('legacy metadata preserves records and actual aggregate excludes submitted work', () => {
  const state = createDemo(), before = structuredClone(state);
  flow.ensurePresentation(state);
  assert.deepEqual(state.reports, before.reports);
  assert.deepEqual(state.invoices, before.invoices);
  assert.equal(flow.reportMeta(state, state.reports[0].id).status, 'Approved');
  assert.equal(flow.reportMeta(state, state.reports[0].id).legacy, true);
  assert.equal(flow.reportMeta(state, state.reports[0].id).approvedBy, undefined);
  flow.submitReport(state, tech, 'v4', values);
  const projected = flow.approvedWorkspace(state);
  assert.equal(projected.reports.length, before.reports.length);
  assert.equal(projected.visits.length, state.visits.length);
});

test('field input cannot change charges or unit costs and failed submission is atomic', () => {
  const state = createDemo(), before = structuredClone(state);
  assert.throws(() => flow.submitReport(state, tech, 'v4', { ...values, products: [{ productId: 'm1', quantity: 1e9 }] }), /stock/i);
  assert.deepEqual(state, before);
  const report = flow.submitReport(state, tech, 'v4', { ...values, actualRevenue: 1, products: [{ productId: 'm1', quantity: 100, unitCost: 0 }] });
  assert.equal(report.actualRevenue, before.visits.find(v => v.id === 'v4').rate);
  assert.equal(report.products[0].unitCost, before.materials[0].cost);
  assert.throws(() => flow.cancelDemoVisit(state, owner, 'v4', 'Cancel posted actual'), /consumption/i);
});

test('approved amendments preserve versions, approvals and paid-charge protection', () => {
  const state = createDemo();
  const report = flow.submitReport(state, tech, 'v4', values);
  flow.reviewReport(state, owner, report.id, 'Approved');
  const invoice = state.invoices.find(i => i.visitId === 'v4');
  const payment = flow.recordPaymentDraft(state, owner, invoice.id, { amount: 500, method: 'Cash', reference: 'AMEND-PAY' });
  flow.verifyPayment(state, owner, payment.id);
  const approval = flow.reportMeta(state, report.id).approvalRef;
  flow.beginAmendment(state, owner, report.id, 'Correct field observations');
  const before = structuredClone(state);
  assert.throws(() => flow.submitReport(state, owner, 'v4', { ...values, actualRevenue: 100 }), /collected/i);
  assert.deepEqual(state, before);
  flow.submitReport(state, tech, 'v4', { ...values, findings: 'Corrected entry observation' });
  flow.reviewReport(state, owner, report.id, 'Approved');
  const meta = flow.reportMeta(state, report.id);
  assert.ok(meta.versions.some(v => v.record.findings === values.findings));
  assert.equal(meta.approvals[0].reference, approval);
  assert.equal(meta.approvals.length, 2);
  assert.equal(state.invoices.filter(i => i.visitId === 'v4').length, 1);
  assert.equal(state.invoices.find(i => i.visitId === 'v4').paid, 500);
});

test('performing Supervisor cannot approve co-performed report after role change', () => {
  const state = createDemo();
  const report = flow.submitReport(state, tech, 'v4', values);
  flow.updateUser(state, owner, 'technician', { role: 'supervisor', teamId: 't1' });
  assert.throws(() => flow.reviewReport(state, tech, report.id, 'Approved'), /performing/i);
  assert.throws(() => flow.reviewReport(state, tech, report.id, 'Returned', 'Self review'), /performing/i);
  flow.reviewReport(state, owner, report.id, 'Approved');
});

test('ocular incomplete drafts and independent findings survive return and correction', () => {
  const state = createDemo();
  const draft = flow.saveAssessmentDraft(state, tech, { clientId: 'c2', notes: 'Incomplete' });
  assert.equal(state.assessments.length, 1);
  const findings = [
    { location: 'Kitchen', problem: 'Cockroach activity', serviceId: 's3', materialIds: ['m2'], notes: 'Kitchen notes' },
    { location: 'Loading bay', problem: 'Rodent activity', serviceId: 's6', materialIds: ['m5'], notes: 'Bay notes' },
  ];
  const input = { clientId: 'c2', date: '2026-11-05', time: '09:00', assessor: 'Marco Reyes', findings, notes: 'Shared visit notes' };
  const assessment = flow.submitAssessment(state, tech, input, draft.id);
  assert.equal(assessment.id, draft.id);
  assert.deepEqual(assessment.findings, findings);
  assert.throws(() => flow.reviewAssessment(state, supervisor2, assessment.id, 'Approved'), /outside/i);
  flow.reviewAssessment(state, supervisor, assessment.id, 'Returned', 'Revise bay finding');
  flow.saveAssessmentDraft(state, tech, { findings: [findings[0], { ...findings[1], notes: 'Corrected bay notes' }] }, assessment.id);
  flow.submitAssessment(state, tech, {}, assessment.id);
  flow.reviewAssessment(state, supervisor, assessment.id, 'Approved');
  assert.equal(state.assessments.find(a => a.id === assessment.id).findings[0].notes, 'Kitchen notes');
  assert.equal(state.assessments.find(a => a.id === assessment.id).findings[1].notes, 'Corrected bay notes');
  assert.equal(flow.assessmentMeta(state, assessment.id).versions.length, 3);
  assert.equal(validateState(state), true);
});

test('draft ownership, last Owner and Admin elevation safeguards reject atomically', () => {
  const state = createDemo(), admin = { id: 'admin' };
  const draft = flow.saveAssessmentDraft(state, supervisor, { notes: 'Private team draft' });
  assert.throws(() => flow.saveAssessmentDraft(state, tech, { notes: 'Overwrite' }, draft.id), /own/i);
  assert.throws(() => flow.submitAssessment(state, tech, {}, draft.id), /own/i);
  assert.throws(() => flow.updateUser(state, owner, 'owner', { active: false }), /last active Owner/i);
  assert.throws(() => flow.updateUser(state, owner, 'owner', { role: 'admin' }), /last active Owner/i);
  assert.throws(() => flow.updateUser(state, admin, 'technician', { role: 'owner' }), /Only the Owner/i);
  const updated = flow.updateUser(state, admin, 'technician', { displayName: 'Marco R.', email: 'marco@example.test', phone: '+639123456789' });
  assert.equal(updated.name, 'Marco Reyes');
  assert.equal(updated.displayName, 'Marco R.');
  assert.ok(state.presentation.users.every(user => !Object.hasOwn(user, 'password')));
  assert.throws(() => flow.inviteUser(state, admin, { email: 'new@example.test', displayName: 'New person', role: 'owner' }), /Technician/i);
  assert.match(flow.inviteUser(state, admin, { email: 'new@example.test', displayName: 'New technician' }).invitationStatus, /demo/i);
});

test('field rescheduling preserves estimates and commercial amounts', () => {
  const state = createDemo();
  const existing = state.visits.find(v => v.id === 'v4');
  const previous = structuredClone(existing);
  const visit = flow.scheduleDemoVisit(state, supervisor, { date: '2026-11-10', time: '10:00', rate: 1, plannedExpense: 0 }, 'v4');
  assert.equal(visit.id, 'v4');
  assert.equal(visit.rate, previous.rate);
  assert.equal(visit.plannedExpense, previous.plannedExpense);
  assert.deepEqual(visit.estimatedProducts, previous.estimatedProducts);
});

test('local proof, reminder failure/retry and rate approval retain review history', () => {
  const state = createDemo(), admin = { id: 'admin' };
  const invoice = state.invoices.find(i => i.paid < i.amount);
  const payment = flow.recordPaymentDraft(state, admin, invoice.id, { amount: 100, method: 'Cash', reference: 'PROOF', proof: { name: 'proof.png', size: 3, type: 'image/png', dataUrl: 'data:image/png;base64,YWJj' } });
  assert.equal(payment.proof.dataUrl, 'data:image/png;base64,YWJj');
  assert.throws(() => flow.recordPaymentDraft(state, admin, invoice.id, { amount: 100, method: 'Cash', reference: 'BAD', proof: { name: 'x.svg', size: 3, type: 'image/svg+xml', dataUrl: 'data:image/svg+xml;base64,YWJj' } }), /valid image/i);
  const reminder = flow.configureReminder(state, admin, invoice.id, { date: '2026-11-10', time: '09:00' });
  flow.runReminder(state, admin, reminder.id, { outcome: 'failed', reason: 'Simulated disconnected service' });
  flow.runReminder(state, admin, reminder.id);
  assert.deepEqual(state.presentation.reminders[0].logs.map(log => log.outcome), ['failed', 'sent']);
  assert.ok(state.presentation.reminders[0].logs.every(log => log.simulated));
  const request = flow.requestRateChange(state, admin, { serviceId: 's1', requestedRate: 4700, reason: 'Proposed revised standard rate' });
  assert.equal(state.services[0].price, 4500);
  assert.throws(() => flow.reviewRateChange(state, admin, request.id, 'Approved'));
  flow.reviewRateChange(state, owner, request.id, 'Approved');
  assert.equal(state.services[0].price, 4700);
});

test('team configuration, stock requests and client lifecycle keep non-destructive history', () => {
  const state = createDemo(), admin = { id: 'admin' };
  const stock = state.materials[0].stock;
  const request = flow.requestStock(state, supervisor, 'm1', 50, 'Additional assigned stock required');
  assert.equal(request.status, 'Requested');
  assert.equal(state.materials[0].stock, stock);
  assert.throws(() => flow.restockDemo(state, supervisor, 'm1', 50), /role/i);
  flow.restockDemo(state, admin, 'm1', 50);
  assert.equal(state.materials[0].stock, stock + 50);
  assert.equal(state.presentation.movements.at(-1).quantity, 50);
  assert.throws(() => flow.configureTeamProfile(state, admin, 't1', { memberNames: ['Marco Reyes'], branchIds: ['c1'] }), /role/i);
  flow.configureTeamProfile(state, owner, 't1', { name: 'North team', memberNames: ['Marco Reyes', 'Paolo Santos'], branchIds: ['c1', 'c2'] });
  const count = state.clients.length;
  assert.throws(() => flow.setClientStatus(state, admin, 'c1', 'Archived', ''), /reason/i);
  flow.setClientStatus(state, admin, 'c1', 'Archived', 'Agreement ended');
  assert.equal(state.clients.length, count);
  assert.equal(state.presentation.clients.c1.history.length, 1);
  assert.equal(validateState(state), true);
});

test('ocular self-review is blocked and disabled profiles cannot mutate work', () => {
  const state = createDemo();
  flow.updateUser(state, owner, 'technician', { role: 'supervisor', teamId: 't1' });
  const assessment = flow.submitAssessment(state, tech, { clientId: 'c2', date: '2026-11-05', time: '09:00', assessor: 'Marco Reyes', findings: [{ location: 'Kitchen', problem: 'Cockroach activity', serviceId: 's3', materialIds: ['m2'], notes: '' }], notes: '' });
  assert.throws(() => flow.reviewAssessment(state, tech, assessment.id, 'Approved'), /own/i);
  flow.reviewAssessment(state, owner, assessment.id, 'Approved');
  flow.updateUser(state, owner, 'technician', { active: false });
  const before = structuredClone(state);
  assert.throws(() => flow.saveAssessmentDraft(state, tech, { notes: 'Disabled' }), /active/i);
  assert.deepEqual(state, before);
});

test('amended service charge stays staged until approval and rejects invalid or collected amounts', () => {
  const state = createDemo();
  const report = flow.submitReport(state, tech, 'v4', values);
  flow.reviewReport(state, owner, report.id, 'Approved');
  const captured = report.actualRevenue;
  const invoiceId = state.invoices.find(i => i.visitId === 'v4').id;
  const pendingPayment = flow.recordPaymentDraft(state, owner, invoiceId, { amount: 100, method: 'Cash' });
  flow.beginAmendment(state, owner, report.id, 'Review revised service charge');
  for (const actualRevenue of [NaN, Infinity, -1, '7500']) assert.throws(() => flow.submitReport(state, owner, 'v4', { ...values, actualRevenue }));
  flow.submitReport(state, owner, 'v4', { ...values, actualRevenue: 7500 });
  assert.equal(state.reports.find(r => r.id === report.id).actualRevenue, captured);
  assert.equal(state.invoices.find(i => i.id === invoiceId).amount, captured);
  assert.equal(flow.reportMeta(state, report.id).pendingRevenue, 7500);
  assert.throws(() => flow.verifyPayment(state, owner, pendingPayment.id), /approved/i);
  flow.reviewReport(state, owner, report.id, 'Returned', 'Field details need correction');
  flow.submitReport(state, tech, 'v4', { ...values, findings: 'Corrected details' });
  assert.equal(flow.reportMeta(state, report.id).pendingRevenue, 7500);
  flow.reviewReport(state, owner, report.id, 'Approved');
  assert.equal(state.reports.find(r => r.id === report.id).actualRevenue, 7500);
  assert.equal(state.invoices.find(i => i.id === invoiceId).amount, 7500);
  assert.equal(flow.reportMeta(state, report.id).pendingRevenue, undefined);
  assert.equal(validateState(state), true);
});

test('expense claim author stays fixed while co-personnel corrections preserve another claim', () => {
  const state = createDemo();
  flow.ensurePresentation(state);
  state.presentation.jobs.v4.personnel = ['Marco Reyes', 'Paolo Santos'];
  const report = flow.submitReport(state, owner, 'v4', { ...values, expense: 400 });
  assert.equal(flow.reportMeta(state, report.id).expenseOwnerId, 'owner');
  assert.equal(flow.canReadExpense(state, tech, report), false);
  flow.reviewReport(state, supervisor, report.id, 'Returned', 'Correct findings');
  const draft = flow.saveReportDraft(state, tech, 'v4', { findings: 'New findings', expense: 0 });
  assert.equal(Object.hasOwn(draft.values, 'expense'), false);
  flow.submitReport(state, tech, 'v4', { ...values, expense: 1 });
  assert.equal(state.reports.find(r => r.id === report.id).expense, 400);
  assert.equal(flow.reportMeta(state, report.id).expenseOwnerId, 'owner');
  assert.equal(flow.canReadExpense(state, owner, report), true);
  assert.equal(flow.canReadExpense(state, supervisor, report), true);
  assert.equal(flow.canReadExpense(state, supervisor2, report), false);
  const legacy = state.reports.find(r => r.technician === 'Marco Reyes' && r.id !== report.id);
  assert.equal(flow.canReadExpense(state, tech, legacy), true);
});

test('report drafts remain author-owned across Owner intervention', () => {
  const state = createDemo();
  flow.saveReportDraft(state, owner, 'v4', { ...values, expense: 999 });
  const before = structuredClone(state);
  assert.throws(() => flow.saveReportDraft(state, tech, 'v4', { expense: 1 }), /own.*draft/i);
  assert.throws(() => flow.submitReport(state, tech, 'v4', values), /own.*draft/i);
  assert.deepEqual(state, before);
  delete state.presentation.drafts.v4;
  flow.saveReportDraft(state, tech, 'v4', values);
  flow.saveReportDraft(state, owner, 'v4', { findings: 'Owner clarified notes' });
  assert.equal(state.presentation.drafts.v4.actorId, 'technician');
  assert.equal(state.presentation.drafts.v4.updatedBy, 'owner');
  flow.submitReport(state, tech, 'v4', values);
});

test('Supervisor scheduling cannot attach personnel from another team', () => {
  const state = createDemo();
  const input = { clientId: 'c2', date: '2026-11-12', time: '09:00', serviceId: 's1', technician: 'Marco Reyes', personnel: ['Marco Reyes', 'Luis Mendoza'], rate: 6500 };
  const before = structuredClone(state);
  assert.throws(() => flow.scheduleDemoVisit(state, supervisor, input), /team/i);
  assert.deepEqual(state, before);
  flow.scheduleDemoVisit(state, owner, input);
});

test('Owner confirms explicit legacy financials without inventing approval or creating billing', () => {
  const state = createDemo();
  const report = state.reports[0];
  report.financialsConfirmed = false;
  state.invoices = state.invoices.filter(i => i.visitId !== report.visitId);
  const stock = structuredClone(state.materials), invoiceCount = state.invoices.length;
  const input = { actualRevenue: 4800, products: report.products.map(line => ({ ...line, unitCost: 2.5 })) };
  const before = structuredClone(state);
  assert.throws(() => flow.confirmLegacyFinancials(state, { id: 'admin' }, report.id, input), /role/i);
  assert.throws(() => flow.confirmLegacyFinancials(state, owner, report.id, { products: input.products }), /explicit/i);
  assert.throws(() => flow.confirmLegacyFinancials(state, owner, report.id, { ...input, products: input.products.map(({ unitCost, ...line }) => line) }), /explicit/i);
  assert.deepEqual(state, before);
  flow.confirmLegacyFinancials(state, owner, report.id, input);
  const confirmed = state.reports.find(r => r.id === report.id), meta = flow.reportMeta(state, report.id);
  assert.equal(confirmed.financialsConfirmed, true);
  assert.equal(confirmed.actualRevenue, 4800);
  assert.equal(confirmed.products[0].unitCost, 2.5);
  assert.equal(meta.approvedBy, undefined);
  assert.equal(meta.approvalRef, undefined);
  assert.ok(meta.versions.length);
  assert.match(meta.history.at(-1).action, /legacy financials/i);
  assert.equal(state.invoices.length, invoiceCount);
  assert.deepEqual(state.materials, stock);
  assert.equal(validateState(state), true);
  const paidState = createDemo(), paidReport = paidState.reports[1];
  paidReport.financialsConfirmed = false;
  const paidBefore = structuredClone(paidState);
  assert.throws(() => flow.confirmLegacyFinancials(paidState, owner, paidReport.id, { actualRevenue: 1, products: paidReport.products }), /collected/i);
  assert.deepEqual(paidState, paidBefore);
});
