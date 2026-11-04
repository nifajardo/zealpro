import { STAFF } from './data.js';
import { uid, roundMoney, completeVisit, reviseReport, linkServicePayment, scheduleVisit, addAssessment, restock, recordPayment } from './model.js';
import { DEMO_USERS, DEFAULT_TEAMS, currentProfile, can, scopeWorkspace, assignedPersonnel } from './access.js';

const need = (condition, message) => { if (!condition) throw new Error(message); };
const now = () => new Date().toISOString();
const validText = (value, required = true) => typeof value === 'string' && value.length <= 2000 && (!required || value.trim().length > 0);
const reasonRequired = value => need(validText(value), 'Enter a reason (up to 2,000 characters).');
const validAmount = value => typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= 1e9;
const validPrice = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1e9;
const identity = actor => actor.id || actor.email || actor.name;

export function ensurePresentation(state) {
  const p = state.presentation ??= {};
  p.users ??= DEMO_USERS.map(({ password, ...profile }) => ({ ...profile, active: true, displayName: profile.name }));
  p.teams ??= structuredClone(DEFAULT_TEAMS);
  for (const key of ['jobs', 'reports', 'assessments', 'drafts', 'assessmentDrafts', 'clients']) p[key] ??= {};
  for (const key of ['movements', 'stockRequests', 'payments', 'reminders', 'rateRequests', 'audit']) p[key] ??= [];
  for (const visit of state.visits) p.jobs[visit.id] ??= { personnel: [visit.technician], history: [] };
  for (const report of state.reports) {
    const meta = p.reports[report.id] ??= { status: 'Approved', legacy: true, label: 'Legacy sample', history: [], versions: [] };
    meta.expenseOwnerId ??= meta.history.find(entry => entry.action === 'Submitted report')?.actorId ?? (meta.legacy ? null : meta.submittedBy) ?? p.users.find(user => user.name === report.technician)?.id ?? report.technician;
  }
  for (const assessment of state.assessments) p.assessments[assessment.id] ??= { status: 'Approved', legacy: true, label: 'Legacy sample', history: [], versions: [] };
  return p;
}

export const reportMeta = (state, id) => ensurePresentation(state).reports[id];
export const assessmentMeta = (state, id) => ensurePresentation(state).assessments[id];

export function canReadExpense(state, actor, report) {
  ensurePresentation(state);
  const user = currentProfile(state, actor);
  if (!user || !report || !scopeWorkspace(state, user).reports.some(row => row.id === report.id)) return false;
  return user.role === 'technician' ? state.presentation.reports[report.id]?.expenseOwnerId === identity(user) : can(user, 'costs');
}

function profile(state, actor, capability) {
  const user = currentProfile(state, actor);
  need(user && user.active !== false, 'Sign in with an active demo account.');
  if (capability) need(can(user, capability), 'This action is not available for your role.');
  return user;
}

function transaction(state, actor, capability, action) {
  const copy = structuredClone(state);
  ensurePresentation(copy);
  const user = profile(copy, actor, capability);
  const result = action(copy, user, copy.presentation);
  Object.assign(state, copy);
  return result;
}

function event(state, user, entityId, action, reason = '') {
  const entry = { id: uid('event'), entityId, action, actorId: identity(user), actorName: user.displayName || user.name, role: user.role, at: now(), reason };
  state.presentation.audit.push(entry);
  return entry;
}

function visitFor(state, user, id) {
  const visit = state.visits.find(v => v.id === id);
  need(visit && scopeWorkspace(state, user).visits.some(v => v.id === id), 'This visit is outside your assigned work.');
  return visit;
}

function reviewer(state, user, visit) {
  need(can(user, 'approveReports'), 'This role cannot approve field reports.');
  visitFor(state, user, visit.id);
  need(user.role === 'owner' || !assignedPersonnel(state, visit).includes(user.name), 'A performing Supervisor cannot review their own or co-performed work.');
}

function reportInput(state, user, visit, input, report) {
  const values = structuredClone(input);
  if (!can(user, 'commercial')) values.actualRevenue = (report && state.presentation.reports[report.id]?.pendingRevenue) ?? report?.actualRevenue ?? visit.rate;
  if (report && user.role === 'technician' && !canReadExpense(state, user, report)) values.expense = report.expense;
  values.products = (values.products || []).map(({ productId, quantity }) => ({ productId, quantity,
    unitCost: report?.products.find(p => p.productId === productId)?.unitCost ?? state.materials.find(p => p.id === productId)?.cost }));
  return values;
}

