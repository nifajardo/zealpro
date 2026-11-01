import { STAFF, PROBLEMS, PESTS, seedServices, CALENDAR_VIEWS } from './data.js';

export const money = value => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(value);
export const uid = prefix => `${prefix}-${globalThis.crypto.randomUUID()}`;
export const roundMoney = value => Math.round((value + Number.EPSILON) * 100) / 100;
const validNumber = (value, minimum = 0) => typeof value === 'number' && Number.isFinite(value) && value >= minimum && value <= 1e9;
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
const validTime = value => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
const text = (value, required = true) => typeof value === 'string' && value.length <= 2000 && (!required || value.trim().length > 0);
const need = (condition, message) => { if (!condition) throw new Error(message); };

export function serviceDueDate(date) {
  need(validDate(date), 'Choose a valid service delivery date.');
  const due = new Date(`${date}T00:00:00Z`);
  due.setUTCDate(due.getUTCDate() + 30);
  const result = due.toISOString().slice(0, 10);
  need(validDate(result), 'Service due date falls outside the supported date range.');
  return result;
}

export function paymentSummary(invoice, asOf) {
  need(validDate(asOf), 'Choose a valid payment status date.');
  const balance = roundMoney(invoice.amount - invoice.paid);
  const days = Math.round((Date.parse(invoice.due) - Date.parse(asOf)) / 86400000);
  return { balance, status: balance === 0 ? 'Paid' : days < 0 ? 'Overdue' : invoice.paid > 0 ? 'Partially paid' : 'Unpaid',
    timing: balance === 0 ? 'Paid in full' : days < 0 ? `Overdue by ${-days} day${days === -1 ? '' : 's'}` : days === 0 ? 'Due today' : `Due in ${days} day${days === 1 ? '' : 's'}` };
}

function serviceInvoice(visit, report) {
  return { id: uid('INV'), visitId: visit.id, clientId: visit.clientId, date: report.date, due: serviceDueDate(report.date), amount: report.actualRevenue, paid: 0, treatment: report.treatment, payments: [] };
}

export function linkServicePayment(state, visitId, invoiceId = '') {
  const visit = state.visits.find(v => v.id === visitId);
  const report = state.reports.find(r => r.visitId === visitId);
  need(visit?.status === 'Completed' && report?.financialsConfirmed, 'Confirm the completed service report financials before linking payment.');
  need(!state.invoices.some(i => i.visitId === visitId), 'This service already has a linked payment record.');
  if (invoiceId) {
    const invoice = state.invoices.find(i => i.id === invoiceId);
    need(invoice && !invoice.visitId && invoice.clientId === visit.clientId && invoice.amount === report.actualRevenue, 'Choose a matching unlinked invoice for this client and service charge.');
    invoice.visitId = visitId;
    return invoice;
  }
  const invoice = serviceInvoice(visit, report);
  state.invoices.push(invoice);
  return invoice;
}

export function summary(state, date) {
  const visits = state.visits.filter(v => v.date === date);
  return { scheduled: visits.length, completed: visits.filter(v => v.status === 'Completed').length,
    projected: roundMoney(visits.reduce((total, v) => total + v.rate, 0)),
    receivable: roundMoney(state.invoices.reduce((total, i) => total + i.amount - i.paid, 0)) };
}

export function availableStock(state, materialId, excludedVisitId) {
  const material = state.materials.find(m => m.id === materialId);
  if (!material) return 0;
  const allocated = state.visits.filter(v => v.id !== excludedVisitId && v.status !== 'Completed').flatMap(v => v.estimatedProducts).filter(line => line.productId === materialId).reduce((sum, line) => sum + line.quantity, 0);
  return Math.round((material.stock - allocated) * 100) / 100;
}

export const productCost = lines => roundMoney(lines.reduce((total, line) => total + roundMoney(line.quantity * line.unitCost), 0));

