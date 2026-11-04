// Public browser-local presets, not secure accounts or secrets.
export const DEMO_USERS = [
  { id: 'owner', email: 'owner@zealpro.demo', password: 'OwnerDemo!2026', name: 'General manager', role: 'owner', label: 'Owner', teamId: '', active: true, canCollect: true },
  { id: 'admin', email: 'admin@zealpro.demo', password: 'AdminDemo!2026', name: 'Office administrator', role: 'admin', label: 'Administrator', teamId: '', active: true, canCollect: true },
  { id: 'supervisor1', email: 'supervisor@zealpro.demo', password: 'SupervisorDemo!2026', name: 'Operations supervisor', role: 'supervisor', label: 'Supervisor 1', teamId: 't1', active: true, canCollect: false },
  { id: 'supervisor2', email: 'supervisor2@zealpro.demo', password: 'SupervisorDemo!2026', name: 'Regional supervisor', role: 'supervisor', label: 'Supervisor 2', teamId: 't2', active: true, canCollect: false },
  { id: 'technician', email: 'technician@zealpro.demo', password: 'TechnicianDemo!2026', name: 'Marco Reyes', role: 'technician', label: 'Technician', teamId: 't1', active: true, canCollect: false },
  ...[
    ['paolo', 'Paolo Santos', 't1'], ['luis', 'Luis Mendoza', 't2'], ['carlo', 'Carlo Garcia', 't2'],
    ['nina', 'Nina Cruz', 't1'], ['adrian', 'Adrian Ramos', 't1'], ['bea', 'Bea Torres', 't2'], ['diego', 'Diego Santos', 't2'],
  ].map(([id, name, teamId]) => ({ id, email: `${id}@zealpro.demo`, password: 'TechnicianDemo!2026', name, role: 'technician', label: 'Technician', teamId, active: true, canCollect: false })),
];
export const DEFAULT_TEAMS = [
  { id: 't1', name: 'North team', memberNames: ['Marco Reyes', 'Paolo Santos', 'Nina Cruz', 'Adrian Ramos'], branchIds: ['c1', 'c2', 'c3'] },
  { id: 't2', name: 'South team', memberNames: ['Luis Mendoza', 'Carlo Garcia', 'Bea Torres', 'Diego Santos'], branchIds: ['c2', 'c4', 'c5'] },
];
const permissions = {
  owner: ['finance', 'commercial', 'costs', 'manageClients', 'manageCatalog', 'manageServices', 'manageProducts', 'schedule', 'submitReports', 'approveReports', 'reviseReports', 'restock', 'requestStock', 'cumulative', 'analytics', 'staff', 'invite', 'manageUsers', 'audit', 'reset', 'collect'],
  admin: ['commercial', 'costs', 'manageClients', 'manageProducts', 'schedule', 'restock', 'cumulative', 'analytics', 'staff', 'invite', 'audit', 'collect'],
  supervisor: ['costs', 'schedule', 'approveReports', 'requestStock', 'cumulative', 'analytics', 'staff', 'audit'],
  technician: ['submitReports', 'staff', 'audit'],
};
export const can = (user, capability) => Boolean(user && user.active !== false && Object.hasOwn(permissions, user.role) && permissions[user.role].includes(capability) && (capability !== 'collect' || user.role === 'owner' || user.canCollect === true));