function version(meta, record, action) {
  meta.versions.push({ at: now(), action, record: structuredClone(record), ...(meta.pendingRevenue !== undefined ? { pendingRevenue: meta.pendingRevenue } : {}) });
}

export function jobStatus(state, visit) {
  const p = ensurePresentation(state), job = p.jobs[visit.id];
  if (job.status === 'Cancelled') return 'Cancelled';
  const report = state.reports.find(r => r.visitId === visit.id);
  if (report) return p.reports[report.id].status === 'Approved' ? 'Completed' : p.reports[report.id].status;
  if (p.drafts[visit.id]) return 'Draft';
  return visit.status === 'In progress' ? 'In progress' : (job.personnel.length ? 'Assigned' : 'Scheduled');
}

export function approvedWorkspace(state) {
  const copy = structuredClone(state), p = ensurePresentation(copy);
  copy.visits = copy.visits.filter(v => p.jobs[v.id].status !== 'Cancelled');
  copy.reports = copy.reports.filter(r => p.reports[r.id]?.status === 'Approved' && copy.visits.some(v => v.id === r.visitId));
  copy.assessments = copy.assessments.filter(a => p.assessments[a.id]?.status === 'Approved');
  copy.invoices = copy.invoices.filter(i => !i.visitId || copy.reports.some(r => r.visitId === i.visitId));
  return copy;
}

export function saveReportDraft(state, actor, visitId, values) {
  return transaction(state, actor, 'submitReports', (copy, user, p) => {
    const visit = visitFor(copy, user, visitId), report = copy.reports.find(r => r.visitId === visitId);
    need(p.jobs[visitId].status !== 'Cancelled', 'Cancelled work cannot receive a report.');
    need(!report || p.reports[report.id].status === 'Returned', 'This report is submitted or approved and locked.');
    need(!p.drafts[visitId] || user.role === 'owner' || p.drafts[visitId].actorId === identity(user), 'Only your own report drafts may be changed.');
    const input = reportInput(copy, user, visit, { ...p.drafts[visitId]?.values, ...values }, report);
    if (report && user.role === 'technician' && !canReadExpense(copy, user, report)) delete input.expense;
    const entry = event(copy, user, visitId, 'Saved report draft');
    return p.drafts[visitId] = { values: input, updatedAt: entry.at, actorId: p.drafts[visitId]?.actorId ?? entry.actorId, updatedBy: entry.actorId };
  });
}

export function submitReport(state, actor, visitId, values) {
  return transaction(state, actor, 'submitReports', (copy, user, p) => {
    const visit = visitFor(copy, user, visitId), previous = copy.reports.find(r => r.visitId === visitId);
    need(p.jobs[visitId].status !== 'Cancelled', 'Cancelled work cannot receive a report.');
    need(!previous || p.reports[previous.id].status === 'Returned', 'This report is submitted or approved and locked; request an amendment.');
    need(!p.drafts[visitId] || user.role === 'owner' || p.drafts[visitId].actorId === identity(user), 'Only your own report drafts may be submitted.');
    const input = reportInput(copy, user, visit, { ...p.drafts[visitId]?.values, ...values }, previous);
    const oldProducts = structuredClone(previous?.products || []);
    let report;
    if (previous) {
      const meta = p.reports[previous.id], invoice = copy.invoices.find(i => i.visitId === visitId);
      version(meta, previous, 'Before correction');
      if (invoice) {
        const requested = input.actualRevenue ?? meta.pendingRevenue ?? previous.actualRevenue;
        need(validPrice(requested), 'Enter a valid finite non-negative actual service charge.');
        need(roundMoney(requested) >= invoice.paid, 'The revised service charge cannot be less than the amount already collected.');
        meta.pendingRevenue = roundMoney(requested);
        input.actualRevenue = previous.actualRevenue;
      }
      report = reviseReport(copy, previous.id, input);
    } else {
      const invoices = new Set(copy.invoices.map(i => i.id));
      report = completeVisit(copy, visitId, input);
      copy.invoices = copy.invoices.filter(i => invoices.has(i.id) || i.visitId !== visitId);
      p.reports[report.id] = { status: 'Submitted', history: [], versions: [], expenseOwnerId: identity(user) };
    }
    const meta = p.reports[report.id];
    meta.status = 'Submitted';
    meta.submittedBy = identity(user);
    meta.submittedAt = now();
    meta.history.push(event(copy, user, report.id, previous ? 'Submitted corrected report' : 'Submitted report'));
    for (const productId of new Set([...oldProducts, ...report.products].map(line => line.productId))) {
      const quantity = (oldProducts.find(l => l.productId === productId)?.quantity || 0) - (report.products.find(l => l.productId === productId)?.quantity || 0);
      if (quantity) p.movements.push({ id: uid('movement'), productId, quantity, type: previous ? 'Correction' : 'Consumption', visitId, actorId: identity(user), at: now() });
    }
    version(meta, report, 'Submitted');
    delete p.drafts[visitId];
    return report;
  });
}