function snapshotProducts(state, lines, { actual = false, previous = [] } = {}) {
  need(Array.isArray(lines) && lines.length <= 50, 'Enter up to 50 product lines.');
  need(new Set(lines.map(line => line?.productId)).size === lines.length, 'Each product may appear only once. Combine duplicate quantities.');
  return lines.map(line => {
    const product = state.materials.find(p => p.id === line?.productId);
    need(product && (product.active || previous.some(p => p.productId === product.id)), 'Choose an active product.');
    need(validNumber(line.quantity, 0.01) && (product.unit !== 'pcs' || Number.isSafeInteger(line.quantity)), 'Product quantities must be positive; pieces must be whole numbers.');
    const old = previous.find(p => p.productId === product.id);
    const cost = actual ? (line.unitCost ?? old?.unitCost ?? product.cost) : product.cost;
    need(validNumber(cost), 'Enter a valid non-negative unit cost.');
    return { productId: product.id, quantity: line.quantity, name: old?.name ?? product.name, unit: old?.unit ?? product.unit, unitCost: roundMoney(cost) };
  });
}

export function saveService(state, input, id) {
  need(text(input.name) && input.name.trim().length <= 100 && text(input.description), 'Enter a service name and description.');
  need(validNumber(input.price) && validNumber(input.plannedExpense), 'Enter valid service pricing and planned expenses.');
  need(!state.services.some(s => s.id !== id && s.name.toLowerCase() === input.name.trim().toLowerCase()), 'A service with this name already exists.');
  const existing = id ? state.services.find(s => s.id === id) : null;
  need(!id || existing, 'Service was not found.');
  const products = snapshotProducts(state, input.products, { previous: existing && !existing.active ? existing.products : [] }).map(({ productId, quantity }) => ({ productId, quantity }));
  const values = { name: input.name.trim(), description: input.description.trim(), price: roundMoney(input.price), plannedExpense: roundMoney(input.plannedExpense), products };
  if (existing) { Object.assign(existing, values); return existing; }
  const service = { id: uid('service'), active: true, ...values };
  state.services.push(service);
  return service;
}

export function saveProduct(state, input, id) {
  need(text(input.name) && input.name.trim().length <= 100 && text(input.description), 'Enter a product name and description.');
  need(['mL', 'L', 'g', 'kg', 'pcs'].includes(input.unit), 'Choose a supported base unit.');
  need(validNumber(input.cost) && validNumber(input.minimum, 0.01), 'Enter a non-negative unit cost and positive reorder level.');
  need(input.unit !== 'pcs' || Number.isSafeInteger(input.minimum), 'Piece reorder levels must be whole numbers.');
  need(!state.materials.some(p => p.id !== id && p.name.toLowerCase() === input.name.trim().toLowerCase()), 'A product with this name already exists.');
  const existing = id ? state.materials.find(p => p.id === id) : null;
  need(!id || existing, 'Product was not found.');
  if (existing && existing.unit !== input.unit) {
    const referenced = state.services.some(s => s.products.some(p => p.productId === id)) || state.visits.some(v => v.estimatedProducts.some(p => p.productId === id)) || state.reports.some(r => r.products.some(p => p.productId === id));
    need(!referenced && existing.stock === 0, 'The base unit cannot change while stock or product references exist. Create a separate product instead.');
  }
  const values = { name: input.name.trim(), description: input.description.trim(), unit: input.unit, cost: roundMoney(input.cost), minimum: input.minimum };
  if (existing) { Object.assign(existing, values); return existing; }
  need(validNumber(input.stock) && (input.unit !== 'pcs' || Number.isSafeInteger(input.stock)), 'Enter valid opening stock; pieces must be whole numbers.');
  const product = { id: uid('product'), active: true, category: 'Service product', stock: input.stock, ...values };
  state.materials.push(product);
  return product;
}