export function workspaceUsers(state) {
  const overrides = Array.isArray(state?.presentation?.users) ? state.presentation.users : [];
  const project = user => {
    const { id, email, name, role, label, teamId, active, canCollect, displayName, phone, invitationStatus, assignmentName, branchIds } = user;
    return { id, email, name, role, label, teamId, active, canCollect, displayName: displayName || name, ...(phone !== undefined ? { phone } : {}), ...(invitationStatus !== undefined ? { invitationStatus } : {}), ...(assignmentName !== undefined ? { assignmentName } : {}), ...(Array.isArray(branchIds) ? { branchIds: [...branchIds] } : {}) };
  };
  const users = DEMO_USERS.map(base => {
    const saved = overrides.find(user => user.id === base.id || user.email === base.email) || {};
    return project({ ...base, ...saved, id: base.id, name: base.name });
  });
  return [...users, ...overrides.filter(saved => !DEMO_USERS.some(base => base.id === saved.id || base.email === saved.email)).map(project)];
}
export function currentProfile(state, user) {
  if (!user) return null;
  const profile = workspaceUsers(state).find(profile => profile.id === user.id || profile.email === user.email);
  return profile?.active !== false && profile && Object.hasOwn(permissions, profile.role) ? profile : null;
}
export function authenticateDemo(email, password, state) {
  if (typeof email !== 'string' || typeof password !== 'string') return null;
  const user = DEMO_USERS.find(user => user.email === email.trim().toLowerCase() && user.password === password);
  return user ? currentProfile(state, user) : null;
}
export function assignedPersonnel(state, visit) {
  if (!visit) return [];
  const names = state?.presentation?.jobs?.[visit.id]?.personnel;
  return [...new Set((Array.isArray(names) ? names : [visit.technician]).filter(name => typeof name === 'string' && name.trim()))];
}
function ownTeam(state, user) {
  const teams = Array.isArray(state.presentation?.teams) ? state.presentation.teams : DEFAULT_TEAMS;
  return teams.find(team => team.id === user.teamId);
}
export function canView(user, view) {
  if (!user || user.active === false || !Object.hasOwn(permissions, user.role)) return false;
  if (view === 'billing') return can(user, 'commercial');
  if (view === 'analytics') return can(user, 'analytics');
  return ['overview', 'schedule', 'services', 'ocular', 'clients', 'reports', 'inventory', 'settings', 'staff', 'activity'].includes(view);
}
export function scopeWorkspace(state, user) {
  const profile = currentProfile(state, user);
  if (!profile) return { ...state, visits: [], reports: [], clients: [], assessments: [], observations: [], invoices: [], materials: [], services: [] };
  if (['owner', 'admin'].includes(profile.role)) return { ...state, invoices: can(profile, 'commercial') ? state.invoices : [] };
  const team = ownTeam(state, profile);
  const inTeam = name => name === profile.name || team?.memberNames?.includes(name);
  const branchIds = Array.isArray(profile.branchIds) ? profile.branchIds : team?.branchIds || [];
  const inBranch = clientId => branchIds.includes(clientId);
  const visits = state.visits.filter(visit => profile.role === 'technician' ? assignedPersonnel(state, visit).includes(profile.name) : inBranch(visit.clientId) && assignedPersonnel(state, visit).some(inTeam));
  const visitIds = new Set(visits.map(visit => visit.id));
  const assessments = state.assessments.filter(assessment => profile.role === 'technician' ? assessment.assessor === profile.name : assessment.assessor === profile.name || inBranch(assessment.clientId) && inTeam(assessment.assessor));
  const clientIds = new Set([...visits, ...assessments].map(row => row.clientId));
  if (profile.role === 'supervisor') for (const id of branchIds) clientIds.add(id);
  const reports = state.reports.filter(report => visitIds.has(report.visitId));
  const reportIds = new Set(reports.map(report => report.id));
  const observations = state.observations.filter(observation => clientIds.has(observation.clientId) && (!observation.visitId || visitIds.has(observation.visitId)) && (!observation.reportId || reportIds.has(observation.reportId)) && (!observation.sourceReportId || reportIds.has(observation.sourceReportId)) && (observation.sourceKind !== 'report' || reportIds.has(observation.sourceId)));
  const productIds = new Set([...visits.flatMap(visit => visit.estimatedProducts || []), ...reports.flatMap(report => report.products || [])].map(product => product.productId));
  for (const assessment of assessments) for (const finding of assessment.findings || []) for (const id of finding.materialIds || []) productIds.add(id);
  return { ...state, visits, assessments, reports, clients: state.clients.filter(client => clientIds.has(client.id)), observations, materials: state.materials.filter(material => productIds.has(material.id)), invoices: [] };
}