export function reviewReport(state, actor, reportId, decision, reason = '') {
  return transaction(state, actor, 'approveReports', (copy, user, p) => {
    need(['Approved', 'Returned'].includes(decision), 'Choose Approve or Return for correction.');
    const report = copy.reports.find(r => r.id === reportId);
    need(report, 'Report was not found.');
    const visit = copy.visits.find(v => v.id === report.visitId), meta = p.reports[reportId];
    reviewer(copy, user, visit);
    if (meta.status === 'Approved' && decision === 'Approved') return meta;
    need(meta.status === 'Submitted', 'Only submitted reports can be reviewed.');
    if (decision === 'Returned') reasonRequired(reason);
    if (decision === 'Approved' && meta.pendingRevenue !== undefined) {
      const invoice = copy.invoices.find(i => i.visitId === visit.id);
      need(validPrice(meta.pendingRevenue) && (!invoice || meta.pendingRevenue >= invoice.paid), 'The staged service charge must be valid and cover the amount already collected.');
      report.actualRevenue = roundMoney(meta.pendingRevenue);
      if (invoice) invoice.amount = report.actualRevenue;
      delete meta.pendingRevenue;
    }
    version(meta, report, decision);
    meta.status = decision;
    meta.history.push(event(copy, user, reportId, decision === 'Approved' ? 'Approved & finalized report' : 'Returned report for correction', reason));
    if (decision === 'Approved') {
      if (!copy.invoices.some(i => i.visitId === visit.id)) linkServicePayment(copy, visit.id);
      meta.approvedBy = identity(user);
      meta.approvedAt = now();
      meta.approvalRef = uid('APP');
      meta.approvals ??= [];
      meta.approvals.push({ reference: meta.approvalRef, actorId: identity(user), at: meta.approvedAt });
    }
    return meta;
  });
}

export function beginAmendment(state, actor, reportId, reason) {
  return transaction(state, actor, 'approveReports', (copy, user, p) => {
    reasonRequired(reason);
    const report = copy.reports.find(r => r.id === reportId);
    need(report, 'Report was not found.');
    reviewer(copy, user, copy.visits.find(v => v.id === report.visitId));
    const meta = p.reports[reportId];
    need(meta.status === 'Approved', 'Only approved reports need an authorized amendment.');
    version(meta, report, 'Approved version before amendment');
    meta.status = 'Returned';
    meta.history.push(event(copy, user, reportId, 'Authorized report amendment', reason));
    return meta;
  });
}

export function confirmLegacyFinancials(state, actor, reportId, values) {
  return transaction(state, actor, 'finance', (copy, user, p) => {
    const report = copy.reports.find(row => row.id === reportId), meta = p.reports[reportId];
    need(report && meta?.legacy && !report.financialsConfirmed, 'Choose an unconfirmed legacy report.');
    need(validPrice(values.actualRevenue) && Array.isArray(values.products) && values.products.every(line => validPrice(line?.unitCost)), 'Enter an explicit actual service charge and explicit unit cost for every product.');
    version(meta, report, 'Before legacy financial confirmation');
    const confirmed = reviseReport(copy, reportId, { ...report, ...values });
    meta.history.push(event(copy, user, reportId, 'Confirmed legacy financials'));
    version(meta, confirmed, 'Legacy financials confirmed');
    return confirmed;
  });
}