export function setCatalogActive(state, collection, id, active) {
  need(['services', 'materials'].includes(collection) && typeof active === 'boolean', 'Choose a valid catalog action.');
  const item = state[collection].find(item => item.id === id);
  need(item, 'Catalog definition was not found.');
  if (collection === 'materials' && !active) {
    need(!state.services.some(s => s.active && s.products.some(p => p.productId === id)), 'This product is required by an active service. Edit or archive the service first.');
    need(!state.visits.some(v => v.status !== 'Completed' && v.estimatedProducts.some(p => p.productId === id)), 'This product is allocated to an open service visit.');
  }
  if (collection === 'services' && active) need(item.products.every(line => state.materials.some(p => p.id === line.productId && p.active)), 'Restore the service’s products before restoring this service.');
  item.active = active;
}

export function scheduleVisit(state, input) {
  need(state.clients.some(c => c.id === input.clientId), 'Choose a client branch.');
  need(validDate(input.date) && validTime(input.time), 'Enter a valid service date and time.');
  need(STAFF.includes(input.technician), 'Choose a technician.');
  const service = state.services.find(s => input.serviceId ? s.id === input.serviceId : s.name === input.treatment);
  need(service?.active, 'Choose an active service.');
  const products = snapshotProducts(state, input.products ?? (input.materialId ? [{ productId: input.materialId, quantity: input.quantity }] : service.products));
  need(products.every(p => availableStock(state, p.productId) >= p.quantity), 'Not enough unallocated stock. Reduce the quantity or restock first.');
  need(validNumber(input.rate), 'Enter a valid non-negative agreed rate.');
  const plannedExpense = input.plannedExpense ?? service.plannedExpense;
  need(validNumber(plannedExpense), 'Enter valid planned expenses.');
  // shortcut: appointments reserve one hour; add service-duration planning before live dispatch.
  const minutes = time => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
  need(!state.visits.some(v => v.date === input.date && v.technician === input.technician && Math.abs(minutes(v.time) - minutes(input.time)) < 60), 'Technician already has a visit within this hour. Choose another time.');
  const visit = { id: uid('visit'), clientId: input.clientId, date: input.date, time: input.time, technician: input.technician, serviceId: service.id, treatment: service.name, estimatedProducts: products, plannedExpense: roundMoney(plannedExpense), rate: roundMoney(input.rate), status: 'Scheduled' };
  state.visits.push(visit);
  return visit;
}

function reportValues(state, visit, input, previous) {
  need(validTime(input.timeIn) && validTime(input.timeOut) && input.timeOut > input.timeIn, 'Time-out must be later than time-in on the same day.');
  const products = snapshotProducts(state, input.products ?? [{ productId: input.materialId, quantity: input.quantity }], { actual: true, previous: previous?.products || [] });
  need(products.every(p => availableStock(state, p.productId, visit.id) + (previous?.products.find(old => old.productId === p.productId)?.quantity || 0) >= p.quantity), 'Not enough stock after other visit allocations, or invalid usage quantity.');
  need(validNumber(input.expense), 'Expenses must be zero or a positive amount.');
  const actualRevenue = input.actualRevenue ?? previous?.actualRevenue ?? visit.rate;
  need(validNumber(actualRevenue), 'Enter a valid actual service charge.');
  need(Number.isSafeInteger(input.pestCount) && input.pestCount >= 0 && input.pestCount <= 100000, 'Pest count must be a non-negative whole number.');
  need(PESTS.includes(input.pest), 'Choose the observed pest type.');
  need(['location', 'findings', 'recommendation', 'method'].every(key => text(input[key])), 'Complete the location, method, findings and recommendation (maximum 2,000 characters each).');
  return { timeIn: input.timeIn, timeOut: input.timeOut, products, actualRevenue: roundMoney(actualRevenue), financialsConfirmed: true, expense: roundMoney(input.expense), pest: input.pest, pestCount: input.pestCount,
    location: input.location.trim(), findings: input.findings.trim(), recommendation: input.recommendation.trim(), method: input.method.trim(), remarks: text(input.remarks, false) ? input.remarks : '' };
}

function applyUsage(state, products, previous = []) {
  for (const product of state.materials) {
    const returned = previous.find(p => p.productId === product.id)?.quantity || 0;
    const used = products.find(p => p.productId === product.id)?.quantity || 0;
    if (returned || used) product.stock = Math.round((product.stock + returned - used) * 100) / 100;
  }
}