export function assertDemoAction(user, action, state, id = '') {
  user = currentProfile(state, user);
  if (!user) throw new Error('Sign in with an active sample account first.');
  action = ({ 'report-draft-save': 'save-draft', 'report-submit': 'submit-report', 'report-review-save': 'review-report', 'amend-save': 'amend-report', 'ocular-draft-save': 'save-assessment-draft', 'ocular-submit': 'submit-assessment', 'assessment-review-save': 'review-assessment' })[action] || action;
  const require = capability => { if (!can(user, capability)) throw new Error('This action is not available for your role.'); };
  const scoped = scopeWorkspace(state, user);
  const record = (collection, recordId = id) => {
    const row = state[collection].find(row => row.id === recordId);
    if (!row) throw new Error('Record was not found.');
    if (!scoped[collection].some(item => item.id === recordId)) throw new Error('Only records assigned to your team or work are available.');
    return row;
  };
  const assignedWork = () => {
    const report = state.reports.find(report => report.id === id);
    const visit = state.visits.find(visit => visit.id === (report?.visitId || id));
    if (!visit) throw new Error('Record was not found.');
    record('visits', visit.id);
    if (user.role !== 'owner' && !assignedPersonnel(state, visit).includes(user.name)) throw new Error('Only your assigned services may be submitted.');
  };
  if (['service-form', 'service'].includes(action)) require('manageServices');
  else if (['product-form', 'product'].includes(action)) require('manageProducts');
  else if (['catalog-archive', 'catalog-confirm', 'catalog-restore'].includes(action)) {
    const collection = id.split(':')[0];
    if (!['services', 'materials'].includes(collection)) throw new Error('Catalog record was not found.');
    require(collection === 'services' ? 'manageServices' : 'manageProducts');
  } else if (action === 'client-status') { require('manageClients'); record('clients'); }
  else if (['new-client', 'edit-client', 'client-edit', 'client-create'].includes(action)) require('manageClients');
  else if (['new-visit', 'visit-create', 'schedule-save'].includes(action)) require('schedule');
  else if (action === 'client-schedule') { require('schedule'); record('clients'); }
  else if (['assessment-schedule', 'finding-schedule'].includes(action)) { require('schedule'); record('assessments', action === 'finding-schedule' ? id.slice(0, id.lastIndexOf(':')) : id); }
  else if (['reschedule', 'cancel-visit'].includes(action)) { require('schedule'); record('visits'); }
  else if (['payment', 'payment-draft', 'payment-submit', 'payment-history', 'payment-proof', 'payment-verify', 'payment-void', 'payment-void-save', 'reminder', 'reminder-schedule', 'reminder-run', 'reminder-retry', 'reminder-simulate', 'reminder-log'].includes(action)) {
    require(['payment', 'payment-verify'].includes(action) ? 'collect' : ['payment-void', 'payment-void-save'].includes(action) ? 'finance' : 'commercial');
    const payment = state.presentation?.payments?.find(payment => payment.id === id);
    const reminder = state.presentation?.reminders?.find(reminder => reminder.id === id);
    record('invoices', payment?.invoiceId || reminder?.invoiceId || id);
  } else if (action === 'service-payment') { require('commercial'); record('visits'); }
  else if (action === 'restock') { require('restock'); record('materials'); }
  else if (['request-stock', 'stock-request'].includes(action)) { require('requestStock'); if (id) record('materials'); }
  else if (action === 'inventory-history') { if (id) record('materials'); }
  else if (['reset', 'reset-confirm'].includes(action)) require('reset');
  else if (['cumulative-preview', 'cumulative-filter'].includes(action)) require('cumulative');
  else if (['legacy-financial', 'legacy-financial-save'].includes(action)) { require('finance'); record('reports'); }
  else if (['edit-report', 'report-revision'].includes(action)) {
    const report = record('reports');
    if (!report.financialsConfirmed && !can(user, 'commercial')) throw new Error('Owner must review historical financial values first.');
    require('reviseReports');
  } else if (['review-report', 'amend-report'].includes(action)) { require('approveReports'); record('reports'); }
  else if (action === 'choose-report') require('submitReports');
  else if (action === 'complete') { require('submitReports'); assignedWork(); }
  else if (['save-draft', 'submit-report'].includes(action)) {
    if (!can(user, 'submitReports') && user.role !== 'supervisor') require('submitReports');
    assignedWork();
  } else if (action === 'visit') record('visits');
  else if (action === 'report') record('reports');
  else if (action === 'client') record('clients');
  else if (action === 'ocular-detail') record('assessments');
  else if (['edit-assessment', 'save-assessment-draft', 'submit-assessment'].includes(action)) {
    const draft = state.presentation?.assessmentDrafts?.[id];
    if (draft) {
      if (!['owner', 'admin'].includes(user.role) && draft.actorId !== user.id) throw new Error('Only your own assessment drafts are available.');
    } else if (id) record('assessments');
    else if (action === 'edit-assessment') throw new Error('Record was not found.');
  }
  else if (action === 'review-assessment') { require('approveReports'); record('assessments'); }
  else if (['staff-invite', 'invite-save'].includes(action)) require('invite');
  else if (['staff-edit', 'profile-save', 'user-save', 'password-reset-preview'].includes(action)) {
    require('staff');
    const target = workspaceUsers(state).find(profile => profile.id === id || profile.email === id);
    if (!target) throw new Error('Staff profile was not found.');
    if (!['owner', 'admin'].includes(user.role) && target.id !== user.id) throw new Error('This action is not available for your role.');
  } else if (['team-save', 'team-edit'].includes(action)) require('manageUsers');
  else if (['rate-request', 'rate-save'].includes(action)) require('commercial');
  else if (['rate-review', 'review-save'].includes(action)) require('finance');
  else if (action === 'activity') require('audit');
  else if (!['close', 'menu', 'guide', 'logout', 'new-assessment', 'assessment', 'print', 'sample-day', 'calendar-prev', 'calendar-next', 'add-product', 'remove-product', 'add-finding', 'remove-finding', 'filter', 'global-search'].includes(action)) throw new Error('This action is not supported.');
}