export function scheduleDemoVisit(state, actor, values, id = '') {
  return transaction(state, actor, 'schedule', (copy, user, p) => {
    const previous = id ? visitFor(copy, user, id) : null;
    need(!id || previous, 'Visit was not found.');
    need(!previous || (previous.status !== 'Completed' && p.jobs[id].status !== 'Cancelled'), 'Posted or cancelled work cannot be rescheduled.');
    const input = { ...previous, ...values };
    if (previous && values.products === undefined) input.products = previous.estimatedProducts.map(({ productId, quantity }) => ({ productId, quantity }));
    if (!can(user, 'commercial')) {
      input.rate = previous?.rate ?? copy.clients.find(c => c.id === input.clientId)?.rate;
      input.plannedExpense = previous?.plannedExpense ?? copy.services.find(s => s.id === input.serviceId)?.plannedExpense;
    }
    const personnel = [...new Set(values.personnel ?? p.jobs[id]?.personnel ?? [input.technician])];
    need(personnel.length > 0 && personnel.length <= STAFF.length && personnel.every(name => STAFF.includes(name)) && personnel.includes(input.technician), 'Choose a lead technician and valid personnel.');
    need(personnel.every(name => !p.users.some(u => u.name === name && u.active === false)), 'Inactive personnel cannot be assigned.');
    const candidate = { ...input, id: id || 'pending-visit' };
    const oldJob = p.jobs[candidate.id];
    p.jobs[candidate.id] = { personnel };
    if (user.role === 'supervisor') {
      const team = p.teams.find(row => row.id === user.teamId);
      need(personnel.every(name => team?.memberNames.includes(name)), 'Schedule personnel from your assigned team only.');
      const trial = { ...copy, visits: [...copy.visits.filter(v => v.id !== id), candidate] };
      need(scopeWorkspace(trial, user).visits.some(v => v.id === candidate.id), 'Schedule within your assigned team and branches.');
    }
    const minutes = time => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
    need(!copy.visits.some(v => v.id !== id && p.jobs[v.id]?.status !== 'Cancelled' && v.date === input.date && Math.abs(minutes(v.time) - minutes(input.time)) < 60 && assignedPersonnel(copy, v).some(name => personnel.includes(name))), 'A selected staff member has a conflict within this hour.');
    const retained = copy.visits.filter(v => v.id === id || p.jobs[v.id]?.status === 'Cancelled');
    copy.visits = copy.visits.filter(v => v.id !== id && p.jobs[v.id]?.status !== 'Cancelled');
    const visit = scheduleVisit(copy, input);
    copy.visits.push(...retained.filter(v => v.id !== id));
    if (id) visit.id = id;
    if (!id) delete p.jobs[candidate.id];
    p.jobs[visit.id] = { ...oldJob, personnel, history: [...(oldJob?.history || []), event(copy, user, visit.id, previous ? 'Rescheduled visit' : 'Scheduled visit')] };
    return visit;
  });
}

export function cancelDemoVisit(state, actor, id, reason) {
  return transaction(state, actor, 'schedule', (copy, user, p) => {
    reasonRequired(reason);
    const visit = visitFor(copy, user, id), job = p.jobs[id];
    need(visit.status !== 'Completed' && !copy.reports.some(r => r.visitId === id), 'Posted actual consumption cannot be erased by cancellation.');
    if (job.status === 'Cancelled') return visit;
    job.cancelledSnapshot = structuredClone(visit);
    job.status = 'Cancelled';
    job.reason = reason;
    job.history ??= [];
    job.history.push(event(copy, user, id, 'Cancelled visit; released reservations', reason));
    visit.status = 'Scheduled';
    visit.estimatedProducts = [];
    delete p.drafts[id];
    return visit;
  });
}

function assessmentInput(state, user, values) {
  const input = structuredClone(values);
  if (user.role === 'technician') input.assessor = user.name;
  if (['technician', 'supervisor'].includes(user.role) && input.clientId) need(scopeWorkspace(state, user).clients.some(c => c.id === input.clientId), 'Choose an assigned branch.');
  if (user.role === 'supervisor' && input.assessor) {
    const team = state.presentation.teams.find(t => t.id === user.teamId);
    need(input.assessor === user.name || team?.memberNames.includes(input.assessor), 'Choose an assessor from your assigned team.');
  }
  return input;
}

