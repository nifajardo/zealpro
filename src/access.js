// Public presets for the browser-local role demonstration, not secure accounts or secrets.
export const DEMO_USERS = [
  { email: 'owner@zealpro.demo', password: 'OwnerDemo!2026', name: 'General manager', role: 'owner', label: 'Owner' },
  { email: 'supervisor@zealpro.demo', password: 'SupervisorDemo!2026', name: 'Operations supervisor', role: 'supervisor', label: 'Supervisor' },
  { email: 'technician@zealpro.demo', password: 'TechnicianDemo!2026', name: 'Marco Reyes', role: 'technician', label: 'Technician' },
];
const permissions = {
  owner: ['finance', 'manageClients', 'manageCatalog', 'schedule', 'reviseReports', 'restock', 'cumulative', 'analytics', 'reset'],
  supervisor: ['schedule', 'reviseReports', 'restock', 'cumulative', 'analytics'],
  technician: [],
};
export const can = (user, capability) => Boolean(user && Object.hasOwn(permissions, user.role) && permissions[user.role].includes(capability));
export function authenticateDemo(email, password) {
  if (typeof email !== 'string' || typeof password !== 'string') return null;
  const user = DEMO_USERS.find(user => user.email === email.trim().toLowerCase() && user.password === password);
  if (!user) return null;
  const { password: omitted, ...profile } = user;
  return profile;
}
export function canView(user, view) {
  if (!user || !Object.hasOwn(permissions, user.role)) return false;
  if (view === 'billing') return can(user, 'finance');
  if (view === 'analytics') return can(user, 'analytics');
  return ['overview', 'schedule', 'services', 'ocular', 'clients', 'reports', 'inventory'].includes(view);
}
export function scopeWorkspace(state, user) {
  if (!user || !Object.hasOwn(permissions, user.role)) return { ...state, visits: [], reports: [], clients: [], assessments: [], observations: [], invoices: [] };
  if (user.role !== 'technician') return { ...state, invoices: can(user, 'finance') ? state.invoices : [] };
  const visits = state.visits.filter(v => v.technician === user.name);
  const assessments = state.assessments.filter(a => a.assessor === user.name);
  const clients = new Set([...visits, ...assessments].map(row => row.clientId));
  return { ...state, visits, assessments, reports: state.reports.filter(r => visits.some(v => v.id === r.visitId)), clients: state.clients.filter(c => clients.has(c.id)), observations: state.observations.filter(o => clients.has(o.clientId)), invoices: [] };
}

export function assertDemoAction(user, action, state, id = '') {
  if (!user || !Object.hasOwn(permissions, user.role)) throw new Error('Sign in with a sample account first.');
  const require = capability => { if (!can(user, capability)) throw new Error('This action is not available for your role.'); };
  if (['service-form', 'product-form', 'service', 'product', 'catalog-archive', 'catalog-confirm', 'catalog-restore'].includes(action)) require('manageCatalog');
  else if (['new-client', 'edit-client', 'client-edit', 'client-create'].includes(action)) require('manageClients');
  else if (['new-visit', 'client-schedule', 'assessment-schedule', 'finding-schedule', 'visit-create'].includes(action)) require('schedule');
  else if (['payment', 'reminder', 'payment-history', 'service-payment'].includes(action)) require('finance');
  else if (['restock'].includes(action)) require('restock');
  else if (['reset', 'reset-confirm'].includes(action)) require('reset');
  else if (['cumulative-preview', 'cumulative-filter'].includes(action)) require('cumulative');
  else if (['edit-report', 'report-revision'].includes(action)) {
    require('reviseReports');
    const report = state.reports.find(r => r.id === id);
    if (!report) throw new Error('Report was not found.');
    if (!report.financialsConfirmed && !can(user, 'finance')) throw new Error('Owner must review historical financial values first.');
  } else if (['visit', 'complete', 'report'].includes(action)) {
    const record = action === 'report' ? state.reports.find(r => r.id === id) : state.visits.find(v => v.id === id);
    if (!record) throw new Error('Record was not found.');
    if (user.role === 'technician' && record.technician !== user.name) throw new Error('Only your assigned services are available.');
  } else if (action === 'client') {
    if (!scopeWorkspace(state, user).clients.some(c => c.id === id)) throw new Error('Client branch is not available for your assigned work.');
  } else if (action === 'ocular-detail') {
    if (!scopeWorkspace(state, user).assessments.some(a => a.id === id)) throw new Error('Assessment is not available for your assigned work.');
  } else if (!['close', 'menu', 'guide', 'logout', 'new-assessment', 'assessment', 'choose-report', 'print', 'sample-day', 'calendar-prev', 'calendar-next', 'add-product', 'remove-product', 'add-finding', 'remove-finding', 'filter', 'global-search', 'cumulative-filter'].includes(action)) throw new Error('This action is not supported.');
}

export function protectedValues(user, kind, state, id, input) {
  const values = { ...input };
  if (kind === 'assessment' && user.role === 'technician') {
    if (values.clientId && !scopeWorkspace(state, user).clients.some(c => c.id === values.clientId)) throw new Error('Choose a branch assigned to your work or a new prospect.');
    values.assessor = user.name;
  }
  if (!can(user, 'finance') && kind === 'visit') {
    values.rate = state.clients.find(c => c.id === values.clientId)?.rate;
    values.plannedExpense = state.services.find(s => s.id === values.serviceId)?.plannedExpense;
  }
  if (!can(user, 'finance') && ['complete', 'report-revision'].includes(kind)) {
    const report = kind === 'report-revision' ? state.reports.find(r => r.id === id) : null;
    const visit = state.visits.find(v => v.id === (report?.visitId || id));
    values.actualRevenue = report?.actualRevenue ?? visit?.rate;
    values.products = (values.products || []).map(({ productId, quantity }) => ({ productId, quantity, unitCost: report?.products.find(p => p.productId === productId)?.unitCost ?? state.materials.find(p => p.id === productId)?.cost }));
  }
  return values;
}