export function protectedValues(user, kind, state, id, input) {
  user = currentProfile(state, user);
  if (!user) throw new Error('Sign in with an active sample account first.');
  const values = { ...input };
  if (kind === 'assessment' && ['technician', 'supervisor'].includes(user.role)) {
    if (values.clientId && !scopeWorkspace(state, user).clients.some(client => client.id === values.clientId)) throw new Error('Choose a branch assigned to your work or a new prospect.');
    if (user.role === 'technician') values.assessor = user.name;
  }
  if (!can(user, 'commercial') && ['visit', 'schedule-save'].includes(kind)) {
    values.rate = state.clients.find(client => client.id === values.clientId)?.rate;
    values.plannedExpense = state.services.find(service => service.id === values.serviceId)?.plannedExpense;
  }
  if (['complete', 'report-revision', 'save-draft', 'submit-report', 'amend-report'].includes(kind)) {
    const report = state.reports.find(report => report.id === id);
    const visit = state.visits.find(visit => visit.id === (report?.visitId || id));
    if (!can(user, 'commercial')) values.actualRevenue = report?.actualRevenue ?? visit?.rate;
    if (!can(user, 'finance')) values.products = (values.products || []).map(({ productId, quantity }) => ({ productId, quantity, unitCost: report?.products.find(product => product.productId === productId)?.unitCost ?? state.materials.find(product => product.id === productId)?.cost }));
  }
  return values;
}