export function saveAssessmentDraft(state, actor, values, id = '') {
  return transaction(state, actor, null, (copy, user, p) => {
    need(['owner', 'admin', 'supervisor', 'technician'].includes(user.role), 'This role cannot record assessments.');
    const key = id || uid('ocular-draft'), meta = p.assessments[key];
    need(!meta || ['Draft', 'Returned'].includes(meta.status), 'This assessment is submitted or approved and locked.');
    need(!p.assessmentDrafts[key] || ['owner', 'admin'].includes(user.role) || p.assessmentDrafts[key].actorId === identity(user), 'Only your own assessment drafts may be changed.');
    const existing = copy.assessments.find(a => a.id === key);
    if (existing) need(scopeWorkspace(copy, user).assessments.some(a => a.id === key), 'This assessment is outside your work.');
    const input = assessmentInput(copy, user, { ...existing, ...p.assessmentDrafts[key]?.values, ...values });
    p.assessments[key] ??= { status: 'Draft', history: [], versions: [] };
    const entry = event(copy, user, key, 'Saved assessment draft');
    p.assessments[key].history.push(entry);
    return p.assessmentDrafts[key] = { id: key, ...input, values: input, status: p.assessments[key].status, actorId: identity(user), updatedAt: entry.at };
  });
}

export function submitAssessment(state, actor, values, id = '') {
  return transaction(state, actor, null, (copy, user, p) => {
    need(['owner', 'admin', 'supervisor', 'technician'].includes(user.role), 'This role cannot submit assessments.');
    const existing = id ? copy.assessments.find(a => a.id === id) : null, meta = p.assessments[id];
    need(!meta || ['Draft', 'Returned'].includes(meta.status), 'This assessment is submitted or approved and locked.');
    need(!p.assessmentDrafts[id] || ['owner', 'admin'].includes(user.role) || p.assessmentDrafts[id].actorId === identity(user), 'Only your own assessment drafts may be submitted.');
    if (existing) need(scopeWorkspace(copy, user).assessments.some(a => a.id === id), 'This assessment is outside your work.');
    const input = assessmentInput(copy, user, { ...existing, ...p.assessmentDrafts[id]?.values, ...values });
    need(!existing?.clientId || !values.clientId || existing.clientId === values.clientId, 'A linked assessment cannot move to another branch.');
    const assessment = addAssessment(copy, input);
    if (id) {
      copy.assessments = copy.assessments.filter(a => a.id !== id);
      assessment.id = id;
    }
    const next = p.assessments[assessment.id] = meta || { history: [], versions: [] };
    if (existing) version(next, existing, 'Before correction');
    next.status = 'Submitted';
    next.submittedBy = identity(user);
    next.history.push(event(copy, user, assessment.id, 'Submitted assessment'));
    version(next, assessment, 'Submitted');
    delete p.assessmentDrafts[id];
    return assessment;
  });
}

export function reviewAssessment(state, actor, id, decision, reason = '') {
  return transaction(state, actor, 'approveReports', (copy, user, p) => {
    const assessment = copy.assessments.find(a => a.id === id), meta = p.assessments[id];
    need(assessment && scopeWorkspace(copy, user).assessments.some(a => a.id === id), 'This assessment is outside your work.');
    need(user.role === 'owner' || (assessment.assessor !== user.name && meta.submittedBy !== identity(user)), 'A performing Supervisor cannot approve their own assessment.');
    need(['Approved', 'Returned'].includes(decision), 'Choose Approve or Return for correction.');
    if (meta.status === 'Approved' && decision === 'Approved') return meta;
    need(meta.status === 'Submitted', 'Only submitted assessments can be reviewed.');
    if (decision === 'Returned') reasonRequired(reason);
    meta.status = decision;
    meta.history.push(event(copy, user, id, decision === 'Approved' ? 'Approved assessment' : 'Returned assessment', reason));
    if (decision === 'Approved') { meta.approvedBy = identity(user); meta.approvedAt = now(); meta.approvalRef = uid('OAPP'); }
    return meta;
  });
}