export function completeVisit(state, visitId, input) {
  const visit = state.visits.find(v => v.id === visitId);
  need(visit, 'Service visit was not found.');
  need(visit.status !== 'Completed', 'This service is already completed. Stock has not been deducted again.');
  const values = reportValues(state, visit, input);
  const report = { id: uid('SR'), visitId, clientId: visit.clientId, date: visit.date, technician: visit.technician, treatment: visit.treatment, ...values };
  const invoice = serviceInvoice(visit, report);
  applyUsage(state, values.products);
  visit.status = 'Completed';
  state.reports.push(report);
  state.invoices.push(invoice);
  return report;
}

export function reviseReport(state, reportId, input) {
  const report = state.reports.find(r => r.id === reportId);
  need(report, 'Service report was not found.');
  const visit = state.visits.find(v => v.id === report.visitId);
  const values = reportValues(state, visit, input, report);
  const invoice = state.invoices.find(i => i.visitId === visit.id);
  need(!invoice || values.actualRevenue >= invoice.paid, 'The revised service charge cannot be less than the amount already collected.');
  applyUsage(state, values.products, report.products);
  Object.assign(report, values);
  if (invoice) invoice.amount = values.actualRevenue;
  return report;
}

export function calendarRange(date, view = 'month') {
  need(validDate(date) && CALENDAR_VIEWS.includes(view), 'Choose a valid calendar date and view.');
  const start = new Date(`${date}T12:00:00Z`), end = new Date(start);
  if (view === 'year') { start.setUTCMonth(0, 1); end.setUTCMonth(11, 31); }
  if (view === 'month') { start.setUTCDate(1); end.setUTCMonth(end.getUTCMonth() + 1, 0); }
  if (view === 'week') { start.setUTCDate(start.getUTCDate() - (start.getUTCDay() + 6) % 7); end.setTime(start.getTime()); end.setUTCDate(end.getUTCDate() + 6); }
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export function moveCalendar(date, view, direction) {
  need(validDate(date) && CALENDAR_VIEWS.includes(view) && [-1, 1].includes(direction), 'Choose a valid calendar period and direction.');
  const target = new Date(`${date}T12:00:00Z`);
  if (view === 'year' || view === 'month') {
    const day = target.getUTCDate();
    target.setUTCDate(1);
    if (view === 'year') target.setUTCFullYear(target.getUTCFullYear() + direction);
    else target.setUTCMonth(target.getUTCMonth() + direction);
    const last = new Date(target);
    last.setUTCMonth(last.getUTCMonth() + 1, 0);
    target.setUTCDate(Math.min(day, last.getUTCDate()));
  } else target.setUTCDate(target.getUTCDate() + direction * (view === 'week' ? 7 : 1));
  const result = target.toISOString().slice(0, 10);
  need(validDate(result), 'This calendar period is outside the supported date range.');
  return result;
}

export function calendarProfit(state, start, end) {
  need(validDate(start) && validDate(end) && end >= start, 'Choose a valid profit range.');
  const visits = state.visits.filter(v => v.date >= start && v.date <= end);
  const reports = state.reports.filter(r => visits.some(v => v.id === r.visitId) && r.financialsConfirmed);
  const expected = visit => roundMoney(visit.rate - productCost(visit.estimatedProducts) - visit.plannedExpense);
  const actualRevenue = roundMoney(reports.reduce((sum, r) => sum + r.actualRevenue, 0));
  const actualCost = roundMoney(reports.reduce((sum, r) => sum + productCost(r.products) + r.expense, 0));
  const actualProfit = reports.length ? roundMoney(actualRevenue - actualCost) : null;
  const expectedCompletedProfit = roundMoney(reports.reduce((sum, r) => sum + expected(visits.find(v => v.id === r.visitId)), 0));
  return { visits: visits.length, completed: reports.length, unconfirmed: visits.filter(v => v.status === 'Completed' && !reports.some(r => r.visitId === v.id)).length,
    revenue: roundMoney(visits.reduce((sum, v) => sum + v.rate, 0)), theoreticalProfit: roundMoney(visits.reduce((sum, v) => sum + expected(v), 0)),
    actualRevenue, actualCost, actualProfit, expectedCompletedProfit, variance: actualProfit === null ? null : roundMoney(actualProfit - expectedCompletedProfit) };
}

export function recordPayment(state, invoiceId, amount, method, reference) {
  const invoice = state.invoices.find(i => i.id === invoiceId);
  need(invoice, 'Invoice was not found.');
  need(validNumber(amount, 0.01) && roundMoney(amount) <= roundMoney(invoice.amount - invoice.paid), 'Enter a positive payment no greater than the outstanding balance.');
  need(['Bank transfer', 'Cash', 'Check'].includes(method) && text(reference), 'Choose a payment method and enter a reference.');
  invoice.paid = roundMoney(invoice.paid + amount);
  invoice.payments.push({ amount: roundMoney(amount), method, reference: reference.trim(), recordedAt: new Date().toISOString() });
}

export function restock(state, materialId, quantity) {
  const material = state.materials.find(m => m.id === materialId);
  need(material?.active && validNumber(quantity, 0.01) && material.stock + quantity <= 1e9 && (material.unit !== 'pcs' || Number.isSafeInteger(quantity)), 'Enter a valid positive restock quantity.');
  material.stock = Math.round((material.stock + quantity) * 100) / 100;
}

function validClientContacts(input) {
  return ['contact', 'contactPerson', 'phone', 'email'].every(key => input[key] === undefined || text(input[key], false)) &&
    (!input.phone?.trim() || (input.phone.trim().length <= 50 && /^\+?[0-9()\s.-]+(?:\s*(?:ext\.?|x|#)\s*\d+)?$/i.test(input.phone.trim()) && input.phone.replace(/\D/g, '').length >= 5)) &&
    (!input.email?.trim() || (input.email.trim().length <= 254 && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(input.email.trim())));
}

export function enrollClient(state, input, id) {
  const existing = id ? state.clients.find(c => c.id === id) : null;
  need(!id || existing, 'Client branch was not found.');
  need(['name', 'branch', 'address', 'duration', 'package'].every(key => text(input[key])), 'Complete all client and agreement details.');
  need(validClientContacts(input), 'Enter valid contact details, a phone number with at least five digits, and an email address such as name@example.com. Contact fields may be left blank.');
  need(validNumber(input.rate) && validDate(input.since), 'Enter a valid rate and agreement start date.');
  need(!state.clients.some(c => c.id !== id && c.name.toLowerCase() === input.name.trim().toLowerCase() && c.branch.toLowerCase() === input.branch.trim().toLowerCase()), 'This client branch is already enrolled.');
  need(!id || !input.assessmentId, 'Client edits cannot relink an assessment.');
  const assessment = input.assessmentId ? state.assessments.find(a => a.id === input.assessmentId) : null;
  need(!input.assessmentId || (assessment && !assessment.clientId), 'This assessment is already linked or no longer available.');
  const values = { ...Object.fromEntries(['name', 'branch', 'address', 'duration', 'package'].map(key => [key, input[key].trim()])), ...Object.fromEntries(['contact', 'contactPerson', 'phone', 'email'].map(key => [key, (input[key] ?? '').trim()])), rate: roundMoney(input.rate), since: input.since };
  if (existing) { Object.assign(existing, values); return existing; }
  const client = { id: uid('client'), ...values };
  state.clients.push(client);
  if (assessment) assessment.clientId = client.id;
  return client;
}

export function addAssessment(state, input) {
  need(state.clients.some(c => c.id === input.clientId) || (!input.clientId && text(input.accountName) && text(input.branch)), 'Choose an existing branch or enter the prospect account and branch.');
  need(validDate(input.date) && validTime(input.time) && STAFF.includes(input.assessor), 'Choose a valid date, time and assessor.');
  need(PROBLEMS.includes(input.problem) && state.services.some(s => s.active && s.name === input.solution) && state.materials.some(m => m.id === input.materialId && m.active), 'Choose the problem, solution and material.');
  need(text(input.location) && text(input.notes, false), 'Enter an inspected area and keep notes under 2,000 characters.');
  const assessment = { id: uid('ocular'), ...Object.fromEntries(['clientId', 'date', 'time', 'assessor', 'location', 'problem', 'solution', 'materialId', 'notes'].map(key => [key, input[key]])) };
  assessment.serviceId = state.services.find(s => s.active && s.name === input.solution).id;
  if (!input.clientId) { assessment.accountName = input.accountName.trim(); assessment.branch = input.branch.trim(); }
  state.assessments.push(assessment);
  return assessment;
}

export function migrateState(input) {
  need(input && [1, 2].includes(input.version), 'Saved data has an unsupported version.');
  const state = structuredClone(input);
  if (state.version === 2) {
    state.assessments?.forEach(a => { if (!a.serviceId) a.serviceId = state.services?.find(s => s.name === a.solution)?.id || ''; });
    need(validateState(state), 'Saved data is invalid.'); return state;
  }
  need(['clients', 'visits', 'materials', 'reports', 'observations', 'assessments', 'invoices'].every(k => Array.isArray(state[k])), 'Saved collections are invalid.');
  state.materials.forEach(p => {
    p.active = true;
    p.description = p.description || `${p.category} product, measured in ${p.unit}.`;
    if (p.unit === 'pcs' && (!Number.isInteger(p.stock) || !Number.isInteger(p.minimum) || [...state.visits, ...state.reports].some(row => row.materialId === p.id && !Number.isInteger(row.quantity)))) p.legacyFractionalPieces = true;
  });
  state.services = seedServices(state.materials);
  state.visits.forEach(v => {
    const service = state.services.find(s => s.name === v.treatment);
    const product = state.materials.find(p => p.id === v.materialId);
    need(service && product, 'A saved visit refers to a missing service or product.');
    v.serviceId = service.id;
    v.plannedExpense = 0;
    v.estimateBasis = 'Legacy estimate reconstructed from the current product catalog.';
    v.estimatedProducts = [{ productId: product.id, quantity: v.quantity, name: product.name, unit: product.unit, unitCost: product.cost, ...(product.unit === 'pcs' && !Number.isInteger(v.quantity) ? { legacyQuantity: true } : {}) }];
  });
  state.reports.forEach(r => {
    const product = state.materials.find(p => p.id === r.materialId);
    const visit = state.visits.find(v => v.id === r.visitId);
    need(product && visit, 'A saved report refers to a missing visit or product.');
    r.products = [{ productId: product.id, quantity: r.quantity, name: product.name, unit: product.unit, unitCost: product.cost, ...(product.unit === 'pcs' && !Number.isInteger(r.quantity) ? { legacyQuantity: true } : {}) }];
    r.actualRevenue = visit.rate;
    r.financialsConfirmed = false;
  });
  state.assessments.forEach(a => { a.serviceId = state.services.find(s => s.name === a.solution)?.id || ''; });
  state.version = 2;
  need(validateState(state), 'Saved data could not be upgraded safely.');
  return state;
}

export function validateState(state) {
  try {
    if (!state || state.version !== 2) return false;
    const collections = ['services', 'clients', 'visits', 'materials', 'reports', 'observations', 'assessments', 'invoices'];
    if (!collections.every(key => Array.isArray(state[key]) && state[key].length <= 10000 && state[key].every(row => row && typeof row === 'object'))) return false;
    const unique = rows => rows.every(row => text(row.id)) && new Set(rows.map(row => row.id)).size === rows.length;
    if (!collections.filter(key => key !== 'observations').every(key => unique(state[key]))) return false;
    const hasClient = row => state.clients.some(c => c.id === row.clientId);
    const hasMaterial = row => state.materials.some(m => m.id === row.materialId);
    const validLines = (lines, snapshots = false) => Array.isArray(lines) && lines.length <= 50 && new Set(lines.map(p => p?.productId)).size === lines.length && lines.every(p => p && state.materials.some(m => m.id === p.productId) && validNumber(p.quantity, 0.01) && (state.materials.find(m => m.id === p.productId).unit !== 'pcs' || Number.isSafeInteger(p.quantity) || (snapshots && p.legacyQuantity === true)) && (!snapshots || (text(p.name) && text(p.unit) && validNumber(p.unitCost))));
    return state.services.every(s => text(s.name) && text(s.description) && validNumber(s.price) && validNumber(s.plannedExpense) && typeof s.active === 'boolean' && validLines(s.products)) &&
      state.clients.every(c => ['name', 'branch', 'address', 'duration', 'package'].every(k => text(c[k])) && validClientContacts(c) && validNumber(c.rate) && validDate(c.since)) &&
      state.materials.every(m => ['name', 'description', 'category'].every(k => text(m[k])) && ['mL', 'L', 'g', 'kg', 'pcs'].includes(m.unit) && typeof m.active === 'boolean' && validNumber(m.stock) && validNumber(m.minimum, 0.01) && validNumber(m.cost) && (m.unit !== 'pcs' || m.legacyFractionalPieces === true || (Number.isSafeInteger(m.stock) && Number.isSafeInteger(m.minimum)))) &&
      state.visits.every(v => hasClient(v) && state.services.some(s => s.id === v.serviceId) && validDate(v.date) && validTime(v.time) && STAFF.includes(v.technician) && text(v.treatment) && ['Scheduled', 'In progress', 'Completed'].includes(v.status) && validLines(v.estimatedProducts, true) && validNumber(v.plannedExpense) && validNumber(v.rate)) &&
      new Set(state.invoices.filter(i => i.visitId).map(i => i.visitId)).size === state.invoices.filter(i => i.visitId).length &&
      state.invoices.every(i => hasClient(i) && validDate(i.date) && validDate(i.due) && text(i.treatment) && validNumber(i.amount) && validNumber(i.paid) && i.paid <= i.amount && (i.visitId === undefined || (text(i.visitId) && state.visits.some(v => v.id === i.visitId && v.status === 'Completed' && v.clientId === i.clientId) && state.reports.some(r => r.visitId === i.visitId && r.financialsConfirmed && r.actualRevenue === i.amount))) && Array.isArray(i.payments) && i.payments.every(p => validNumber(p.amount, 0.01) && text(p.method) && text(p.reference) && text(p.recordedAt))) &&
      state.assessments.every(a => (hasClient(a) || (!a.clientId && text(a.accountName) && text(a.branch))) && hasMaterial(a) && validDate(a.date) && validTime(a.time) && STAFF.includes(a.assessor) && PROBLEMS.includes(a.problem) && text(a.solution) && text(a.location) && text(a.notes, false)) &&
      state.observations.every(o => hasClient(o) && validDate(o.date) && PESTS.includes(o.pest) && Number.isSafeInteger(o.count) && o.count >= 0) &&
      new Set(state.reports.map(r => r.visitId)).size === state.reports.length &&
      state.reports.every(r => hasClient(r) && state.visits.some(v => v.id === r.visitId && v.status === 'Completed' && v.clientId === r.clientId && v.date === r.date) && validDate(r.date) && validTime(r.timeIn) && validTime(r.timeOut) && r.timeOut > r.timeIn && STAFF.includes(r.technician) && text(r.treatment) && PESTS.includes(r.pest) && ['location', 'method', 'findings', 'recommendation'].every(k => text(r[k])) && text(r.remarks, false) && validLines(r.products, true) && validNumber(r.actualRevenue) && typeof r.financialsConfirmed === 'boolean' && validNumber(r.expense) && Number.isSafeInteger(r.pestCount) && r.pestCount >= 0);
  } catch { return false; }
}