export function restockDemo(state, actor, id, quantity) {
  return transaction(state, actor, 'restock', (copy, user, p) => {
    restock(copy, id, quantity);
    const movement = { id: uid('movement'), productId: id, quantity, type: 'Restock', actorId: identity(user), at: now() };
    p.movements.push(movement);
    event(copy, user, id, 'Restocked inventory');
    return movement;
  });
}

export function requestStock(state, actor, id, quantity, reason) {
  return transaction(state, actor, 'requestStock', (copy, user, p) => {
    reasonRequired(reason);
    const product = scopeWorkspace(copy, user).materials.find(m => m.id === id);
    need(product && validAmount(quantity) && (product.unit !== 'pcs' || Number.isSafeInteger(quantity)), 'Choose an assigned product and valid positive quantity.');
    const request = { id: uid('stock-request'), productId: id, quantity, reason, status: 'Requested', actorId: identity(user), at: now() };
    p.stockRequests.push(request);
    event(copy, user, request.id, 'Requested stock adjustment', reason);
    return request;
  });
}

export function recordPaymentDraft(state, actor, invoiceId, values) {
  return transaction(state, actor, 'commercial', (copy, user, p) => {
    const invoice = copy.invoices.find(i => i.id === invoiceId);
    need(invoice && (!invoice.visitId || p.reports[copy.reports.find(r => r.visitId === invoice.visitId)?.id]?.status === 'Approved'), 'New billing requires an approved service report.');
    const reference = values.reference?.trim() || 'No reference supplied (demo)';
    const validation = structuredClone(copy);
    recordPayment(validation, invoiceId, values.amount, values.method, reference);
    let proof;
    if (values.proof) {
      need(validText(values.proof.name) && Number.isSafeInteger(values.proof.size) && values.proof.size >= 0 && validText(values.proof.type, false), 'Enter valid proof file metadata.');
      proof = { name: values.proof.name, size: values.proof.size, type: values.proof.type };
      if (values.proof.dataUrl) {
        need(typeof values.proof.dataUrl === 'string', 'Enter valid proof file data.');
        const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf'];
        const prefix = `data:${proof.type};base64,`;
        const encoded = values.proof.dataUrl.slice(prefix.length);
        need(allowed.includes(proof.type) && values.proof.dataUrl.startsWith(prefix) && /^[A-Za-z0-9+/]*={0,2}$/.test(encoded) && encoded.length <= 1398104 && proof.size <= 1048576 && atob(encoded).length === proof.size, 'Attach a valid image or PDF proof up to 1 MB.');
        proof.dataUrl = values.proof.dataUrl;
      }
    }
    const payment = { id: uid('payment'), invoiceId, amount: roundMoney(values.amount), method: values.method, reference, ...(proof ? { proof } : {}), status: 'Pending', createdAt: now(), actorId: identity(user), history: [] };
    payment.history.push(event(copy, user, payment.id, 'Recorded pending payment'));
    p.payments.push(payment);
    return payment;
  });
}

export function verifyPayment(state, actor, paymentId) {
  return transaction(state, actor, 'collect', (copy, user, p) => {
    const payment = p.payments.find(row => row.id === paymentId);
    need(payment, 'Payment was not found.');
    if (payment.status === 'Verified') return payment;
    need(payment.status === 'Pending', 'Only pending payments can be verified.');
    const bill = copy.invoices.find(i => i.id === payment.invoiceId);
    need(bill && (!bill.visitId || p.reports[copy.reports.find(r => r.visitId === bill.visitId)?.id]?.status === 'Approved'), 'Payment verification requires an approved service report.');
    recordPayment(copy, payment.invoiceId, payment.amount, payment.method, payment.reference);
    const invoice = copy.invoices.find(i => i.id === payment.invoiceId);
    invoice.payments.at(-1).presentationId = payment.id;
    payment.status = 'Verified';
    payment.verifiedAt = now();
    payment.history.push(event(copy, user, payment.id, 'Verified payment'));
    return payment;
  });
}

export function voidPayment(state, actor, paymentId, reason) {
  return transaction(state, actor, 'manageUsers', (copy, user, p) => {
    reasonRequired(reason);
    const payment = p.payments.find(row => row.id === paymentId);
    need(payment, 'Payment was not found.');
    if (payment.status === 'Voided') return payment;
    need(payment.status === 'Verified', 'Only verified payments can be reversed.');
    const invoice = copy.invoices.find(i => i.id === payment.invoiceId);
    need(invoice && invoice.paid >= payment.amount, 'Payment history does not reconcile; review before reversing.');
    invoice.paid = roundMoney(invoice.paid - payment.amount);
    const original = invoice.payments.find(row => row.presentationId === payment.id);
    if (original) { original.voidedAt = now(); original.voidReason = reason; }
    payment.status = 'Voided';
    payment.voidReason = reason;
    payment.history.push(event(copy, user, payment.id, 'Voided verified payment', reason));
    return payment;
  });
}

export function configureReminder(state, actor, invoiceId, values) {
  return transaction(state, actor, 'commercial', (copy, user, p) => {
    need(copy.invoices.some(i => i.id === invoiceId), 'Invoice was not found.');
    need(typeof values.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(values.date) && !Number.isNaN(Date.parse(values.date)) && new Date(`${values.date}T00:00:00Z`).toISOString().slice(0, 10) === values.date && /^([01]\d|2[0-3]):[0-5]\d$/.test(values.time), 'Choose a valid reminder date and time.');
    let reminder = p.reminders.find(r => r.invoiceId === invoiceId);
    if (!reminder) { reminder = { id: uid('reminder'), invoiceId, logs: [] }; p.reminders.push(reminder); }
    Object.assign(reminder, { date: values.date, time: values.time, enabled: values.enabled !== false, channel: 'Email simulation' });
    event(copy, user, reminder.id, 'Configured simulated reminder');
    return reminder;
  });
}

export function runReminder(state, actor, id, outcome = 'sent') {
  return transaction(state, actor, 'commercial', (copy, user, p) => {
    const reminder = p.reminders.find(r => r.id === id);
    need(reminder?.enabled, 'Enable a reminder schedule first.');
    const result = typeof outcome === 'object' ? outcome.outcome : outcome;
    need(['sent', 'failed'].includes(result), 'Choose a simulation delivery outcome.');
    const invoice = copy.invoices.find(i => i.id === reminder.invoiceId);
    const log = { at: now(), outcome: invoice.amount <= invoice.paid ? 'skipped' : result, reason: invoice.amount <= invoice.paid ? 'Invoice already paid' : (typeof outcome === 'object' && validText(outcome.reason) ? outcome.reason : result === 'failed' ? 'Simulated delivery failure; retry available' : 'Demo only; no email sent'), simulated: true };
    reminder.logs.push(log);
    event(copy, user, reminder.id, 'Ran simulated reminder', log.reason);
    return log;
  });
}

export function updateUser(state, actor, id, values) {
  return transaction(state, actor, null, (copy, user, p) => {
    need(['owner', 'admin'].includes(user.role), 'Only office roles may maintain profiles.');
    const target = p.users.find(u => u.id === id);
    need(target, 'Profile was not found.');
    const protectedKeys = ['role', 'active', 'teamId', 'branchIds', 'canCollect'];
    need(user.role === 'owner' || !protectedKeys.some(key => Object.hasOwn(values, key)), 'Only the Owner may change roles, status, assignment or collection delegation.');
    const patch = {};
    for (const key of ['displayName', 'phone', 'email']) if (Object.hasOwn(values, key)) {
      need(validText(values[key], key !== 'phone'), 'Enter valid profile details.');
      patch[key] = values[key].trim();
    }
    if (patch.email) {
      need(/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(patch.email), 'Enter a valid email address.');
      patch.email = patch.email.toLowerCase();
      need(!p.users.some(u => u.id !== id && u.email === patch.email), 'This email is already assigned.');
    }
    if (user.role === 'owner') {
      for (const key of protectedKeys) if (Object.hasOwn(values, key)) patch[key] = structuredClone(values[key]);
      need(!patch.role || ['owner', 'admin', 'supervisor', 'technician'].includes(patch.role), 'Choose a supported role.');
      need(patch.active === undefined || typeof patch.active === 'boolean', 'Choose a valid active status.');
      need(patch.canCollect === undefined || typeof patch.canCollect === 'boolean', 'Choose a valid collection delegation.');
      need(patch.teamId === undefined || patch.teamId === '' || p.teams.some(t => t.id === patch.teamId), 'Choose an existing team.');
      if (patch.branchIds) need(Array.isArray(patch.branchIds) && patch.branchIds.every(branch => copy.clients.some(c => c.id === branch)), 'Choose existing branches.');
      const next = { ...target, ...patch };
      need(next.role !== 'owner' || next.active !== false || p.users.some(u => u.id !== id && u.role === 'owner' && u.active !== false), 'The last active Owner cannot be deactivated.');
      need(target.role !== 'owner' || (next.role === 'owner' && next.active !== false) || p.users.some(u => u.id !== id && u.role === 'owner' && u.active !== false), 'The last active Owner cannot be removed.');
    }
    Object.assign(target, patch);
    event(copy, user, id, 'Updated user profile');
    return target;
  });
}

export function inviteUser(state, actor, values) {
  return transaction(state, actor, 'invite', (copy, user, p) => {
    need(validText(values.email) && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(values.email) && validText(values.displayName || values.name), 'Enter an invitation name and valid email.');
    const role = values.role || 'technician';
    need(['owner', 'admin', 'supervisor', 'technician'].includes(role) && (user.role === 'owner' || role === 'technician'), 'Administrators may prepare Technician invitations only.');
    const email = values.email.trim().toLowerCase();
    need(!p.users.some(u => u.email === email), 'This email is already assigned.');
    const invite = { id: uid('invite'), email, name: values.displayName || values.name, displayName: values.displayName || values.name, role, active: false, invitationStatus: 'Prepared demo invitation', teamId: '', phone: '' };
    p.users.push(invite);
    event(copy, user, invite.id, 'Prepared demo invitation; no email sent');
    return invite;
  });
}

export function configureTeamProfile(state, actor, id, values) {
  return transaction(state, actor, 'manageUsers', (copy, user, p) => {
    const team = p.teams.find(t => t.id === id);
    need(team, 'Team was not found.');
    need(validText(values.name ?? team.name) && Array.isArray(values.memberNames) && values.memberNames.every(name => STAFF.includes(name)) && Array.isArray(values.branchIds) && values.branchIds.every(branch => copy.clients.some(c => c.id === branch)), 'Choose valid team personnel and branches.');
    Object.assign(team, { name: (values.name ?? team.name).trim(), memberNames: [...new Set(values.memberNames)], branchIds: [...new Set(values.branchIds)] });
    event(copy, user, id, 'Updated team assignments');
    return team;
  });
}

export function requestRateChange(state, actor, values) {
  return transaction(state, actor, 'commercial', (copy, user, p) => {
    reasonRequired(values.reason);
    const requestedRate = values.requestedRate ?? values.rate;
    need(copy.services.some(s => s.id === values.serviceId) && typeof requestedRate === 'number' && Number.isFinite(requestedRate) && requestedRate >= 0 && requestedRate <= 1e9, 'Choose a service and valid requested rate.');
    const request = { id: uid('rate-request'), serviceId: values.serviceId, requestedRate: roundMoney(requestedRate), reason: values.reason, status: 'Submitted', actorId: identity(user), at: now(), history: [] };
    request.history.push(event(copy, user, request.id, 'Requested rate change', values.reason));
    p.rateRequests.push(request);
    return request;
  });
}

export function reviewRateChange(state, actor, id, decision, reason = '') {
  return transaction(state, actor, 'manageUsers', (copy, user, p) => {
    const request = p.rateRequests.find(r => r.id === id);
    need(request && ['Approved', 'Returned'].includes(decision), 'Choose an existing rate request and decision.');
    need(request.status === 'Submitted', 'This rate request was already reviewed.');
    if (decision === 'Returned') reasonRequired(reason);
    if (decision === 'Approved') copy.services.find(s => s.id === request.serviceId).price = request.requestedRate;
    request.status = decision;
    request.history.push(event(copy, user, id, 'Reviewed rate request', reason));
    return request;
  });
}

export function setClientStatus(state, actor, id, status, reason = '') {
  return transaction(state, actor, 'commercial', (copy, user, p) => {
    need(copy.clients.some(c => c.id === id) && ['Draft', 'Active', 'Archived'].includes(status), 'Choose a client and valid lifecycle status.');
    if (status === 'Archived') reasonRequired(reason);
    const meta = p.clients[id] ??= { status: 'Active', history: [] };
    meta.status = status;
    meta.history.push(event(copy, user, id, `Client marked ${status}`, reason));
    return meta;
  });
}
