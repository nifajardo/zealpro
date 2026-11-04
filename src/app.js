import { createDemo, DEMO_DATE, STAFF, PROBLEMS, PESTS, CALENDAR_VIEWS } from './data.js';
import { summary, money as formatMoney, enrollClient, availableStock, saveService, saveProduct, setCatalogActive, productCost, calendarRange, calendarProfit, migrateState, paymentSummary, serviceDueDate, linkServicePayment, moveCalendar, assessmentFindings } from './model.js';

import { DEMO_USERS, authenticateDemo, can, canView, scopeWorkspace, assertDemoAction, protectedValues, workspaceUsers, assignedPersonnel, currentProfile } from './access.js';
import { accountKey, accountOptions, pestObservations, buildCumulativeReport } from './reporting.js';
import { ensurePresentation, reportMeta, assessmentMeta, jobStatus, saveReportDraft, submitReport, reviewReport, beginAmendment, scheduleDemoVisit, cancelDemoVisit, saveAssessmentDraft, submitAssessment, reviewAssessment, restockDemo, setClientStatus, canReadExpense, confirmLegacyFinancials } from './presentation.js';
import { settingsView, activityView, inventoryExtras, billingExtras, openWorkspaceAction, handleWorkspaceAction, handleWorkspaceForm } from './workspace-ui.js';

const STORE = 'zealpro.demo.v1';
let storageWarning = '';
let legacyBackup = '';
let state = createDemo();
try {
  const saved = localStorage.getItem(STORE);
  if (saved) {
    legacyBackup = saved;
    const parsed = JSON.parse(saved);
    state = migrateState(parsed);
    if (parsed.version === 2) legacyBackup = '';
  }
} catch { storageWarning = 'Saved demo data could not be loaded. A fresh sample session is open; the previous browser value has not been overwritten.'; }
ensurePresentation(state);
let actor = null;
let screen = scopeWorkspace(state, actor);
const money = value => can(actor, 'commercial') ? formatMoney(value) : 'Restricted';
const finance = html => can(actor, 'finance') ? html : '';
const commercial = html => can(actor, 'commercial') ? html : '';
const costs = html => can(actor, 'costs') ? html : '';
const personnel = visit => assignedPersonnel(state, visit);
const approved = report => reportMeta(state, report.id).status === 'Approved';
const reviewable = report => can(actor,'approveReports') && (actor.role==='owner' || !personnel(state.visits.find(v=>v.id===report.visitId)).includes(actor.name));
const shownStatus = visit => jobStatus(state, state.visits.find(v => v.id === visit.id) || visit);
const staffChoices = () => actor?.role === 'supervisor' ? (state.presentation.teams.find(t => t.id === actor.teamId)?.memberNames || []) : STAFF;
function uiContext() { return { state, screen, actor, e, button, field, input, select, options, form, showDialog, heading, panelHead, dateLabel, timeLabel, client, material, money: formatMoney, notify }; }
function periodProfit(start, end) { return calendarProfit({ ...screen, visits: screen.visits.filter(v => v.status !== 'Cancelled'), reports: screen.reports.filter(approved) }, start, end); }
function reviewTrail(meta) {
  return `<section class="review-history"><h3>Review history</h3>${meta.approvalRef ? `<p><strong>Approval reference:</strong> ${e(meta.approvalRef)}</p>` : ''}${meta.history?.length ? `<ol class="activity-timeline">${meta.history.map(h => `<li><strong>${e(h.action || h.status)}</strong><span>${e(h.actorName || h.actor || h.by || 'Demo workspace')} / ${e(h.at || h.timestamp || '')}</span>${h.reason ? `<p>${e(h.reason)}</p>` : ''}</li>`).join('')}</ol>` : '<p>Legacy demonstration record. No human signature or historical reviewer is inferred.</p>'}</section>`;
}
function personnelFields(selected = []) { return `<fieldset class="personnel-picker"><legend>Additional personnel</legend><p class="field-hint">The technician in charge is always included. Every selected person reserves this hour.</p>${staffChoices().map(name => `<label><input type="checkbox" name="personnel" value="${e(name)}" ${selected.includes(name) ? 'checked' : ''}> ${e(name)}</label>`).join('')}</fieldset>`; }
function reviewSummary() {
  const pending = screen.reports.filter(r => reportMeta(state, r.id).status === 'Submitted').length;
  const returned = screen.reports.filter(r => reportMeta(state, r.id).status === 'Returned').length;
  const ownDrafts = Object.values(state.presentation.drafts).filter(d => d.actorId === actor.id).length;
  const expenses = screen.reports.reduce((total, r) => total + r.expense, 0);
  return `<section class="workflow-overview"><div><h2>${actor.role === 'admin' ? 'Office workflow' : actor.role === 'supervisor' ? 'Team review' : actor.role === 'technician' ? 'My fieldwork' : 'Work and approvals'}</h2><p><strong>${pending} submitted / ${returned} returned</strong></p><p>${actor.role === 'technician' ? `${ownDrafts} saved drafts. Submit fieldwork for Supervisor review.` : 'Submission posts usage. Approval finalizes the report and creates billing.'}</p>${can(actor, 'costs') ? `<p>Recorded field expenses: <strong>${formatMoney(expenses)}</strong></p>` : ''}</div><a class="button" href="#reports">${can(actor, 'approveReports') ? 'Review submissions' : 'Open reports'}</a></section>`;
}
const app = document.querySelector('#app');
const dialog = document.querySelector('#dialog');
let toastTimer;
const e = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const client = id => state.clients.find(c => c.id === id);
const material = id => state.materials.find(m => m.id === id);
const assessmentAccount = a => client(a.clientId) || { name: a.accountName, branch: a.branch };
const initials = name => name.split(' ').map(p => p[0]).slice(0, 2).join('');
const dateLabel = (date, options = { month: 'short', day: 'numeric', year: 'numeric' }) => new Intl.DateTimeFormat('en-PH', options).format(new Date(`${date}T12:00:00`));
const timeLabel = time => new Date(`2026-01-01T${time}`).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
const options = (values, selected) => values.map(value => `<option value="${e(typeof value === 'string' ? value : value.id)}" ${selected === (value.id ?? value) ? 'selected' : ''}>${e(typeof value === 'string' ? value : value.name)}</option>`).join('');
const clientOptions = selected => options(screen.clients.map(c => ({ id: c.id, name: `${c.name} — ${c.branch}` })), selected);
const materialOptions = selected => options(state.materials.filter(m => m.active || m.id === selected).map(m => ({ id: m.id, name: `${m.name} (${m.unit})${m.active ? '' : ' / archived'}` })), selected);
const serviceOptions = selected => options(state.services.filter(s => s.active).map(s => ({ id: s.id, name: s.name })), selected);
const serviceNames = () => state.services.filter(s => s.active).map(s => s.name);
const paths = {
  services: '<path d="m12 3 8 4v5c0 5-8 9-8 9s-8-4-8-9V7Z M8 12l3 3 5-6"/>',
  overview: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  schedule: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18M8 15h2M14 15h2"/>',
  ocular: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  clients: '<path d="M4 21V5l8-3 8 3v16M2 21h20M8 7v2M16 7v2M8 12v2M16 12v2M10 21v-4h4v4"/>',
  reports: '<path d="M14 2H5v20h14V7Z M14 2v6h5M8 12h8M8 16h8"/>',
  inventory: '<path d="m3 7 9-5 9 5v10l-9 5-9-5Z M3 7l9 5 9-5M12 12v10M7 4l10 6"/>',
  billing: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3M17 3v4"/>',
  analytics: '<path d="M3 3v18h18M7 16v-4M12 16V7M17 16v-7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  left: '<path d="m15 5-7 7 7 7"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v1"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  print: '<path d="M6 9V3h12v6M6 18H3V9h18v9h-3M6 14h12v7H6Z"/>',
  alert: '<path d="m12 3 10 18H2Z M12 9v5M12 17v1"/>',
};
const icon = name => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.reports}</svg>`;
const allowed = (action, id = '') => { try { assertDemoAction(actor, action, state, id); return true; } catch { return false; } };
const button = (label, action, id = '', className = 'button') => allowed(action, id) ? `<button type="button" class="${className}" data-action="${action}" data-id="${e(id)}">${label}</button>` : '';
const badge = status => `<span class="badge ${status === 'Completed' || status === 'Paid' ? 'success' : status === 'In progress' || status === 'Partially paid' ? 'progress' : status === 'Overdue' || status === 'Payment overdue' || status === 'Low stock' ? 'warning' : ''}">${status === 'Completed' ? icon('check') : ''}${e(status)}</span>`;
function servicePayment(visit, details = true) {
  if (!can(actor, 'commercial') || shownStatus(visit) !== 'Completed') return '';
  const savedReport = state.reports.find(r => r.visitId === visit.id);
  if (savedReport && !approved(savedReport)) return '<small>Billing follows approval</small>';
  const invoice = state.invoices.find(i => i.visitId === visit.id);
  if (!invoice) return `<span class="service-payment">${badge('Payment not linked')}${details ? '<small>Review existing billing before tracking.</small>' : ''}</span>`;
  const payment = paymentSummary(invoice, DEMO_DATE);
  const label = payment.status === 'Unpaid' ? 'Awaiting payment' : payment.status === 'Overdue' ? 'Payment overdue' : payment.status;
  return `<span class="service-payment">${badge(label)}${details ? `<small>${e(payment.timing)} · ${money(payment.balance)} balance</small>` : ''}</span>`;
}
const empty = (title, description) => `<div class="empty">${icon('search')}<h3>${e(title)}</h3><p>${e(description)}</p></div>`;
const route = () => { const [view, search] = location.hash.slice(1).split('?'); return { view: view || 'overview', params: new URLSearchParams(search) }; };
const go = (view, values = {}) => { location.hash = `${view}${Object.keys(values).length ? `?${new URLSearchParams(values)}` : ''}`; };
function changeParam(key, value) { const { view, params } = route(); value ? params.set(key, value) : params.delete(key); go(view, Object.fromEntries(params)); }
function notify(message) {
  const toast = document.querySelector('#toast');
  clearTimeout(toastTimer); toast.textContent = message; toast.classList.add('visible');
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 5500);
}
function persist(message) {
  try {
    if (legacyBackup) {
      const key = 'zealpro.demo.v1.backup';
      const existing = localStorage.getItem(key);
      if (existing !== legacyBackup) localStorage.setItem(existing ? `${key}.${Date.now()}` : key, legacyBackup);
      legacyBackup = '';
    }
    localStorage.setItem(STORE, JSON.stringify(state)); storageWarning = '';
  }
  catch { storageWarning = 'Browser storage is unavailable. Changes work in this tab but will be lost when it closes.'; }
  render(); notify(storageWarning || message);
}

const navigation = [['overview', 'Overview'], ['schedule', 'Schedule'], ['services', 'Services'], ['ocular', 'Ocular visits'], ['clients', 'Clients & branches'], ['reports', 'Service reports'], ['inventory', 'Products & stock'], ['billing', 'Billing & collection'], ['analytics', 'Pest analytics'], ['settings', 'Staff & access'], ['activity', 'Activity history']];
function render() {
  if (actor) actor = currentProfile(state, actor);
  document.body.dataset.role = actor?.role || '';
  if (!actor) { if(dialog.open){dialog.close();dialog.innerHTML='';} document.title = 'Zealpro | Demo sign in'; app.innerHTML = demoLogin(); return; }
  screen = scopeWorkspace(state, actor);
  screen.visits = screen.visits.map(v => ({ ...v, status: shownStatus(v) }));
  const { view, params } = route();
  const requested = navigation.some(([key]) => key === view) ? view : 'overview';
  const blocked = !canView(actor, requested);
  const active = blocked ? 'overview' : requested;
  document.title = `Zealpro | ${navigation.find(([key]) => key === active)[1]}`;
  app.innerHTML = `<aside class="sidebar" id="navigation" aria-label="Main navigation">
    <a class="brand" href="#overview" aria-label="Zealpro overview"><img src="/assets/zealpro-logo.png" width="1052" height="384" alt="Zealpro Solutions Incorporated — Pest and Pathogen Management"></a>
    <div class="workspace"><span class="workspace-mark">${icon('services')}</span><div><strong>Operations workspace</strong><span>Zealpro Solutions Inc.</span></div></div>
    <div class="nav-label">Workspace</div><nav>${navigation.filter(([key]) => canView(actor, key)).map(([key, label], i) => `${key === 'services' ? '<div class="nav-label nav-divider">Business management</div>' : ''}<a href="#${key}" ${active === key ? 'aria-current="page"' : ''}>${icon(key)}<span>${label}</span>${key === 'schedule' ? `<span class="nav-count">${screen.visits.filter(v => v.date === DEMO_DATE && v.status !== 'Completed').length}</span>` : ''}</a>`).join('')}</nav>
    <div class="sidebar-foot">${button(`${icon('info')} Demo guide`, 'guide', '', 'guide-button')}<div class="user"><span class="avatar navy">${initials(actor.name)}</span><div><strong>${e(actor.displayName || actor.name)}</strong><span>${e(actor.label)} / Demo access</span></div></div></div></aside>
    <div class="mobile-bar">${button(icon('menu'), 'menu', '', 'icon-button menu-button')}<a href="#overview">Zealpro</a><span class="demo-label">UI demo</span></div>
    <main id="main" data-role="${actor.role}" tabindex="-1"><div class="utility"><div class="breadcrumb">Workspace ${icon('chevron')} <span>${navigation.find(([key]) => key === active)[1]}</span></div><div class="utility-actions">${button('Sign out', 'logout', '', 'button small-button')}<form class="global-search" data-form="global-search">${icon('search')}<input name="q" aria-label="Search client branches" placeholder="Search client branches…"><kbd>Enter</kbd></form><span class="demo-label">Presentation mode</span>${button(icon('info'), 'guide', '', 'icon-button help-button')}</div></div>
    ${screen.reports.some(r => !r.financialsConfirmed) || screen.visits.some(v => v.estimateBasis) ? `<div class="finance-notice">${icon('info')}<span>Older reports need actual charges and costs confirmed before they count toward recorded contribution.${screen.visits.some(v => v.estimateBasis) ? ' Legacy estimates use current product costs and omit unrecorded expenses.' : ''}</span><a href="#reports">Review reports</a></div>` : ''}
    ${screen.materials.some(p => p.legacyFractionalPieces) ? `<div class="finance-notice">${icon('info')}<span>Imported fractional piece quantities were preserved. Review affected stock and reports; new piece quantities must be whole numbers.</span></div>` : ''}
    ${storageWarning ? `<div class="storage-warning" role="alert">${icon('alert')}${e(storageWarning)}</div>` : ''}
    <div class="canvas">${blocked ? '<p class="role-notice" role="status">That view is not available for your role. Your overview is shown.</p>' : ''}<p class="role-notice">${e(actor.label)} demo access${actor.role === 'technician' ? ' / Assigned work only' : ''}. Browser-local role preview; not secure hosted authentication.</p>${({ overview, schedule, services, ocular, clients, reports, inventory, billing, analytics, settings: params => settingsView(uiContext(), params), activity: params => activityView(uiContext(), params) }[active])(params)}</div>
    <footer class="page-footer"><span>Zealpro Solutions Incorporated</span><span>Illustrative data. Changes saved in this browser only.</span></footer></main>`;
  document.querySelector('.menu-button')?.setAttribute('aria-label', 'Open navigation');
  document.querySelector('.menu-button')?.setAttribute('aria-expanded', 'false');
  document.querySelector('.help-button')?.setAttribute('aria-label', 'Open demo guide');
}
function heading(title, description, action = '') { return `<header class="page-heading"><div><h1>${title}</h1><p>${description}</p></div><div class="heading-actions">${action}</div></header>`; }
function metric(label, value, note, className = '') { if (!can(actor, 'commercial') && ['Projected service value', 'Accounts receivable', 'On-hand stock value'].includes(label)) return ''; return `<div class="metric ${className}"><span>${label}</span><strong>${value}</strong><small>${note}</small></div>`; }
function panelHead(title, subtitle = '', action = '') { return `<div class="panel-heading"><div><h2>${title}</h2>${subtitle ? `<p>${subtitle}</p>` : ''}</div>${action}</div>`; }
function visitRows(visits, compact = false) {
  return visits.map(v => { const c = client(v.clientId); return `<tr><td class="time-cell"><strong>${timeLabel(v.time)}</strong>${compact ? '' : `<small>${dateLabel(v.date, { month: 'short', day: 'numeric' })}</small>`}</td><td><button class="identity-link" data-action="visit" data-id="${e(v.id)}">${e(c.name)}</button><small>${e(c.branch)}</small></td><td>${e(v.treatment)}</td><td><span class="person"><span class="avatar small ${STAFF.indexOf(v.technician) % 2 ? 'cyan' : ''}">${initials(v.technician)}</span>${e(personnel(v).join(", "))}</span></td><td>${badge(v.status)}${servicePayment(v)}</td><td>${button(icon('chevron')+'<span class="sr-only">Open visit for '+e(c.name)+'</span>', 'visit', v.id, 'icon-button row-action')}</td></tr>`; }).join('');
}
function visitsTable(visits, compact = false) { return visits.length ? `<div class="table-scroll"><table class="visit-table"><thead><tr><th>Time</th><th>Client / branch</th><th>Treatment</th><th>Technician</th><th>Status</th><th><span class="sr-only">Details</span></th></tr></thead><tbody>${visitRows(visits, compact)}</tbody></table></div>` : empty('No services found', 'Choose another date or filter, or schedule a service.'); }
function overview(params) {
  const totals = summary({ ...screen, visits: screen.visits.filter(v => v.status !== 'Cancelled') }, DEMO_DATE);
  const status = params.get('status') || 'all';
  const dayVisits = screen.visits.filter(v => v.date === DEMO_DATE && v.status !== 'Cancelled');
  const visible = dayVisits.filter(v => status === 'all' || (status === 'pending' ? v.status !== 'Completed' : v.status === 'Completed'));
  const overdue = screen.invoices.filter(i => i.due < DEMO_DATE && i.paid < i.amount);
  const low = screen.materials.filter(m => m.active && m.stock < m.minimum);
  const completed = totals.completed / (totals.scheduled || 1);
  return `<section class="operations-band" aria-label="Today's operations">${heading('Operations overview', 'Protect every site. Keep every service accountable.', `${button(`${icon('plus')} Schedule service`, 'new-visit', '', 'button primary')}`)}
    <div class="date-line"><span>${icon('schedule')} Monday, 2 November 2026</span><span>Sample working day <span class="time-label">11:30 AM</span></span></div>
    <section class="metrics" aria-label="Operations summary">${metric('Scheduled services', totals.scheduled, `Across ${new Set(dayVisits.map(v => v.clientId)).size} client branches`)}${metric('Completed services', totals.completed, `${totals.scheduled - totals.completed} visits still to fulfill`, 'completed-metric')}${metric('Projected service value', money(totals.projected), 'Scheduled value for this day')}${metric('Accounts receivable', money(totals.receivable), `${overdue.length} overdue invoice${overdue.length === 1 ? '' : 's'}`)}</section></section>
    ${reviewSummary()}<div class="overview-grid"><section class="panel schedule-panel">${panelHead('Service schedule', `${dayVisits.length} planned visits for the sample day`, '<a class="text-link" href="#schedule">Open calendar '+icon('chevron')+'</a>')}<div class="tabs"><a href="#overview?status=all" ${status === 'all' ? 'aria-current="page"' : ''}>All services <span>${dayVisits.length}</span></a><a href="#overview?status=pending" ${status === 'pending' ? 'aria-current="page"' : ''}>Needs action <span>${totals.scheduled - totals.completed}</span></a><a href="#overview?status=completed" ${status === 'completed' ? 'aria-current="page"' : ''}>Completed <span>${totals.completed}</span></a></div>${visitsTable(visible.slice(0, 4), true)}<div class="panel-foot"><span>Showing ${Math.min(4, visible.length)} of ${visible.length} services</span><a href="#schedule?date=${DEMO_DATE}">View full schedule ${icon('chevron')}</a></div></section>
    <aside class="overview-rail"><section class="panel fulfillment">${panelHead('Daily fulfillment')}<div class="donut-wrap"><svg class="donut" viewBox="0 0 160 160" role="img" aria-label="${totals.completed} of ${totals.scheduled} services completed"><circle class="donut-track" cx="80" cy="80" r="62"/><circle class="donut-value" cx="80" cy="80" r="62" stroke-dasharray="${completed * 389.56} 389.56" transform="rotate(-90 80 80)"/></svg><div class="donut-text"><strong>${Math.round(completed * 100)}<small>%</small></strong><span>completed</span></div></div><div class="fulfillment-legend"><span><i class="swatch lime"></i>Completed <b>${totals.completed}</b></span><span><i class="swatch neutral"></i>Remaining <b>${totals.scheduled - totals.completed}</b></span></div></section>
    <section class="attention"><h2>Needs your attention <b class="attention-count">${overdue.length + low.length}</b></h2>${low.map(m => `<a href="#inventory" class="attention-row">${icon('inventory')}<div><strong>${e(m.name)}</strong><span>${m.stock} ${e(m.unit)} left, below reorder level</span></div>${icon('chevron')}</a>`).join('')}${!low.length && !overdue.length ? '<p class="all-clear">No overdue invoices or low-stock materials.</p>' : ''}${overdue.length ? `<a href="#billing?status=overdue" class="attention-row">${icon('billing')}<div><strong>${money(overdue.reduce((n, i) => n + i.amount - i.paid, 0))} overdue</strong><span>${overdue.length} account awaiting collection</span></div>${icon('chevron')}</a>` : ''}</section></aside>
    ${can(actor, 'analytics') ? `<section class="panel trend-panel">${panelHead('Pest activity trend', 'Recorded sightings across sample branches', '<a class="text-link" href="#analytics">View analytics '+icon('chevron')+'</a>')}${trendChart('all', true)}</section>` : ''}<section class="panel recent-panel">${panelHead('Latest service reports', 'Fieldwork, documented.', '<a class="text-link" href="#reports">View all '+icon('chevron')+'</a>')}<div class="report-list">${[...screen.reports].reverse().slice(0, 3).map(r => `<button class="report-list-row" data-action="report" data-id="${e(r.id)}"><span class="document-icon">${icon('reports')}</span><span><strong>${e(client(r.clientId).name)}</strong><small>${e(r.treatment)} / ${timeLabel(r.timeOut)}</small></span>${icon('chevron')}</button>`).join('')}</div></section></div>`;
}
function profitBand(totals, label) {
  if (!can(actor, 'finance')) return '';
  return `<section class="profit-band" aria-label="${e(label)} profitability"><div class="profit-band-title"><span>${e(label)}</span><span>${totals.visits} planned services / ${totals.completed} confirmed reports</span></div><div class="profit-figures">
    <div><span>Estimated contribution</span><strong>${money(totals.theoreticalProfit)}</strong><small>All services in this view</small></div>
    <div><span>Recorded contribution</span><strong>${totals.actualProfit === null ? '<span class="not-recorded">Not recorded</span>' : money(totals.actualProfit)}</strong><small>${totals.completed} completed, financially confirmed</small></div>
    <div><span>Actual vs. estimate</span><strong class="${totals.variance !== null && totals.variance < 0 ? 'profit-down' : 'profit-up'}">${totals.variance === null ? '—' : `${totals.variance > 0 ? '+' : ''}${money(totals.variance)}`}</strong><small>Same completed services only</small></div>
    <div><span>Scheduled service value</span><strong>${money(totals.revenue)}</strong><small>${totals.unconfirmed ? `${totals.unconfirmed} reports await financial review` : 'Based on quoted charges'}</small></div></div>
    <p>Contribution after direct job costs = service charge − product costs − recorded expenses. Before unrecorded overhead and tax; independent of payment collection.</p></section>`;
}
function yearCalendar(selected) {
  const year = selected.slice(0, 4), occupied = new Set(screen.visits.filter(v => v.status !== 'Cancelled').map(v => v.date));
  return `<div class="year-calendar" role="group" aria-label="Months in ${year}"><div class="year-months">${Array.from({ length: 12 }, (_, index) => {
    const prefix = `${year}-${String(index + 1).padStart(2, '0')}`, date = `${prefix}-01`;
    const range = calendarRange(date, 'month'), totals = periodProfit(range.start, range.end);
    const offset = (new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7, days = Number(range.end.slice(-2));
    const active = selected.startsWith(prefix), target = active ? selected : date;
    const label = dateLabel(date, { month: 'long', year: 'numeric' });
    return `<a class="year-month ${active ? 'selected-month' : ''}" href="#schedule?date=${target}&view=month" aria-label="Open ${e(label)}, ${totals.visits} services${can(actor, 'finance') ? `, contribution estimate ${money(totals.theoreticalProfit)}` : ''}"><span class="year-month-heading"><strong>${dateLabel(date, { month: 'long' })}</strong><span>${totals.visits} service${totals.visits === 1 ? '' : 's'}</span></span><span class="mini-weekdays" aria-hidden="true">${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(day => `<span>${day}</span>`).join('')}</span><span class="mini-days" aria-hidden="true">${Array.from({ length: 42 }, (_, cell) => {
      const day = cell - offset + 1;
      if (day < 1 || day > days) return '<span></span>';
      const value = `${prefix}-${String(day).padStart(2, '0')}`;
      return `<span class="${occupied.has(value) ? 'has-services' : ''} ${value === selected ? 'selected' : ''}">${day}</span>`;
    }).join('')}</span>${finance(`<span class="year-month-profit"><span><small>Theoretical</small><b>${money(totals.theoreticalProfit)}</b></span><span><small>Actual</small><b>${totals.actualProfit === null ? 'Not recorded' : money(totals.actualProfit)}</b></span></span>`)}</a>`;
  }).join('')}</div></div>`;
}

function schedule(params) {
  let selected = params.get('date') || DEMO_DATE;
  const view = CALENDAR_VIEWS.includes(params.get('view')) ? params.get('view') : 'month';
  let range;
  try { range = calendarRange(selected, view); } catch { selected = DEMO_DATE; range = calendarRange(selected, view); }
  const title = view === 'year' ? selected.slice(0, 4) : view === 'month' ? dateLabel(range.start, { month: 'long', year: 'numeric' }) : view === 'day' ? dateLabel(selected, { weekday: 'long', month: 'short', day: 'numeric' }) : `${dateLabel(range.start, { month: 'short', day: 'numeric' })} – ${dateLabel(range.end)}`;
  const allDay = screen.visits.filter(v => v.date === selected && v.status !== 'Cancelled').sort((a, b) => a.time.localeCompare(b.time));
  const status = params.get('status') || 'all';
  const visible = allDay.filter(v => status === 'all' || v.status === status);
  const totals = periodProfit(range.start, range.end), dayTotals = periodProfit(selected, selected);
  const dates = [];
  if (view !== 'year') for (let date = new Date(`${range.start}T12:00:00Z`); date.getTime() <= Date.parse(`${range.end}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + 1)) dates.push(date.toISOString().slice(0, 10));
  const offset = view === 'month' ? (new Date(`${range.start}T12:00:00Z`).getUTCDay() + 6) % 7 : 0;
  const grid = view === 'year' ? yearCalendar(selected) : view === 'day' ? `<div class="day-agenda">${allDay.length ? allDay.map(v => `<button type="button" class="agenda-row" data-action="visit" data-id="${e(v.id)}"><span class="agenda-time">${timeLabel(v.time)}</span><span><strong>${e(client(v.clientId).name)}</strong><small>${e(v.treatment)} / ${e(v.technician)}</small></span>${finance(`<span class="agenda-profit">${money(v.rate - productCost(v.estimatedProducts) - v.plannedExpense)}<small>estimated contribution</small></span>`)}<span class="agenda-status">${badge(v.status)}${servicePayment(v)}</span></button>`).join('') : empty('No services on this day', 'Schedule a service to start planning this day.')}</div>` : `<div class="calendar-weekdays">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => `<span>${day}</span>`).join('')}</div><div class="calendar-grid ${view === 'week' ? 'week-grid' : ''}">${Array.from({ length: offset }, () => '<div class="calendar-day outside" aria-hidden="true"></div>').join('')}${dates.map(date => {
      const items = screen.visits.filter(v => v.date === date && v.status !== 'Cancelled').sort((a, b) => a.time.localeCompare(b.time));
      return `<a class="calendar-day ${date === selected ? 'selected' : ''} ${items.length ? 'has-services' : ''}" href="#schedule?date=${date}&view=${view}" ${date === selected ? 'aria-current="date"' : ''} aria-label="${dateLabel(date)}, ${items.length} services"><span class="day-number">${Number(date.slice(-2))}</span>${items.length ? `<span class="calendar-event">${items.length} service${items.length === 1 ? '' : 's'}</span>${items.slice(0, view === 'week' ? 3 : 1).map(v => `<small class="calendar-client">${e(client(v.clientId).name)}</small>`).join('')}${view === 'week' && can(actor, 'finance') ? `<span class="cell-profit">${money(periodProfit(date, date).theoreticalProfit)}<small>theoretical</small></span>` : ''}` : ''}</a>`;
    }).join('')}${view === 'month' ? Array.from({ length: (7 - (dates.length + offset) % 7) % 7 }, () => '<div class="calendar-day outside" aria-hidden="true"></div>').join('') : ''}</div>`;
  return `${heading('Service calendar', 'Assign personnel, reserve materials and track fieldwork through approval.', button(`${icon('plus')} Schedule service`, 'new-visit', selected, 'button primary'))}
    <div class="calendar-topline"><div class="view-switch" aria-label="Calendar view">${CALENDAR_VIEWS.map(mode => `<a href="#schedule?date=${selected}&view=${mode}" ${mode === view ? 'aria-current="page"' : ''}>${mode[0].toUpperCase()+mode.slice(1)}</a>`).join('')}</div><span class="muted">${dateLabel(range.start)} – ${dateLabel(range.end)}</span></div>
    ${profitBand(totals, `${view[0].toUpperCase()+view.slice(1)} view`)}
    <div class="calendar-layout"><section class="panel calendar-panel"><div class="calendar-toolbar"><h2>${e(title)}</h2><div>${button(icon('left')+'<span class="sr-only">Previous period</span>', 'calendar-prev', selected, 'icon-button')}${button('Sample day', 'sample-day', '', 'button small-button')}${button(icon('chevron')+'<span class="sr-only">Next period</span>', 'calendar-next', selected, 'icon-button')}</div></div>${grid}<div class="calendar-key"><span class="calendar-key-mark"></span>Scheduled service${view === 'month' ? '<span class="calendar-outside-label"><i aria-hidden="true"></i>Outside this month</span>' : ''}<span>${view === 'year' ? 'Open a month to plan its services.' : 'Choose a day to see its details.'}</span></div></section>
    <aside class="day-detail panel" aria-label="Selected day details"><div class="day-detail-heading"><strong class="day-detail-number">${Number(selected.slice(-2))}</strong><div><h2>${dateLabel(selected, { weekday: 'long' })}</h2><p>${dateLabel(selected, { month: 'long', year: 'numeric' })}</p></div><span>${allDay.length} services</span></div>
      ${finance(`<div class="day-profits"><div><span>Estimated contribution</span><strong>${money(dayTotals.theoreticalProfit)}</strong></div><div><span>Recorded contribution</span><strong>${dayTotals.actualProfit === null ? 'Not recorded' : money(dayTotals.actualProfit)}</strong></div></div>
      `)}<div class="day-detail-filter"><h3>Day’s services</h3><label class="sr-only" for="day-status">Filter day services</label><select id="day-status" data-param="status"><option value="all">All statuses</option>${options(['Scheduled', 'Assigned', 'In progress', 'Draft', 'Submitted', 'Returned', 'Completed'], status)}</select></div>
      <div class="dispatch-list">${visible.length ? visible.map(v => { const report = screen.reports.find(r => r.visitId === v.id); return `<button type="button" class="dispatch-row" data-action="visit" data-id="${e(v.id)}"><span class="dispatch-row-top"><span>${timeLabel(v.time)}</span>${badge(v.status)}</span><strong>${e(client(v.clientId).name)}</strong><small>${e(client(v.clientId).branch)} / ${e(v.treatment)}</small>${servicePayment(v)}<span class="dispatch-row-foot"><span class="person"><span class="avatar small">${initials(v.technician)}</span>${e(personnel(v).join(", "))}</span>${finance(`<span>${report?.financialsConfirmed && approved(report) ? money(report.actualRevenue - productCost(report.products) - report.expense)+' actual' : money(v.rate - productCost(v.estimatedProducts) - v.plannedExpense)+' est.'}</span>`)}</span></button>`; }).join('') : empty('No services in this view', 'Change the status filter or select another day.')}</div>
      <div class="day-detail-footer">${button(icon('plus')+' Add service for this day', 'new-visit', selected, 'button')}</div></aside></div>`;
}
function services(params) {
  const archived = params.get('status') === 'archived', query = (params.get('q') || '').toLowerCase();
  const visible = screen.services.filter(s => s.active !== archived && `${s.name} ${s.description}`.toLowerCase().includes(query));
  return `${heading('Services', 'Treatment methods, instructions and estimated materials.', button(icon('plus')+' Define service', 'service-form', '', 'button primary'))}<div class="catalog-toolbar"><div class="tabs standalone"><a href="#services">Active services</a><a href="#services?status=archived">Archived</a></div>${searchBar('Search services', params)}</div><div class="service-catalog">${visible.map(service => {
    const cost = service.products.reduce((total, p) => total + p.quantity * material(p.productId).cost, 0);
    return `<article class="service-card"><div class="service-card-heading"><span class="service-symbol">${icon('services')}</span>${badge(service.active ? 'Active service' : 'Archived')}</div><h2>${e(service.name)}</h2><p class="service-description">${e(service.description)}</p>${commercial(`<div class="service-price"><strong>${money(service.price)}</strong><span>Owner-approved default charge</span></div>`)}<div class="recipe"><h3>Estimated products</h3>${service.products.map(p => `<div><span>${e(material(p.productId).name)}</span><strong>${p.quantity} ${e(material(p.productId).unit)}</strong></div>`).join('') || '<p>No products planned.</p>'}</div>${can(actor,'commercial')||service.products.every(p=>screen.materials.some(m=>m.id===p.productId))?costs(`<div class="service-economics"><span>Product cost <b>${formatMoney(cost)}</b></span><span>Field expenses <b>${formatMoney(service.plannedExpense)}</b></span>${finance(`<span>Estimated contribution <b>${money(service.price-cost-service.plannedExpense)}</b></span>`)}</div>`):''}<div class="service-card-actions">${button('Edit service', 'service-form', service.id, 'button small-button')}${button(service.active ? 'Archive' : 'Restore', service.active ? 'catalog-archive' : 'catalog-restore', 'services:'+service.id, 'text-button')}${actor.role === 'admin' ? button('Suggest rate change', 'rate-request', service.id, 'text-button') : ''}</div></article>`;
  }).join('') || empty('No services found', 'Change the search or status filter.')}</div>`;
}
function searchBar(placeholder, params) { return `<form class="filter-search" data-form="filter">${icon('search')}<input name="q" aria-label="${e(placeholder)}" value="${e(params.get('q') || '')}" placeholder="${e(placeholder)}"><button type="submit" class="button small-button">Search</button></form>`; }
function clients(params) {
  const query = (params.get('q') || '').toLowerCase();
  const visible = screen.clients.filter(c => [c.name,c.branch,c.address,c.contactPerson,c.contact,c.phone,c.email].join(' ').toLowerCase().includes(query));
  return `${heading('Clients & branches', can(actor,'commercial') ? 'Branch contacts, service agreements and account history.' : 'Assigned branch locations, contacts and job history.', button(icon('plus')+' Enroll client', 'new-client', '', 'button primary'))}${searchBar('Search clients or contacts',params)}<section class="panel"><div class="table-scroll"><table><thead><tr><th>Client / branch</th><th>Contact</th>${commercial('<th>Agreement / rate</th>')}<th>Status</th><th>Action</th></tr></thead><tbody>${visible.map(c=>`<tr><td><strong>${e(c.name)}</strong><small>${e(c.branch)} / ${e(c.address)}</small></td><td>${e(c.contactPerson || c.contact || 'Not provided')}<small>${e(c.phone || c.email || '')}</small></td>${commercial(`<td>${e(c.package)}<small>${e(c.duration)} / ${money(c.rate)} per service</small></td>`)}<td>${badge(state.presentation.clients?.[c.id]?.status || 'Active')}</td><td>${button('View branch','client',c.id,'button small-button')}${button('Edit details','edit-client',c.id,'text-button')}</td></tr>`).join('')}</tbody></table></div>${visible.length?'':empty('No matching branches','Search assigned branch contacts or clear your filter.')}</section>`;
}
function ocular(params) {
  const drafts=Object.entries(state.presentation.assessmentDrafts).filter(([,d])=>actor.role==='owner'||actor.role==='admin'||d.actorId===actor.id);
  return `${heading('Ocular visits','Per-area findings, review decisions and approved recommendations.',button(icon('plus')+' New assessment','new-assessment','','button primary'))}${drafts.length?`<section class="draft-strip"><h2>Inspection drafts</h2>${drafts.map(([id,d])=>button(`Continue ${d.values.accountName||d.values.branch||'inspection draft'}`,'edit-assessment',id,'button small-button')).join('')}</section>`:''}<section class="panel">${panelHead('Site assessments','Inspect, submit, return and approve')}<div class="assessment-list">${[...screen.assessments].reverse().map(a=>{const meta=assessmentMeta(state,a.id);return `<article class="assessment"><div class="assessment-date"><strong>${dateLabel(a.date,{day:'numeric'})}</strong><span>${dateLabel(a.date,{month:'short'})}</span></div><div><h3>${e(assessmentAccount(a).name)}</h3><span>${e(assessmentAccount(a).branch)}</span><p>${e(a.assessor)} / ${timeLabel(a.time)}</p><p>${assessmentFindings(a).length} findings</p>${badge(meta.status)}</div><div class="assessment-actions">${button('View findings','ocular-detail',a.id,'button small-button')}${meta.status==='Submitted'?button('Review inspection','review-assessment',a.id,'text-button'):''}${['Draft','Returned'].includes(meta.status)?button('Edit draft','edit-assessment',a.id,'text-button'):''}${meta.status==='Approved'?a.clientId?button('Plan service','assessment-schedule',a.id,'text-button'):button('Enroll client','new-client',a.id,'text-button'):''}</div></article>`;}).join('')||empty('No inspections submitted','Save a draft or submit an inspection for review.')}</div></section>`;
}
function reports(params) {
  if (params.get('tab') === 'cumulative') return cumulativeView(params);
  const query=(params.get('q')||'').toLowerCase(), status=params.get('status')||'all';
  const visible=screen.reports.filter(r=>`${r.id} ${client(r.clientId).name} ${r.treatment}`.toLowerCase().includes(query) && (status==='all'||reportMeta(state,r.id).status===status));
  const drafts=Object.entries(state.presentation.drafts).filter(([id,d])=>screen.visits.some(v=>v.id===id) && (actor.role!=='technician'||d.actorId===actor.id));
  return `${heading('Service reports','Draft, submit, review and finalize fieldwork.',button(icon('plus')+' Record fieldwork','choose-report','','button primary'))}${reportTabs()}<div class="report-note">${icon('reports')}<span>Submitting posts actual stock usage. Supervisor approval locks the report and creates billing. Customer acknowledgment remains uncollected.</span></div><div class="tabs standalone">${['all','Submitted','Returned','Approved'].map(s=>`<a href="#reports?status=${s}" ${status===s?'aria-current="page"':''}>${s==='all'?'All reports':s}</a>`).join('')}</div>${drafts.length?`<section class="draft-strip"><h2>Saved field drafts</h2>${drafts.map(([id])=>button(`Continue ${client(state.visits.find(v=>v.id===id).clientId).branch}`,'complete',id,'button small-button')).join('')}</section>`:''}<div class="list-toolbar">${searchBar('Search report or client',params)}<span>${visible.length} reports</span></div><section class="panel"><div class="table-scroll"><table><thead><tr><th>Report / date</th><th>Client / branch</th><th>Activity / personnel</th><th>Review status</th>${commercial('<th>Payment</th>')}<th>Action</th></tr></thead><tbody>${[...visible].reverse().map(r=>`<tr><td><strong>${e(r.id.startsWith('SR-2026')?r.id:'SR-'+r.id.slice(-8).toUpperCase())}</strong><small>${dateLabel(r.date)}</small></td><td>${e(client(r.clientId).name)}<small>${e(client(r.clientId).branch)}</small></td><td>${e(r.treatment)}<small>${e(personnel(state.visits.find(v=>v.id===r.visitId)).join(', '))}</small></td><td>${badge(reportMeta(state,r.id).status)}<small>${e(reportMeta(state,r.id).approvalRef || 'Awaiting finalization')}</small></td>${commercial(`<td>${approved(r)?servicePayment(state.visits.find(v=>v.id===r.visitId)):'Billing follows approval'}</td>`)}<td>${button('View report','report',r.id,'button small-button')}${reportMeta(state,r.id).status==='Submitted'&&reviewable(r)?button('Review submission','review-report',r.id,'text-button'):''}${reportMeta(state,r.id).status==='Returned'&&can(actor,'submitReports')?button('Correct draft','complete',r.visitId,'text-button'):''}</td></tr>`).join('')}</tbody></table></div>${visible.length?'':empty('No reports in this view','Submitted fieldwork will appear here for review.')}</section>`;
}
function inventory(params) {
  const archived=params.get('status')==='archived', active=screen.materials.filter(p=>p.active), visible=screen.materials.filter(p=>p.active!==archived);
  return `${heading('Products & stock','Reservations, actual consumption and reviewed stock movements.',button(icon('plus')+' Define product','product-form','','button primary'))}<section class="metrics three">${metric('Active products',active.length,'Products relevant to your scope')}${metric('Below reorder level',active.filter(p=>p.stock<p.minimum).length,'Based on on-hand quantities')}${commercial(metric('On-hand stock value',money(active.reduce((n,p)=>n+p.stock*p.cost,0)),'Catalog unit costs'))}</section><div class="tabs standalone"><a href="#inventory">Active products</a><a href="#inventory?status=archived">Archived products</a></div><section class="panel"><div class="table-scroll"><table><thead><tr><th>Product</th>${costs('<th>Unit cost</th>')}<th>On hand</th><th>Allocated</th><th>Available</th><th>Status</th><th>Action</th></tr></thead><tbody>${visible.map(p=>{const available=availableStock(state,p.id);return `<tr><td><strong>${e(p.name)}</strong><small>${e(p.description)}</small></td>${costs(`<td>${formatMoney(p.cost)}<small>per ${e(p.unit)}</small></td>`)}<td>${p.stock} ${e(p.unit)}</td><td>${Math.round((p.stock-available)*100)/100} ${e(p.unit)}</td><td>${available} ${e(p.unit)}</td><td>${badge(!p.active?'Archived':p.stock<p.minimum?'Low stock':'Sufficient')}</td><td>${button('Edit','product-form',p.id,'button small-button')}${p.active?button('Restock','restock',p.id,'button small-button')+button('Request adjustment','request-stock',p.id,'text-button'):''}${button(p.active?'Archive':'Restore',p.active?'catalog-archive':'catalog-restore','materials:'+p.id,'text-button')}</td></tr>`;}).join('')}</tbody></table></div></section>${inventoryExtras(uiContext())}`;
}
function billing(params) {
  const filter = params.get('status') || 'all';
  const filters = [['all', 'All invoices'], ['outstanding', 'All unpaid balances'], ['unpaid', 'Unpaid'], ['partial', 'Partially paid'], ['overdue', 'Overdue'], ['paid', 'Paid']];
  const visible = screen.invoices.filter(i => {
    const payment = paymentSummary(i, DEMO_DATE);
    return (!params.get('invoice') || i.id === params.get('invoice')) && (filter === 'all' || (filter === 'outstanding' ? payment.balance > 0 : filter === 'partial' ? i.paid > 0 && payment.balance > 0 : payment.status.toLowerCase() === filter));
  });
  return `${heading('Billing & collection', 'Approved services, verified payments and scheduled reminder previews.')}
    <section class="metrics three">${metric('Outstanding balance', money(summary(state, DEMO_DATE).receivable), 'All sample accounts')}${metric('Overdue balance', money(screen.invoices.filter(i => i.due < DEMO_DATE).reduce((n, i) => n + i.amount - i.paid, 0)), 'As of 2 November 2026')}${metric('Amount collected', money(screen.invoices.reduce((n, i) => n + i.paid, 0)), 'Across all sample invoices')}</section>
    <div class="report-note">${icon('info')}<span>Approved services are payable within 30 calendar days of delivery. Statuses shown as of ${dateLabel(DEMO_DATE)}, the sample day. Existing invoice terms are preserved.</span></div>
    <div class="tabs standalone">${filters.map(([key, label]) => `<a href="#billing?status=${key}" ${key === filter && !params.has('invoice') ? 'aria-current="page"' : ''}>${label}</a>`).join('')}</div>
    <section class="panel">${visible.length ? `<div class="table-scroll"><table class="billing-table"><thead><tr><th>Invoice / client</th><th>Service</th><th>Billing date</th><th>Due date</th><th class="numeric">Balance</th><th>Payment status</th><th>Action</th></tr></thead><tbody>${visible.map(i => {
      const payment = paymentSummary(i, DEMO_DATE);
      return `<tr><td><strong>${e(i.id)}</strong><small>${e(client(i.clientId).name)} / ${e(client(i.clientId).branch)}</small></td><td>${i.visitId ? badge(shownStatus(state.visits.find(v=>v.id===i.visitId))) + button('View service', 'visit', i.visitId, 'text-button') : '<small>Account invoice · no service link</small>'}</td><td>${dateLabel(i.date)}</td><td>${dateLabel(i.due)}<small>${e(payment.timing)}</small></td><td class="numeric"><strong>${money(payment.balance)}</strong><small>${money(i.paid)} paid of ${money(i.amount)}</small></td><td>${badge(payment.status)}</td><td class="action-cell">${payment.balance > 0 && (!i.visitId || state.reports.some(r=>r.visitId===i.visitId&&approved(r))) ? button('Record payment', 'payment', i.id, 'button small-button') + button('Preview reminder', 'reminder', i.id, 'text-button') + button('Schedule reminder','reminder-schedule',i.id,'text-button') + button('Payment history','payment-history',i.id,'text-button') : button('Payment history', 'payment-history', i.id, 'button small-button')}</td></tr>`;
    }).join('')}</tbody></table></div>` : empty('No invoices in this view', 'Choose another invoice status.')}</section>
    <p class="muted footnote">Local demonstration records only; these are not issued tax invoices. Reminder simulations do not send email or SMS.</p>${billingExtras(uiContext())}`;
}
function observations(scope) {
  return pestObservations({ ...screen, reports: screen.reports.filter(approved) }, scope);
}
function trendChart(scope = 'all', compact = false) {
  const data = observations(scope);
  if (!data.length) return empty('No pest observations yet', 'Complete a treatment with a pest count to begin a branch history.');
  const sorted = data.map(o => o.date.slice(0, 7)).sort(), last = sorted.at(-1);
  const cursor = new Date(`${last}-01T12:00:00Z`); cursor.setUTCMonth(cursor.getUTCMonth() - 11);
  const first = sorted[0] > cursor.toISOString().slice(0, 7) ? sorted[0] : cursor.toISOString().slice(0, 7);
  cursor.setTime(Date.parse(`${first}-01T12:00:00Z`));
  const months = [];
  for (let index = 0; index < 12 && cursor.toISOString().slice(0, 7) <= last; index++, cursor.setUTCMonth(cursor.getUTCMonth() + 1)) months.push(cursor.toISOString().slice(0, 7));
  const series = PESTS.filter(pest => data.some(o => o.pest === pest)).map(pest => ({ pest, values: months.map(month => data.filter(o => o.date.startsWith(month) && o.pest === pest).reduce((n, o) => n + o.count, 0)), recorded: months.map(month => data.some(o => o.date.startsWith(month) && o.pest === pest)) }));
  const max = Math.max(10, Math.ceil(Math.max(...series.flatMap(s => s.values)) / 10) * 10), chartHeight = compact ? 150 : 230;
  const y = value => 18 + chartHeight - value / max * chartHeight, x = i => 40 + i * 525 / Math.max(1, months.length - 1);
  return `<div class="chart-legend">${series.map((s, index) => `<span><i class="swatch series-${index}"></i>${e(s.pest)}</span>`).join('')}<small>Recorded sightings per month</small></div><svg class="trend-chart" viewBox="0 0 590 ${chartHeight + 52}" role="img" aria-label="Monthly recorded pest sightings, ${months[0]} through ${last}. Missing observations are not zero.">${[0, 0.5, 1].map(n => `<line class="chart-grid" x1="40" x2="565" y1="${y(n * max)}" y2="${y(n * max)}"/><text x="26" y="${y(n * max)+4}" text-anchor="end">${n * max}</text>`).join('')}${series.map((s, index) => `<path class="chart-line series-${index}" d="${s.values.map((value, i) => s.recorded[i] ? `${i > 0 && s.recorded[i - 1] ? 'L' : 'M'} ${x(i)} ${y(value)}` : '').join(' ')}"/>${s.values.map((value, i) => s.recorded[i] ? `<circle class="chart-point series-${index}" cx="${x(i)}" cy="${y(value)}" r="3.5"><title>${e(s.pest)}, ${months[i]}: ${value}</title></circle>` : '').join('')}`).join('')}${months.map((m, i) => `<text x="${x(i)}" y="${chartHeight+43}" text-anchor="middle">${dateLabel(m+'-01', { month: 'short', year: '2-digit' })}</text>`).join('')}</svg><p class="chart-caption">Source: historical demonstration observations plus saved service-report counts. Up to 12 calendar months ending at the latest observation. Gaps mean no record; periods may be incomplete. Ocular findings are qualitative and do not add counts.</p>`;
}
function comparisonText(report) {
  const previous=observations(report.clientId).filter(o=>o.pest===report.pest&&o.date<report.date).sort((a,b)=>b.date.localeCompare(a.date))[0];
  return previous?`${previous.count} ${e(report.pest)} previously on ${dateLabel(previous.date)}; ${report.pestCount} this visit. Recorded sightings do not establish treatment effectiveness.`:`${report.pestCount} ${e(report.pest)} this visit. No earlier comparable observation.`;
}
function comparisonTable(scope) {
  const data=observations(scope),groups=new Map();
  for(const row of data){const key=JSON.stringify([row.clientId,row.pest]);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row);}
  return `<section class="panel comparison-panel">${panelHead('Previous vs current observations','Latest comparable records by branch and pest; no-data periods are not zero.')}<div class="table-scroll"><table><thead><tr><th>Branch / pest</th><th>Previous</th><th>Current</th><th>Recorded change</th><th>Latest source</th></tr></thead><tbody>${[...groups.values()].map(rows=>{rows.sort((a,b)=>a.date.localeCompare(b.date));const current=rows.at(-1),previous=rows.filter(r=>r.date<current.date).at(-1);return `<tr><td>${e(client(current.clientId).name)} / ${e(client(current.clientId).branch)}<small>${e(current.pest)}</small></td><td>${previous?previous.count+'<small>'+dateLabel(previous.date)+'</small>':'No earlier record'}</td><td>${current.count}<small>${dateLabel(current.date)}</small></td><td>${previous?current.count-previous.count:'Not comparable'}</td><td>${e(current.sourceLabel)}${current.sourceKind==='report'?button('View source report','report',current.sourceId,'text-button'):''}</td></tr>`;}).join('')||'<tr><td colspan="5">No observations in your scope.</td></tr>'}</tbody></table></div></section>`;
}
function analytics(params) {
  const scope = screen.clients.some(c => c.id === params.get('client')) ? params.get('client') : 'all', data = observations(scope);
  return `${heading('Pest analytics', 'Inspect the observations behind each graph.', `<label class="inline-label">Branch <select data-param="client"><option value="all">All client branches</option>${clientOptions(scope)}</select></label>`)}<div class="report-note">${icon('info')}<span>The original 15 historical counts and 3 service reports are illustrative samples. Reports you save add their own pest counts. This is not an external/live data feed. Sources are listed below; counts do not prove treatment effectiveness.</span></div><section class="panel analytics-chart">${panelHead('Pest occurrence over time', 'Monthly sums from recorded observations')}${trendChart(scope)}</section>${comparisonTable(scope)}<section class="panel day-panel">${panelHead('Observation source records', 'Use a service-report link to inspect a contributing record')}<div class="table-scroll"><table><thead><tr><th>Client / branch</th><th>Observation date</th><th>Pest</th><th class="numeric">Sightings</th><th>Source</th></tr></thead><tbody>${[...data].sort((a, b) => b.date.localeCompare(a.date)).map(o => `<tr><td><strong>${e(client(o.clientId).name)}</strong><small>${e(client(o.clientId).branch)}</small></td><td>${dateLabel(o.date)}</td><td>${e(o.pest)}</td><td class="numeric">${o.count}</td><td>${e(o.sourceLabel)}${o.sourceKind === 'report' ? button('View source report', 'report', o.sourceId, 'text-button') : ''}</td></tr>`).join('')}</tbody></table></div></section>`;
}

function demoLogin() {
  return `<main id="main" class="login-page" tabindex="-1"><div class="login-layout"><section class="login-panel" aria-labelledby="login-title"><a class="login-brand" href="#overview" aria-label="Zealpro home"><img src="/assets/zealpro-logo.png" width="1052" height="384" alt="Zealpro Solutions Incorporated"></a><div class="login-form-wrap"><h1 id="login-title">Good work.<br>Better connected.</h1><p class="login-intro">One workspace for site visits, field reports and your team.</p><form data-form="demo-login">${field('Explore a demo role', `<select name="demoAccount" data-demo-account><option value="">Choose a sample account</option>${DEMO_USERS.map(u=>`<option value="${e(u.id)}">${e(u.label)}${u.role==='technician'?' / '+e(u.name):''}</option>`).join('')}</select>`)}<div class="login-divider"><span>Sign in to the workspace</span></div>${field('Demo email', input('email', 'email', '', 'autocomplete="username" placeholder="you@zealpro.demo" spellcheck="false" autocapitalize="none"'))}${field('Demo password', input('password', 'password', '', 'autocomplete="current-password" placeholder="Enter demo password"'))}<p class="form-error" role="alert" hidden></p><button class="button primary login-submit" type="submit">Sign in to demo ${icon('chevron')}</button></form><p class="login-demo-note">Public demo accounts only. Do not enter real passwords or confidential data.</p><details class="login-credentials"><summary>View sample credentials</summary><div class="table-scroll"><table><thead><tr><th>Role</th><th>Email</th><th>Password</th></tr></thead><tbody>${DEMO_USERS.map(u=>`<tr><td>${e(u.label)}${u.role==='technician'?' / '+e(u.name):''}</td><td>${e(u.email)}</td><td>${e(u.password)}</td></tr>`).join('')}</tbody></table></div></details></div><footer class="login-footer"><span>Zealpro operations workspace</span><span>Presentation demo / Browser-local data</span></footer></section><aside class="login-story" aria-label="Zealpro in the field"><div class="login-collage"><figure class="login-photo-frame login-photo-main"><img class="login-photo" src="/assets/zealpro-field-visit.jpg" width="2048" height="1536" alt="Site-visit personnel in protective clothing, pictured in the Zealpro presentation." fetchpriority="high"></figure><figure class="login-photo-frame login-photo-inspection"><img class="login-photo" src="/assets/zealpro-hygiene-inspection.jpg" width="701" height="1228" alt="A technician taking a hygiene swab sample, from the Zealpro presentation."></figure><figure class="login-photo-frame login-photo-site"><img class="login-photo" src="/assets/zealpro-site-work.jpg" width="768" height="1024" alt="Personnel working at a silo installation, from the Zealpro presentation."></figure></div><div class="login-story-copy"><span class="login-story-mark" aria-hidden="true">${icon('services')}</span><h2>Protection starts<br>with people.</h2><p>From the first inspection to the final sign-off.<br>Keep the whole team connected.</p><span class="login-photo-credit">From the Zealpro company presentation</span></div></aside></div></main>`;
}
function reportTabs(tab = 'services') {
  return `<div class="tabs standalone"><a href="#reports" ${tab === 'services' ? 'aria-current="page"' : ''}>Service reports</a>${can(actor, 'cumulative') ? `<a href="#reports?tab=cumulative" ${tab === 'cumulative' ? 'aria-current="page"' : ''}>Cumulative client / branch report</a>` : ''}</div>`;
}
function cumulativeFilters(params) {
  return { account: params.get('account') || 'all', branch: params.get('branch') || 'all', start: params.get('start') || `${DEMO_DATE.slice(0, 4)}-01-01`, end: params.get('end') || `${DEMO_DATE.slice(0, 4)}-12-31` };
}
function cumulativeContent(report, printable = false) {
  const table = (heads, rows) => `<div class="table-scroll"><table><thead><tr>${heads.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.length ? rows.join('') : `<tr><td colspan="${heads.length}">No records in this scope.</td></tr>`}</tbody></table></div>`;
  return `<div class="cumulative-summary">${printable ? '' : `<h2>${e(report.accountLabel)} / ${e(report.branchLabel)}</h2><p>${dateLabel(report.start)} through ${dateLabel(report.end)}, inclusive.</p>`}<div class="metrics">${metric('Services', report.totals.visits, 'Services dated in this period')}${metric('Completed', report.totals.completed, 'Fulfillment, independent of payment')}${metric('Service reports', report.totals.reports, 'Recorded treatment reports')}${metric('Ocular assessments', report.totals.assessments, 'Linked branch assessments')}</div></div>${can(actor, 'finance') ? profitBand(report.financial, 'Cumulative report') : printable ? '' : '<p class="role-notice">Operational report. Operational copy: commercial rates, billing and contribution are excluded.</p>'}<section class="cumulative-section"><h2>Branch summary</h2>${table(['Account / branch', 'Services', 'Completed', 'Reports', 'Assessments'], report.branches.map(b => `<tr><td><strong>${e(b.name)}</strong><small>${e(b.branch)}</small></td><td>${b.visits}</td><td>${b.completed}</td><td>${b.reports}</td><td>${b.assessments}</td></tr>`))}</section><section class="cumulative-section"><h2>Services in this period</h2>${table(['Date', 'Account / branch', 'Treatment', 'Technician', 'Status'], report.visits.map(v => `<tr><td>${dateLabel(v.date)}<small>${timeLabel(v.time)}</small></td><td>${e(client(v.clientId).name)}<small>${e(client(v.clientId).branch)}</small></td><td>${e(v.treatment)}</td><td>${e(v.technician)}</td><td>${badge(v.status)}</td></tr>`))}</section><section class="cumulative-section"><h2>Actual products used</h2>${table(['Captured product name', 'Quantity', 'Unit'], report.products.map(p => `<tr><td>${e(p.name)}</td><td>${p.quantity}</td><td>${e(p.unit)}</td></tr>`))}</section>${printable ? cumulativeNarratives(report) : `<section class="cumulative-section"><h2>Service findings and recommendations</h2>${table(['Date / branch', 'Pest count', 'Findings', 'Recommendation'], report.reports.map(r => `<tr><td>${dateLabel(r.date)}<small>${e(client(r.clientId).branch)}</small></td><td>${r.pestCount} ${e(r.pest)}</td><td class="wrap-cell">${e(r.findings)}</td><td class="wrap-cell">${e(r.recommendation)}</td></tr>`))}</section><section class="cumulative-section"><h2>Ocular findings</h2>${table(['Date / branch', 'Inspected area', 'Problem', 'Recommended service', 'Suggested products', 'Notes'], report.assessments.flatMap(a => a.findings.map(f => `<tr><td>${dateLabel(a.date)}<small>${e(client(a.clientId).branch)}</small></td><td class="wrap-cell">${e(f.location)}</td><td>${e(f.problem)}</td><td>${e(f.serviceName)}</td><td class="wrap-cell">${e(f.materialNames.join(', '))}</td><td class="wrap-cell"><strong>Finding notes</strong>${e(f.notes || 'No additional notes.')}<small>Assessment notes: ${e(a.notes || 'None recorded.')}</small></td></tr>`)))}</section>`}<p class="footnote">Counts are recorded sightings, not unique pests or proof of treatment effectiveness. Qualitative ocular findings are not converted into sighting counts. Product quantities retain their own units.</p>`;
}
function cumulativeNarratives(report) {
  return `<section class="cumulative-section"><h2>Service findings and recommendations</h2>${report.reports.length ? report.reports.map(r => `<section class="cumulative-record"><h3>${dateLabel(r.date)} / ${e(client(r.clientId).name)} / ${e(client(r.clientId).branch)}</h3><p>${reportMeta(state,r.id).legacy?'Approved legacy demonstration':'Approval reference: '+e(reportMeta(state,r.id).approvalRef)}</p><p>${comparisonText(r)}</p><dl class="detail-grid"><div><dt>Activity / method</dt><dd>${e(r.treatment)} / ${e(r.method)}</dd></div><div><dt>Personnel / time</dt><dd>${e(personnel(state.visits.find(v=>v.id===r.visitId)).join(', '))} / ${timeLabel(r.timeIn)}–${timeLabel(r.timeOut)}</dd></div><div><dt>Area covered</dt><dd>${e(r.location)}</dd></div><div><dt>Observed count</dt><dd>${r.pestCount} ${e(r.pest)}</dd></div></dl><div class="report-sections"><section><h4>Findings</h4><p>${e(r.findings)}</p></section><section><h4>Recommendation</h4><p>${e(r.recommendation)}</p></section></div></section>`).join('') : '<p>No service reports in this period.</p>'}</section><section class="cumulative-section"><h2>Ocular inspection findings</h2>${report.assessments.length ? report.assessments.map(a => `<section class="cumulative-record"><h3>${dateLabel(a.date)} / ${e(client(a.clientId).name)} / ${e(client(a.clientId).branch)}</h3><p>${e(a.assessor)} / ${timeLabel(a.time)}</p>${a.findings.map((f, index) => `<div class="finding-document"><h4>Finding ${index + 1}: ${e(f.location)}</h4><dl class="detail-grid"><div><dt>Problem</dt><dd>${e(f.problem)}</dd></div><div><dt>Recommended service</dt><dd>${e(f.serviceName)}</dd></div><div><dt>Suggested products</dt><dd>${e(f.materialNames.join(', '))}</dd></div><div><dt>Finding notes</dt><dd>${e(f.notes || 'No additional notes.')}</dd></div></dl></div>`).join('')}<h4>General assessment notes</h4><p>${e(a.notes || 'No additional notes.')}</p></section>`).join('') : '<p>No linked branch assessments in this period.</p>'}</section>`;
}
function cumulativeDocument(report) {
  return `<article class="report-sheet cumulative-pdf"><div class="report-mast"><img src="/assets/zealpro-logo.png" width="1052" height="384" alt="Zealpro Solutions Incorporated"><div><strong>Cumulative service report</strong><span>${e(report.start)} / ${e(report.end)}</span><small>${can(actor, 'finance') ? 'Owner management copy' : 'Operational copy'} / Demonstration</small></div></div><div class="report-account"><div><span>Client / account</span><h3>${e(report.accountLabel)}</h3><p>${e(report.branchLabel)}</p></div><div><span>Reporting period</span><strong>${dateLabel(report.start)} through ${dateLabel(report.end)}</strong><p>Service dates within this period, inclusive.</p></div></div>${cumulativeContent(report, true)}<div class="report-signatures"><div><span>Compiled by</span><strong>${e(actor.name)}</strong><small>${e(actor.label)} / Demo workspace</small></div><div><span>Customer acknowledgment</span><strong>Not signed</strong><small>Presentation copy only</small></div></div></article>`;
}
function cumulativeView(params) {
  if (!can(actor, 'cumulative')) return heading('Cumulative reports', 'This report is available to Supervisors and the Owner.');
  const filter = cumulativeFilters(params), accounts = accountOptions(screen);
  const branches = screen.clients.filter(c => filter.account === 'all' || accountKey(c.name) === filter.account);
  let report;
  try { report = buildCumulativeReport({ ...screen, visits: screen.visits.filter(v => v.status !== 'Cancelled'), reports: screen.reports.filter(approved), assessments: screen.assessments.filter(a => assessmentMeta(state,a.id).status === 'Approved') }, filter); } catch (error) { return `${heading('Cumulative reports', 'Choose an account, branch and date range.')}${reportTabs('cumulative')}<p class="form-error" role="alert">${e(error.message)}</p><a class="button" href="#reports?tab=cumulative">Reset report filters</a>`; }
  return `${heading('Cumulative reports', 'Combine branch service history, inspections and actual products used.', button(icon('reports') + ' Generate PDF report', 'cumulative-preview', '', 'button primary'))}${reportTabs('cumulative')}<form data-form="cumulative-filter" class="cumulative-filters">${field('Client / account', `<select name="account"><option value="all">All accounts</option>${accounts.map(a => `<option value="${e(a.key)}" ${a.key === filter.account ? 'selected' : ''}>${e(a.name)}</option>`).join('')}</select>`)}${field('Branch', `<select name="branch"><option value="all">All branches</option>${options(branches.map(c => ({ id: c.id, name: `${c.name} / ${c.branch}` })), filter.branch)}</select>`)}${field('From date', input('start', 'date', filter.start))}${field('Through date', input('end', 'date', filter.end))}<button class="button" type="submit">Apply filters</button></form>${cumulativeContent(report)}`;
}
function assessmentLine(row = {}) {
  return `<fieldset class="finding-line"><legend>Inspection finding</legend><div class="field-pair">${field('Location / area inspected', input('findingLocation', 'text', row.location || '', 'maxlength="2000"'))}${field('Problem found', select('findingProblem', options(PROBLEMS, row.problem)))}</div>${field('Recommended solution', select('findingService', serviceOptions(row.serviceId)))}<fieldset class="finding-products"><legend>Suggested products — select at least one</legend>${state.materials.filter(m => m.active).map(m => `<label><input type="checkbox" name="findingMaterialId" value="${e(m.id)}" ${(row.materialIds || []).includes(m.id) ? 'checked' : ''}> ${e(m.name)} (${e(m.unit)})</label>`).join('')}</fieldset>${field('Finding notes (optional)', `<textarea name="findingNotes" rows="2" maxlength="2000">${e(row.notes || '')}</textarea>`)}${button('Remove finding', 'remove-finding', '', 'text-button')}</fieldset>`;
}
function assessmentForm(id = '') {
  const saved=state.assessments.find(a=>a.id===id),draft=state.presentation.assessmentDrafts[id],a=draft?.values||saved||{};
  const existing=Boolean(saved||draft),prospect=!a.clientId;
  form(existing?'Edit ocular draft':'New ocular assessment','ocular-submit',`${field('Client / prospect',select('clientId','<option value="prospect">New prospect (not enrolled)</option>'+clientOptions(a.clientId)))}<div id="prospect-fields" class="field-pair" ${prospect?'':'hidden'}>${field('Prospect account name',input('accountName','text',a.accountName||'','maxlength="100"',prospect))}${field('Prospect branch / store',input('branch','text',a.branch||'','maxlength="100"',prospect))}</div><div class="field-pair">${field('Assessment date',input('date','date',a.date||DEMO_DATE))}${field('Time',input('time','time',a.time||'09:00'))}</div>${actor.role==='technician'?`<p>Assessed by ${e(actor.name)}</p>`:field('Assessed by',select('assessor',options(staffChoices(),a.assessor)))}<div class="finding-lines">${(a.findings?.length?a.findings:[{}]).map(assessmentLine).join('')}</div>${button('Add another finding','add-finding','','button small-button')}${field('General assessment notes (optional)',`<textarea name="notes" rows="2" maxlength="2000">${e(a.notes||'')}</textarea>`)}<p class="field-hint">Each area keeps its own recommendation and products. Save draft or submit for Supervisor review. Approved findings can inform scheduling.</p>`,'Submit inspection',id);
  dialog.querySelector('.form-footer').insertAdjacentHTML('afterbegin','<button class="button" type="submit" name="intent" value="draft" formnovalidate>Save draft</button>');
}
function assessmentDetail(id) {
  const a=screen.assessments.find(a=>a.id===id);if(!a)return;
  const meta=assessmentMeta(state,id);
  showDialog('Ocular inspection findings',`<div class="dialog-body"><div class="detail-title"><div><h3>${e(assessmentAccount(a).name)} / ${e(assessmentAccount(a).branch)}</h3><p>${dateLabel(a.date)} / ${timeLabel(a.time)} / ${e(a.assessor)}</p></div>${badge(meta.status)}</div>${assessmentFindings(a).map((f,index)=>`<section class="cumulative-section"><h3>Finding ${index+1}: ${e(f.location)}</h3><dl><dt>Problem</dt><dd>${e(f.problem)}</dd><dt>Recommended service</dt><dd>${e(state.services.find(s=>s.id===f.serviceId)?.name||a.solution)}</dd><dt>Suggested products</dt><dd>${f.materialIds.map(id=>e(material(id)?.name||id)).join(', ')}</dd><dt>Finding notes</dt><dd>${e(f.notes||'No additional notes.')}</dd></dl>${a.clientId&&meta.status==='Approved'?button('Plan this treatment','finding-schedule',`${id}:${index}`,'button small-button'):''}</section>`).join('')}<h3>General inspection notes</h3><p>${e(a.notes||'No additional notes.')}</p>${reviewTrail(meta)}</div><div class="form-footer">${button('Close','close')}${meta.status==='Submitted'?button('Review inspection','review-assessment',id):''}${['Returned','Draft'].includes(meta.status)?button('Edit draft','edit-assessment',id):''}${!a.clientId&&meta.status==='Approved'?button('Enroll client','new-client',id,'button primary'):''}</div>`,true);
}
function showDialog(title, content, wide = false) {
  dialog.className = wide ? 'wide-dialog' : '';
  dialog.innerHTML = `<div class="dialog-heading"><h2 id="dialog-title">${title}</h2><button class="icon-button" data-action="close" aria-label="Close dialog">${icon('close')}</button></div>${content}`;
  if (!dialog.open) dialog.showModal();
  dialog.querySelector('button')?.focus();
}
const field = (label, control, className = '') => `<label class="field ${className}"><span>${label}</span>${control}</label>`;
const input = (name, type = 'text', value = '', extra = '', required = true) => `<input name="${name}" type="${type}" value="${e(value)}" ${extra}${required ? ' required' : ''}>`;
const select = (name, body) => `<select name="${name}" required>${body}</select>`;
function form(title, name, fields, submit, id = '') { showDialog(title, `<form data-form="${name}" data-id="${e(id)}"><div class="form-fields">${fields}</div><p class="form-error" role="alert" hidden></p><div class="form-footer">${button('Cancel', 'close')}<button type="submit" class="button primary">${submit}</button></div></form>`); }

function productLine(line = {}, actual = false) {
  const p = material(line.productId) || state.materials.find(p => p.active);
  if (!p) return '';
  return `<div class="product-line"><div class="product-line-fields">${field('Product', select('productId', materialOptions(p.id)))}${field(`Quantity (${e(p.unit)})`, input('productQuantity', 'number', line.quantity ?? 1, `min="${p.unit === 'pcs' ? '1' : '0.01'}" max="1000000" step="${p.unit === 'pcs' ? '1' : '0.01'}"`))}${can(actor,'costs')&&(can(actor,'commercial')||screen.materials.some(m=>m.id===p.id)) ? `<div class="line-price"><span>Captured cost per ${e(p.unit)}</span><strong>${formatMoney(line.unitCost??p.cost)}</strong></div>` : ''}</div>${button(icon('close')+'<span class="sr-only">Remove product</span>', 'remove-product', '', 'icon-button')}</div>`;
}
function productEditor(lines, actual = false) {
  return `<fieldset class="product-editor" data-actual="${actual}"><legend>${actual ? 'Actual products used' : 'Estimated products'}</legend><p class="field-hint">${actual ? 'Enter what was actually consumed. Adjust actual quantities, add different products, or remove every row if no product was used. Unit costs are captured from the product record.' : 'Plan quantities in each product’s base unit. Service estimates are copied into each visit.'}</p><div class="product-lines">${lines.map(line => productLine(line, actual)).join('')}</div>${button(icon('plus')+' Add product', 'add-product', '', 'button small-button')}<p class="products-empty" ${lines.length ? 'hidden' : ''}>No products in this ${actual ? 'actual usage' : 'estimate'}.</p>${finance(`<div class="estimate-preview"><span>Product cost</span><strong data-product-total></strong><span>${actual ? 'Actual' : 'Theoretical'} profit</span><strong data-profit-preview></strong></div>`)}</fieldset>`;
}
function readProducts(form) {
  return [...form.querySelectorAll('.product-line')].map(row => ({ productId: row.querySelector('[name="productId"]').value, quantity: Number(row.querySelector('[name="productQuantity"]').value), ...(row.querySelector('[name="unitCost"]') ? { unitCost: Number(row.querySelector('[name="unitCost"]').value) } : {}) }));
}
function updateEstimate(form) {
  if (!form?.querySelector('.product-editor')) return;
  let cost = 0;
  for (const row of form.querySelectorAll('.product-line')) {
    const p = material(row.querySelector('[name="productId"]').value);
    const quantity = row.querySelector('[name="productQuantity"]');
    quantity.step = p.unit === 'pcs' ? '1' : '0.01';
    quantity.min = p.unit === 'pcs' ? '1' : '0.01';
    quantity.closest('label').querySelector('span').textContent = `Quantity (${p.unit})`;
    const price = row.querySelector('.line-price');
    if (price) { price.querySelector('span').textContent = `Cost per ${p.unit}`; price.querySelector('strong').textContent = money(p.cost); }
    const unitCost = row.querySelector('[name="unitCost"]');
    cost += Math.round(Number(quantity.value || 0) * Number(unitCost ? unitCost.value : p.cost) * 100) / 100;
  }
  const charge = form.elements.actualRevenue || form.elements.rate || form.elements.price;
  const expense = form.elements.expense || form.elements.plannedExpense;
  if (form.querySelector('[data-product-total]')) form.querySelector('[data-product-total]').textContent = money(cost);
  if (form.querySelector('[data-profit-preview]')) form.querySelector('[data-profit-preview]').textContent = money(Number(charge?.value || 0) - cost - Number(expense?.value || 0));
  form.querySelector('.products-empty').hidden = Boolean(form.querySelector('.product-line'));
}
function serviceForm(id) {
  const s = state.services.find(s => s.id === id);
  if (!state.materials.some(p => p.active) && !s) { notify('Define products first, or create a service without product estimates.'); }
  form(s ? 'Edit service definition' : 'Define a service', 'service', `${field('Service name', input('name', 'text', s?.name || '', 'maxlength="100"'))}${field('Description', `<textarea name="description" rows="3" maxlength="2000" required>${e(s?.description || '')}</textarea>`)}<div class="field-pair">${field('Default service charge (PHP)', input('price', 'number', s?.price ?? 0, 'min="0" max="1000000000" step="0.01"'))}${field('Planned other expenses (PHP)', input('plannedExpense', 'number', s?.plannedExpense ?? 0, 'min="0" max="1000000000" step="0.01"'))}</div>${productEditor(s?.products || [])}<p class="field-hint">Editing this definition changes future scheduling defaults. Existing visits keep their estimates.</p>`, 'Save service definition', id);
  updateEstimate(dialog.querySelector('form'));
}
function productForm(id) {
  const p = material(id);
  form(p ? 'Edit product definition' : 'Define a product', 'product', `${field('Product name', input('name', 'text', p?.name || '', 'maxlength="100"'))}${field('Description', `<textarea name="description" rows="3" maxlength="2000" required>${e(p?.description || '')}</textarea>`)}<div class="field-pair">${field('Base unit', select('unit', options(['mL', 'L', 'g', 'kg', 'pcs'], p?.unit || 'mL')))}${field('Cost per base unit (PHP)', input('cost', 'number', p?.cost ?? 0, 'min="0" max="1000000000" step="0.01"'))}</div><div class="field-pair">${field('Reorder quantity (base unit)', input('minimum', 'number', p?.minimum ?? 1, 'min="0.01" max="1000000000" step="0.01"'))}${!p ? field('Opening stock (base unit)', input('stock', 'number', 0, 'min="0" max="1000000000" step="0.01"')) : `<p class="field-hint">On hand: ${p.stock} ${e(p.unit)}. Use Restock to add stock. Referenced units cannot change.</p>`}</div><p class="field-hint">Unit cost means one mL, L, g, kg or piece, not the purchase price of a whole package.</p>`, 'Save product definition', id);
}

function clientForm(id = '', assessmentId = '') {
  const c = client(id), assessment = state.assessments.find(a => a.id === assessmentId);
  const durations = [...new Set(['6 months', '12 months', '24 months', c?.duration].filter(Boolean))];
  const packages = [...new Set(['General pest control', 'Integrated pest management', 'Rodent management', 'Termite management', c?.package].filter(Boolean))];
  form(c ? 'Edit client branch' : 'Enroll a client branch', c ? 'client-edit' : 'client', `${field('Account name', input('name', 'text', c?.name || assessment?.accountName || '', 'maxlength="100"'))}${field('Branch / store', input('branch', 'text', c?.branch || assessment?.branch || '', 'maxlength="100"'))}${field('Address', input('address', 'text', c?.address || '', 'maxlength="500"'))}<div class="field-pair">${field('Contact person (optional)', input('contactPerson', 'text', c?.contactPerson || '', 'maxlength="100" autocomplete="name"', false))}${field('Contact role / position (optional)', input('contact', 'text', c?.contact || '', 'maxlength="100" autocomplete="organization-title"', false))}</div><div class="field-pair">${field('Phone / mobile (optional)', input('phone', 'tel', c?.phone || '', 'maxlength="50" autocomplete="tel"', false))}${field('Email (optional)', input('email', 'email', c?.email || '', 'maxlength="254" autocomplete="email"', false))}</div>${field('Duration of service agreement', select('duration', options(durations, c?.duration)))}${field('Service / treatment package', select('package', options(packages, c?.package)))}<div class="field-pair">${field('Agreement start', input('since', 'date', c?.since || DEMO_DATE))}${field('Agreed rate per service (PHP)', actor.role==='admin'?select('rate',options([...new Set([c?.rate,...state.services.filter(s=>s.active).map(s=>s.price)].filter(v=>v!==undefined))].map(v=>({id:String(v),name:formatMoney(v)+' / Owner-approved rate'})),String(c?.rate??''))):input('rate', 'number', c?.rate ?? '', 'min="0" max="1000000000" step="0.01"'))}</div>${c ? '<p class="field-hint">Updates keep this branch’s service and payment history. Existing quoted charges and invoices retain their recorded amounts.</p>' : ''}`, c ? 'Save changes' : 'Enroll branch', c ? id : assessmentId);
}

function visitForm(date = DEMO_DATE, preset = {}) {
  const existing = preset.id ? state.visits.find(v=>v.id===preset.id) : null;
  const service = state.services.find(s=>s.id===(existing?.serviceId||preset.serviceId)&&s.active)||state.services.find(s=>s.active);
  if(!service){notify('An active service is required.');return;}
  form(existing?'Reschedule assigned service':'Schedule a service','visit',`${field('Client / branch',select('clientId',clientOptions(existing?.clientId||preset.clientId)))}<div class="field-pair">${field('Service date',input('date','date',existing?.date||date))}${field('Start time',input('time','time',existing?.time||'13:00'))}</div>${field('Service definition',select('serviceId',serviceOptions(service.id)))}<p class="field-hint" id="service-description">${e(service.description)}</p>${field('Technician in charge',select('technician',options(staffChoices(),existing?.technician)))}${personnelFields(existing?personnel(existing):[])}<div class="field-pair">${commercial(field('Quoted service charge (PHP)',input('rate','number',existing?.rate??(actor.role==='admin'?client(preset.clientId||screen.clients[0]?.id)?.rate:service.price),'min="0" max="1000000000" step="0.01"'+(actor.role==='admin'?' readonly':''))))}${costs(field('Planned field expenses (PHP)',input('plannedExpense','number',existing?.plannedExpense??service.plannedExpense,'min="0" max="1000000000" step="0.01"')))}</div>${productEditor(existing?.estimatedProducts||service.products)}<p class="field-hint">Reserve planned stock without consuming it. Each assigned person has a one-hour conflict check. Actual use posts when fieldwork is submitted.</p>`,existing?'Save appointment changes':'Schedule service',existing?.id||'');
  updateEstimate(dialog.querySelector('form'));
}
function visitDetail(id) {
  const v=state.visits.find(v=>v.id===id); if(!v)return;
  const c=client(v.clientId),r=state.reports.find(r=>r.visitId===id),status=shownStatus(v),invoice=state.invoices.find(i=>i.visitId===id);
  showDialog('Service visit',`<div class="dialog-body"><div class="detail-title"><span class="avatar large">${initials(c.name)}</span><div><h3>${e(c.name)}</h3><p>${e(c.branch)} / ${e(c.address)}</p></div>${badge(status)}</div><div class="workflow-steps" aria-label="Service workflow"><span>Scheduled</span><span>Fieldwork draft</span><span>Submitted</span><span>Approved</span><span>Billing</span></div><dl class="detail-grid"><div><dt>Date and time</dt><dd>${dateLabel(v.date)} / ${timeLabel(v.time)}</dd></div><div><dt>Personnel involved</dt><dd>${e(personnel(v).join(', '))}</dd></div><div><dt>Service</dt><dd>${e(v.treatment)}</dd></div>${commercial(`<div><dt>Quoted service charge</dt><dd>${money(v.rate)}</dd></div>`)}${costs(`<div><dt>Planned field expenses</dt><dd>${formatMoney(v.plannedExpense)}</dd></div>`)}${finance(`<div><dt>Estimated contribution</dt><dd>${money(v.rate-productCost(v.estimatedProducts)-v.plannedExpense)}</dd></div>`)}</dl>${r&&approved(r)&&can(actor,'commercial')?`<section class="service-payment-detail"><h3>Payment status</h3>${servicePayment(v)}${invoice?`<p>Due ${dateLabel(invoice.due)} / ${money(invoice.paid)} collected of ${money(invoice.amount)}</p><a href="#billing?invoice=${e(invoice.id)}">Open billing</a>`:''}</section>`:''}<h3>Reserved product plan</h3><div class="planned-products">${v.estimatedProducts.map(p=>`<div><span>${e(p.name)}</span><strong>${p.quantity} ${e(p.unit)}</strong>${costs(`<small>${formatMoney(p.quantity*p.unitCost)}</small>`)}</div>`).join('')||'<p>No remaining product reservations.</p>'}</div>${status==='Cancelled'?`<p class="review-notice">${e(state.presentation.jobs[id].history?.at(-1)?.reason||'Appointment cancelled. Historical plan retained in activity.')}</p><details class="version-history"><summary>Original appointment plan</summary><p>${dateLabel(state.presentation.jobs[id].cancelledSnapshot.date)} / ${timeLabel(state.presentation.jobs[id].cancelledSnapshot.time)}</p>${state.presentation.jobs[id].cancelledSnapshot.estimatedProducts.map(p=>`<p>${e(p.name)}: ${p.quantity} ${e(p.unit)}</p>`).join('')||'<p>No products were reserved.</p>'}</details>`:''}${r?`<p>Report status: ${badge(reportMeta(state,r.id).status)}</p>`:''}</div><div class="form-footer">${button('Close','close')}${r&&approved(r)&&r.financialsConfirmed&&!invoice?button('Review payment link','service-payment',id):''}${!r&&status!=='Cancelled'?button('Reschedule','reschedule',id)+button('Cancel appointment','cancel-visit',id,'text-button'):''}${r?button('View report','report',r.id,'button primary'):status!=='Cancelled'&&can(actor,'submitReports')?button('Record fieldwork','complete',id,'button primary'):''}${r&&reportMeta(state,r.id).status==='Returned'&&can(actor,'submitReports')?button('Correct draft','complete',id,'button primary'):''}</div>`);
}
function completeForm(id) {
  const v=state.visits.find(v=>v.id===id),r=state.reports.find(r=>r.visitId===id);
  if(!v)return;
  if(!can(actor,'submitReports')){notify('Field reports are submitted by the assigned Technician or Owner.');return;}
  if(r&&reportMeta(state,r.id).status!=='Returned'){reportDetail(r.id);return;}
  if(state.presentation.drafts[id] && actor.role!=='owner' && state.presentation.drafts[id].actorId!==actor.id){notify('This draft belongs to another user. Ask the Owner to review it.');return;}
  const draft=state.presentation.drafts[id]?.values||{}, values={...r,...draft};
  form('Record fieldwork','report-submit',`<p class="field-hint">${e(client(v.clientId).name)} / ${e(v.treatment)} / ${e(personnel(v).join(', '))}</p>${r?'<p class="review-notice">Returned for correction. Existing consumption remains posted; submitting changes applies only the net quantity difference.</p>':''}<div class="field-pair">${field('Time-in',input('timeIn','time',values.timeIn||v.time))}${field('Time-out',input('timeOut','time',values.timeOut||''))}</div>${field('Location / area covered',input('location','text',values.location||'','maxlength="2000"'))}${field('Method / activity conducted',input('method','text',values.method||v.treatment,'maxlength="2000"'))}${!r||canReadExpense(state,actor,r)?field('Personal job expense claim (PHP)',input('expense','number',values.expense??0,'min="0" max="1000000000" step="0.01"')):'<p class="field-hint">An existing expense submission is preserved. Only its author or an authorized reviewer can view it.</p>'}${productEditor(values.products||v.estimatedProducts,true)}<div class="field-pair">${field('Observed pest type',select('pest',options(PESTS,values.pest)))}${field('Observed pest count',input('pestCount','number',values.pestCount??0,'min="0" max="100000" step="1"'))}</div>${field('Findings / recurring issues',`<textarea name="findings" rows="3" maxlength="2000" required>${e(values.findings||'')}</textarea>`)}${field('Recommendation',`<textarea name="recommendation" rows="3" maxlength="2000" required>${e(values.recommendation||'')}</textarea>`)}${field('Remarks (optional)',`<textarea name="remarks" rows="2" maxlength="2000">${e(values.remarks||'')}</textarea>`)}<p class="field-hint">Save an incomplete draft or submit actual use for review. Submission posts consumption once; approval finalizes billing. Client charges and material unit costs cannot be entered here.</p>`,'Submit for review',id);
  dialog.querySelector('.form-footer').insertAdjacentHTML('afterbegin','<button class="button" type="submit" name="intent" value="draft" formnovalidate>Save draft</button>');
  updateEstimate(dialog.querySelector('form'));
}
function reportDetail(id) {
  const r=state.reports.find(r=>r.id===id);if(!r)return;
  const c=client(r.clientId),v=state.visits.find(v=>v.id===r.visitId),meta=reportMeta(state,id),prior=observations(r.clientId).filter(o=>o.date<r.date&&o.pest===r.pest).sort((a,b)=>b.date.localeCompare(a.date))[0];
  const productIds=[...new Set([...v.estimatedProducts,...r.products].map(p=>p.productId))];
  showDialog('Service report preview',`<article class="report-sheet"><div class="report-mast"><img src="/assets/zealpro-logo.png" width="1052" height="384" alt="Zealpro Solutions Incorporated"><div><strong>Service report</strong><span>${e(r.id)}</span><small>${e(meta.status)} / ${meta.legacy?'Legacy demonstration':meta.approvalRef?e(meta.approvalRef):'Review copy, not finalized'}</small></div></div><div class="report-account"><div><span>Client / branch</span><h3>${e(c.name)}</h3><p>${e(c.branch)} / ${e(c.address)}</p></div><div><span>Service date</span><strong>${dateLabel(r.date)}</strong><p>${timeLabel(r.timeIn)}–${timeLabel(r.timeOut)}</p></div></div><div class="review-banner">${badge(meta.status)}<span>${meta.status==='Approved'?'Finalized fieldwork. Customer signature not collected.':'Pending finalization. This copy does not authorize billing.'}</span></div><dl class="detail-grid"><div><dt>Personnel involved</dt><dd>${e(personnel(v).join(', '))}</dd></div><div><dt>Area / method</dt><dd>${e(r.location)} / ${e(r.method)}</dd></div></dl><h4>Estimated vs actual products</h4><div class="table-scroll"><table><thead><tr><th>Product</th><th>Estimated</th><th>Actual used</th>${costs('<th>Captured unit cost</th><th>Job material cost</th>')}</tr></thead><tbody>${productIds.map(id=>{const estimate=v.estimatedProducts.find(p=>p.productId===id),actual=r.products.find(p=>p.productId===id),p=actual||estimate;return `<tr><td>${e(p.name)}</td><td>${estimate?.quantity||0} ${e(p.unit)}</td><td>${actual?.quantity||0} ${e(p.unit)}</td>${costs(`<td>${actual?formatMoney(actual.unitCost):'—'}</td><td>${formatMoney(actual?actual.quantity*actual.unitCost:0)}</td>`)}</tr>`;}).join('')}</tbody></table></div><div class="report-sections"><section><h4>Findings</h4><p>${e(r.findings)}</p></section><section><h4>Recommendation</h4><p>${e(r.recommendation)}</p></section><section><h4>Previous vs current observation</h4><p>${prior?`${prior.count} ${e(r.pest)} on ${dateLabel(prior.date)}; ${r.pestCount} on this visit. Change: ${r.pestCount-prior.count}. Recorded sightings do not establish treatment effectiveness.`:`${r.pestCount} ${e(r.pest)} recorded this visit. No earlier comparable observation.`}</p></section>${canReadExpense(state,actor,r)?`<section><h4>Job expense claim</h4><p>${formatMoney(r.expense)} / ${e(meta.status==='Approved'?'Reviewed with fieldwork':'Pending Supervisor review')}</p></section>`:''}${commercial(`<section><h4>Commercial record</h4><p>Service charge: ${money(r.actualRevenue)}</p>${meta.status==='Approved'?servicePayment(v):'<p>Invoice follows approval.</p>'}</section>`)}${finance(`<section><h4>Contribution after direct job costs</h4><p>${meta.status==='Approved'&&r.financialsConfirmed?money(r.actualRevenue-productCost(r.products)-r.expense):!r.financialsConfirmed?'Awaiting financial confirmation':'Pending report approval'}</p><small>Before unrecorded overhead and tax.</small></section>`)}<section><h4>Remarks</h4><p>${e(r.remarks||'No additional remarks.')}</p></section></div>${reviewTrail(meta)}${meta.versions?.length?`<details class="version-history no-print"><summary>${meta.versions.length} preserved report versions</summary>${meta.versions.map((version,index)=>`<section><h4>Version ${index+1} / ${e(version.action)}</h4><p>${e(version.at)}</p><p>${e(version.record.findings)}</p><p>${e(version.record.recommendation)}</p><p>${version.record.products.map(p=>`${e(p.name)}: ${p.quantity} ${e(p.unit)}`).join('; ')}</p></section>`).join('')}</details>`:''}<div class="report-signatures"><div><span>Serviced by</span><strong>${e(personnel(v).join(', '))}</strong><small>${meta.approvedAt?'Finalized '+e(meta.approvedAt):'Legacy sample or pending review'}</small></div><div><span>Customer acknowledgment</span><strong>Not signed</strong><small>Demonstration copy</small></div></div></article><div class="form-footer no-print">${button('Close','close')}${meta.status==='Submitted'&&reviewable(r)?button('Review submission','review-report',id):''}${meta.status==='Approved'&&reviewable(r)?button('Request amendment','amend-report',id):''}${meta.legacy&&!r.financialsConfirmed?button('Review historical financials','legacy-financial',id):''}${meta.status==='Returned'&&can(actor,'submitReports')?button('Correct draft','complete',v.id):''}${button('Print / save PDF','print','','button primary')}</div>`,true);
}
function clientDetail(id) {
  const c=client(id);if(!c)return;
  const status=state.presentation.clients[id]?.status||'Active';
  showDialog('Client branch profile',`<div class="dialog-body client-profile"><div class="detail-title"><span class="avatar large">${initials(c.name)}</span><div><h3>${e(c.name)}</h3><p>${e(c.branch)} / ${e(c.address)}</p></div>${badge(status)}</div><dl class="detail-grid"><div><dt>Contact person</dt><dd>${e(c.contactPerson||'Not provided')}</dd></div><div><dt>Contact role</dt><dd>${e(c.contact||'Not provided')}</dd></div><div><dt>Phone</dt><dd>${e(c.phone||'Not provided')}</dd></div><div><dt>Email</dt><dd>${e(c.email||'Not provided')}</dd></div></dl>${commercial(`<section class="restricted-agreement"><h3>Commercial agreement</h3><dl class="detail-grid"><div><dt>Service package</dt><dd>${e(c.package)}</dd></div><div><dt>Agreement term</dt><dd>${e(c.duration)} from ${dateLabel(c.since)}</dd></div><div><dt>Agreed service rate</dt><dd>${money(c.rate)}</dd></div></dl></section>`)}<h3 class="history-title">Branch service history</h3>${screen.visits.filter(v=>v.clientId===id).map(v=>`<button class="history-row" data-action="visit" data-id="${e(v.id)}"><span><strong>${e(v.treatment)}</strong><small>${dateLabel(v.date)} / ${e(personnel(v).join(', '))}</small></span><span>${badge(v.status)}${servicePayment(v)}</span>${icon('chevron')}</button>`).join('')||'<p>No assigned services.</p>'}</div><div class="form-footer">${button('Close','close')}${button('Edit details','edit-client',id)}${button('Change branch status','client-status',id)}${status==='Active'?button('Schedule service','client-schedule',id,'button primary'):''}</div>`);
}
function showGuide() {
  showDialog('Welcome to the Zealpro demo', `<div class="dialog-body guide-content"><h3>From site assessment to collection.</h3><p>Explore a working UI based on your SRS and service paperwork. The sample day is 2 November 2026. All records and figures are illustrative.</p><ol><li>Open <strong>Schedule</strong> to plan a visit and assign a technician.</li><li>Open a visit, then <strong>Record treatment</strong>. Actual material usage deducts stock and creates a service report.</li><li>Review branch history in <strong>Clients & branches</strong> and changes in <strong>Pest analytics</strong>.</li><li>Open <strong>Billing & collection</strong> to record a sample payment or preview a reminder.</li></ol><p>Changes stay in this browser. No authentication, live messaging, production database or customer signatures are connected.</p></div><div class="form-footer">${button('Reset sample data', 'reset-confirm', '', 'button danger-button')}${button('Explore workspace', 'close', '', 'button primary')}</div>`);
}

document.addEventListener('click', async event => {
  if (event.target.closest('.skip-link')) { event.preventDefault(); document.querySelector('#main').focus(); return; }
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const { action, id } = target.dataset;
  try { assertDemoAction(actor, action, state, id); } catch (error) { notify(error.message); return; }
  try {
    const context=uiContext();
    if(openWorkspaceAction(context,action,id))return;
    const handled=handleWorkspaceAction(context,action,id);
    if(handled?.handled){if(dialog.open)dialog.close();persist(handled.message);return;}
    if(action==='reschedule'){visitForm(DEMO_DATE,state.visits.find(v=>v.id===id));return;}
    if(action==='cancel-visit'){form('Cancel appointment','cancel-visit',field('Reason',input('reason','text','','maxlength="2000"'))+'<p>Unconsumed reservations will be released. The historical appointment remains available.</p>','Cancel appointment',id);return;}
    if(action==='edit-assessment'){assessmentForm(id);return;}
    if(action==='client-status'){form('Branch lifecycle','client-status',field('Status',select('status',options(['Draft','Active','Archived'],state.presentation.clients[id]?.status||'Active')))+field('Reason',input('reason','text','','maxlength="2000"')),'Save branch status',id);return;}
    if(action==='review-report'||action==='review-assessment'){
      const inspection=action==='review-assessment';
      form(inspection?'Review inspection':'Review fieldwork',inspection?'assessment-review-save':'report-review-save',`<p>Review recorded quantities, expenses and findings before finalization. A performing Supervisor cannot approve their own work.</p>${field('Decision',select('decision',options([{id:'Approved',name:'Approve & finalize'},{id:'Returned',name:'Return for correction'}])))}${field('Review notes / return reason',`<textarea name="reason" maxlength="2000" rows="3"></textarea>`)}<p>Returning requires a reason. Approval is separate from payment collection.</p>`,'Approve & finalize',id);return;
    }
    if(action==='legacy-financial'){
      const r=state.reports.find(r=>r.id===id);
      form('Confirm historical financials','legacy-financial-save',`<p>Earlier records did not capture these amounts. Enter verified historical values; this confirmation does not create or duplicate an invoice.</p>${field('Actual historical service charge (PHP)',input('actualRevenue','number',r.actualRevenue,'min="0" max="1000000000" step="0.01"'))}${r.products.map(p=>field(`${e(p.name)} / cost per ${e(p.unit)}`,input('cost_'+p.productId,'number',p.unitCost,'min="0" max="1000000000" step="0.01"'))).join('')}${field('Evidence / reason',input('reason','text','','maxlength="2000"'))}`,'Confirm historical amounts',id);return;
    }
    if(action==='amend-report'){form('Authorize report amendment','amend-save',field('Amendment reason',input('reason','text','','maxlength="2000"'))+'<p>The approved version is preserved. Corrections require resubmission and another review.</p>','Open amendment',id);return;}
  }catch(error){notify(error.message);return;}
  if (action === 'close') dialog.close();
  else if (action === 'logout') { if (dialog.open) dialog.close(); dialog.innerHTML = ''; actor = null; render(); }
  else if (action === 'ocular-detail') assessmentDetail(id);
  else if (action === 'add-finding') { const lines = dialog.querySelector('.finding-lines'); if (lines.children.length >= 20) { notify('Enter up to 20 findings per assessment.'); return; } lines.insertAdjacentHTML('beforeend', assessmentLine()); }
  else if (action === 'remove-finding') { if (dialog.querySelectorAll('.finding-line').length <= 1) { notify('Keep at least one finding.'); return; } target.closest('.finding-line').remove(); }
  else if (action === 'cumulative-preview') {
    try {
      const report = buildCumulativeReport({ ...screen, visits: screen.visits.filter(v => v.status !== 'Cancelled'), reports: screen.reports.filter(approved), assessments: screen.assessments.filter(a => assessmentMeta(state,a.id).status === 'Approved') }, cumulativeFilters(route().params));
      showDialog('Cumulative report preview', cumulativeDocument(report) + `<div class="form-footer no-print">${button('Close', 'close')}${button('Print / save PDF', 'print', '', 'button primary')}</div>`, true);
    } catch (error) { notify(error.message); }
  }
  else if (action === 'service-form') serviceForm(id);
  else if (action === 'product-form') productForm(id);
  else if (action === 'edit-report') reportDetail(id);
  else if (action === 'choose-report') { const pending = screen.visits.filter(v => !['Completed','Submitted','Cancelled'].includes(v.status)); showDialog('Choose a service to report', `<div class="dialog-body">${pending.length ? pending.map(v => `<button type="button" class="history-row" data-action="complete" data-id="${e(v.id)}"><span><strong>${e(client(v.clientId).name)} / ${e(v.treatment)}</strong><small>${dateLabel(v.date)} / ${timeLabel(v.time)} / ${e(v.technician)}</small></span>${icon('chevron')}</button>`).join('') : '<p>Every scheduled service has a report. Schedule a new visit to continue.</p>'}</div>`); }
  else if (action === 'add-product') { const editor = target.closest('.product-editor'); const used = [...editor.querySelectorAll('[name="productId"]')].map(el => el.value); const next = state.materials.find(p => p.active && !used.includes(p.id)); if (!next) { const error = target.closest('form').querySelector('.form-error'); error.textContent = 'All active products are already included. Edit quantities or define another product.'; error.hidden = false; return; } editor.querySelector('.product-lines').insertAdjacentHTML('beforeend', productLine({ productId: next.id, quantity: 1 }, editor.dataset.actual === 'true')); updateEstimate(target.closest('form')); }
  else if (action === 'remove-product') { const form = target.closest('form'); target.closest('.product-line').remove(); updateEstimate(form); }
  else if (action === 'catalog-archive') { const [collection, ...parts] = id.split(':'); const item = state[collection].find(p => p.id === parts.join(':')); showDialog('Archive definition?', `<div class="dialog-body"><h3>${e(item.name)}</h3><p>Archived definitions remain in history but cannot be selected for new services. Products required by active services or open visits are protected.</p></div><div class="form-footer">${button('Cancel', 'close')}${button('Archive definition', 'catalog-confirm', id, 'button danger-button')}</div>`); }
  else if (action === 'catalog-confirm' || action === 'catalog-restore') { const [collection, ...parts] = id.split(':'); try { setCatalogActive(state, collection, parts.join(':'), action === 'catalog-restore'); dialog.close(); persist(action === 'catalog-restore' ? 'Definition restored.' : 'Definition archived; history preserved.'); } catch (error) { if (dialog.open) { let alert = dialog.querySelector('.catalog-error'); if (!alert) { alert = document.createElement('p'); alert.className = 'form-error catalog-error'; alert.setAttribute('role', 'alert'); dialog.querySelector('.dialog-body').append(alert); } alert.textContent = error.message; } else notify(error.message); } }
  else if (action === 'menu') { const open = document.querySelector('.sidebar').classList.toggle('mobile-open'); target.setAttribute('aria-expanded', String(open)); target.setAttribute('aria-controls', 'navigation'); }
  else if (action === 'guide') showGuide();
  else if (action === 'new-visit') visitForm(id || DEMO_DATE);
  else if (action === 'visit') visitDetail(id);
  else if (action === 'complete') completeForm(id);
  else if (action === 'report') reportDetail(id);
  else if (action === 'client') clientDetail(id);
  else if (action === 'edit-client') clientForm(id);
  else if (action === 'client-schedule') visitForm(DEMO_DATE, { clientId: id });
  else if (action === 'assessment-schedule') assessmentDetail(id);
  else if (action === 'finding-schedule') {
    const split = id.lastIndexOf(':'), assessment = screen.assessments.find(a => a.id === id.slice(0, split));
    const finding = assessment && assessmentFindings(assessment)[Number(id.slice(split + 1))];
    if (!finding) { notify('Inspection finding was not found.'); return; }
    visitForm(DEMO_DATE, { ...assessment, serviceId: finding.serviceId, solution: state.services.find(s => s.id === finding.serviceId)?.name || assessment.solution });
  }
  else if (action === 'print') window.print();
  else if (action === 'sample-day') go('schedule', { date: DEMO_DATE, view: route().params.get('view') || 'month' });
  else if (action === 'calendar-prev' || action === 'calendar-next') { const raw = route().params.get('view'), view = CALENDAR_VIEWS.includes(raw) ? raw : 'month'; try { go('schedule', { date: moveCalendar(id, view, action === 'calendar-next' ? 1 : -1), view }); } catch (error) { notify(error.message); } }
  else if (action === 'new-client') clientForm('', id);
  else if (action === 'new-assessment') assessmentForm();
  else if (action === 'restock') form('Restock material', 'restock', `<p class="field-hint">${e(material(id).name)} / ${material(id).stock} ${e(material(id).unit)} currently on hand</p>${field(`Quantity to add (${e(material(id).unit)})`, input('quantity', 'number', '', 'min="0.01" max="1000000" step="0.01"'))}`, 'Add to stock', id);
  else if (action === 'service-payment') {
    const visit = state.visits.find(v => v.id === id), report = state.reports.find(r => r.visitId === id);
    const candidates = state.invoices.filter(i => !i.visitId && i.clientId === visit.clientId && i.amount === report.actualRevenue);
    form('Review service payment link', 'service-payment', `<p class="field-hint">${e(client(visit.clientId).name)} / ${e(visit.treatment)} / ${money(report.actualRevenue)}</p><p>Check existing billing first to avoid counting this service twice. Link only an invoice that covers this exact service; account invoices covering multiple visits need separate reconciliation.</p>${field('Payment record', select('invoiceId', '<option value="new">Create a new service payment record</option>' + candidates.map(i => `<option value="${e(i.id)}">${e(i.id)} / ${dateLabel(i.date)} / ${money(i.paid)} collected</option>`).join('')))}<p class="field-hint">A new record starts unpaid and is due ${dateLabel(serviceDueDate(visit.date))}, 30 days after delivery. Linking an existing invoice keeps its due date and payments.</p>${field('Confirm billing review', '<span><input type="checkbox" name="reviewed" required> I checked existing billing and confirmed this choice will not duplicate a service balance.</span>')}`, 'Confirm payment link', id);
  }
  else if (action === 'payment') { const i = state.invoices.find(i => i.id === id); form('Record a sample payment', 'payment', `<p class="field-hint">${e(i.id)} / ${e(client(i.clientId).name)}<br>Outstanding balance: ${money(i.amount - i.paid)}<br>Due ${dateLabel(i.due)} / ${e(paymentSummary(i, DEMO_DATE).timing)}</p>${field('Amount collected (PHP)', input('amount', 'number', i.amount - i.paid, `min="0.01" max="${i.amount - i.paid}" step="0.01"`))}${field('Payment method', select('method', options(['Bank transfer', 'Cash', 'Check'])))}${field('Payment reference / proof description', input('reference', 'text', '', 'maxlength="2000"'))}<p class="field-hint">Reference text only. Actual payment processing and proof uploads are not connected.</p>`, 'Record payment', id); }
  else if (action === 'reminder') { const i = state.invoices.find(i => i.id === id); showDialog('Payment reminder preview', `<div class="dialog-body"><div class="report-note">${icon('info')}<span>Preview only. No message will be sent.</span></div><dl><dt>To</dt><dd>${e(client(i.clientId).contactPerson || client(i.clientId).contact || 'Client representative')} / ${e(client(i.clientId).name)}${client(i.clientId).email ? '<br>'+e(client(i.clientId).email) : ''}</dd><dt>Subject</dt><dd>Payment reminder for ${e(i.id)}</dd></dl><div class="reminder-copy"><p>Hello,</p><p>This is a reminder that ${e(i.id)} for ${e(i.treatment)} has an outstanding balance of ${money(i.amount - i.paid)}, due ${dateLabel(i.due)}.</p><p>Please coordinate with Zealpro Solutions Incorporated to confirm your payment details.</p><p>Thank you,<br>Zealpro Solutions Incorporated</p></div></div><div class="form-footer">${button('Close preview', 'close', '', 'button primary')}</div>`); }
  else if (action === 'payment-history') { const i = state.invoices.find(i => i.id === id); showDialog('Payment history', `<div class="dialog-body"><h3>${e(i.id)}</h3><p>Total collected: ${money(i.paid)} of ${money(i.amount)}</p>${i.payments.length ? i.payments.map(p => `<div class="history-row"><span><strong>${money(p.amount)} / ${e(p.method)}${p.voidedAt?' / Reversed':''}</strong><small>${e(p.reference)}${p.voidReason?' / '+e(p.voidReason):''}</small></span></div>`).join('') : '<p class="muted">This sample opening balance was already settled. No detailed proof is included.</p>'}</div><div class="form-footer">${button('Close', 'close')}</div>`); }
  else if (action === 'reset-confirm') showDialog('Reset this demonstration?', `<div class="dialog-body"><p>This replaces only this app’s saved sample records in this browser. Your original paperwork and logo are not affected.</p></div><div class="form-footer">${button('Keep changes', 'close')}${button('Reset sample records', 'reset', '', 'button danger-button')}</div>`);
  else if (action === 'reset') { state = createDemo(); ensurePresentation(state); dialog.close(); persist('Sample records restored.'); }
});
document.addEventListener('change', event => {
  if (!actor && event.target.matches('[data-demo-account]')) {
    const sample = DEMO_USERS.find(user => user.id === event.target.value);
    if (sample) { const form = event.target.form; form.elements.email.value = sample.email; form.elements.password.value = sample.password; const error = form.querySelector('.form-error'); error.hidden = true; }
    return;
  }
  if(event.target.matches('form[data-form="visit"] [name="clientId"]')&&actor.role==='admin')event.target.form.elements.rate.value=client(event.target.value).rate;
  if(event.target.matches('[name="decision"]')&&['report-review-save','assessment-review-save'].includes(event.target.form?.dataset.form))event.target.form.querySelector('button.primary[type="submit"]').textContent=event.target.value==='Approved'?'Approve & finalize':'Return for correction';
  if (event.target.matches('form[data-form="cumulative-filter"] [name="account"]')) { const choices = screen.clients.filter(c => event.target.value === 'all' || accountKey(c.name) === event.target.value); event.target.form.elements.branch.innerHTML = '<option value="all">All branches</option>' + options(choices.map(c => ({ id: c.id, name: `${c.name} / ${c.branch}` }))); }
  if (event.target.matches('form[data-form="ocular-submit"] [name="clientId"]')) { const fields = document.querySelector('#prospect-fields'); fields.hidden = event.target.value !== 'prospect'; fields.querySelectorAll('input').forEach(input => { input.required = event.target.value === 'prospect'; }); }
  if (event.target.matches('[data-param]')) changeParam(event.target.dataset.param, event.target.value);
  if (event.target.matches('form[data-form="visit"] [name="serviceId"]')) { const form = event.target.form, service = state.services.find(s => s.id === event.target.value); if (form.elements.rate) form.elements.rate.value = actor.role==='admin'?client(form.elements.clientId.value).rate:service.price; if (form.elements.plannedExpense) form.elements.plannedExpense.value = service.plannedExpense; form.querySelector('#service-description').textContent = service.description; form.querySelector('.product-editor').outerHTML = productEditor(service.products); }
  if (event.target.matches('.product-line [name="productId"]')) { const row = event.target.closest('.product-line'), cost = row.querySelector('[name="unitCost"]'); if (cost) cost.value = material(event.target.value).cost; }
  updateEstimate(event.target.closest('form'));
});
document.addEventListener('input', event => updateEstimate(event.target.closest('form')));
document.addEventListener('submit', async event => {
  const formElement=event.target.closest('form[data-form]');if(!formElement)return;
  event.preventDefault();
  const values=Object.fromEntries(new FormData(formElement)),id=formElement.dataset.id;
  let kind=formElement.dataset.form;
  if(kind==='demo-login'){
    const signedIn=authenticateDemo(values.email,values.password,state);
    if(!signedIn){const alert=formElement.querySelector('.form-error');alert.textContent='Use an active public sample account and its listed password.';alert.hidden=false;return;}
    actor=signedIn;render();return;
  }
  if(event.submitter?.value==='draft')kind=kind==='ocular-submit'?'ocular-draft-save':'report-draft-save';
  const numeric=keys=>keys.forEach(key=>{values[key]=Number(values[key]);});
  try{
    assertDemoAction(actor,({visit:'visit-create',client:'client-create'})[kind]||kind,state,id);
    if(kind==='cumulative-filter'){go('reports',{tab:'cumulative',...values});return;}
    if(kind==='global-search'){go('clients',{q:values.q});return;}
    if(kind==='filter'){changeParam('q',values.q);return;}
    const extra=await handleWorkspaceForm(uiContext(),kind,id,values,formElement);
    if(extra.handled){dialog.close();persist(extra.message);return;}
    let message='Changes saved in this browser.';
    if(kind==='service'){numeric(['price','plannedExpense']);saveService(state,{...values,products:readProducts(formElement)},id);message='Service definition saved. Existing estimates preserved.';}
    else if(kind==='product'){numeric(['cost','minimum']);if(!id)numeric(['stock']);saveProduct(state,values,id);message='Product definition saved. Historical captured costs preserved.';}
    else if(kind==='visit'){
      numeric(['rate','plannedExpense']);values.products=readProducts(formElement);values.personnel=[...new Set([values.technician,...new FormData(formElement).getAll('personnel')])];
      Object.assign(values,protectedValues(actor,kind,state,id,values));if(actor.role==='admin')values.rate=client(values.clientId).rate;scheduleDemoVisit(state,actor,values,id);message='Appointment saved. All personnel and product reservations checked.';
    }else if(kind==='cancel-visit'){cancelDemoVisit(state,actor,id,values.reason);message='Appointment cancelled. Unconsumed reservations released; history retained.';}
    else if(kind==='report-submit'||kind==='report-draft-save'){
      numeric(['expense','pestCount']);values.products=readProducts(formElement);const existing=state.reports.find(r=>r.visitId===id);values.actualRevenue=existing?(reportMeta(state,existing.id).pendingRevenue??existing.actualRevenue):state.visits.find(v=>v.id===id).rate;
      if(kind==='report-draft-save'){saveReportDraft(state,actor,id,values);message='Fieldwork draft saved. Stock and billing unchanged.';}
      else{const report=submitReport(state,actor,id,values);dialog.close();persist('Submitted for review. Actual stock usage posted; billing awaits approval.');reportDetail(report.id);return;}
    }else if(kind==='report-review-save'){reviewReport(state,actor,id,values.decision,values.reason);dialog.close();persist(values.decision==='Approved'?'Report approved and finalized. Service billing is ready.':'Returned for correction. Existing consumption remains posted.');reportDetail(id);return;}
    else if(kind==='legacy-financial-save'){
      const r=state.reports.find(r=>r.id===id);confirmLegacyFinancials(state,actor,id,{...r,actualRevenue:Number(values.actualRevenue),products:r.products.map(p=>({...p,unitCost:Number(values['cost_'+p.productId])})),reason:values.reason});dialog.close();persist('Historical amounts confirmed. Review existing billing before linking an invoice.');reportDetail(id);return;
    }else if(kind==='amend-save'){beginAmendment(state,actor,id,values.reason);dialog.close();persist('Amendment authorized. Approved history preserved.');reportDetail(id);return;}
    else if(kind==='client-edit'){numeric(['rate']);if(actor.role==='admin' && values.rate!==client(id).rate && !state.services.some(s=>s.active&&s.price===values.rate))throw new Error('Choose an Owner-approved catalog rate; request exceptions through Pricing requests.');enrollClient(state,values,id);dialog.close();persist('Branch profile updated; existing service history preserved.');clientDetail(id);return;}
    else if(kind==='client'){if(actor.role==='admin'&&!state.services.some(s=>s.active&&s.price===Number(values.rate)))throw new Error('Choose an Owner-approved catalog rate.');if(id&&assessmentMeta(state,id)?.status!=='Approved')throw new Error('Approve this inspection before enrollment.');numeric(['rate']);enrollClient(state,{...values,assessmentId:id});message='Client branch enrolled.';}
    else if(kind==='client-status'){setClientStatus(state,actor,id,values.status,values.reason);message='Branch lifecycle updated; records retained.';}
    else if(kind==='ocular-submit'||kind==='ocular-draft-save'){
      if(values.clientId==='prospect')values.clientId='';
      values.findings=[...formElement.querySelectorAll('.finding-line')].map(row=>({location:row.querySelector('[name="findingLocation"]').value,problem:row.querySelector('[name="findingProblem"]').value,serviceId:row.querySelector('[name="findingService"]').value,materialIds:[...row.querySelectorAll('[name="findingMaterialId"]:checked')].map(field=>field.value),notes:row.querySelector('[name="findingNotes"]').value}));
      Object.assign(values,protectedValues(actor,'assessment',state,id,values));
      if(kind==='ocular-draft-save'){saveAssessmentDraft(state,actor,values,id);message='Inspection draft saved.';}else{const assessment=submitAssessment(state,actor,values,id);dialog.close();persist('Inspection submitted for Supervisor review.');assessmentDetail(assessment.id);return;}
    }else if(kind==='assessment-review-save'){reviewAssessment(state,actor,id,values.decision,values.reason);dialog.close();persist(values.decision==='Approved'?'Inspection approved for planning.':'Inspection returned for correction.');assessmentDetail(id);return;}
    else if(kind==='restock'){restockDemo(state,actor,id,Number(values.quantity));message='Restock posted to the stock ledger.';}
    else if(kind==='service-payment'){
      const report=state.reports.find(r=>r.visitId===id);if(!report||!approved(report))throw new Error('Approve the service report before creating billing.');
      if(!values.reviewed)throw new Error('Confirm the billing review.');linkServicePayment(state,id,values.invoiceId==='new'?'':values.invoiceId);message='Service payment linked.';
    }else if(!['service','product'].includes(kind))throw new Error('This form action is not supported.');
    dialog.close();persist(message);
  }catch(error){const alert=formElement.querySelector('.form-error');if(alert){alert.textContent=error.message;alert.hidden=false;alert.scrollIntoView({block:'nearest'});}else notify(error.message);}
});
window.addEventListener('hashchange', event => {
  const calendarNavigation = [event.oldURL, event.newURL].every(url => new URL(url).hash.split('?')[0] === '#schedule');
  const scrollPosition = { left: window.scrollX, top: window.scrollY, behavior: 'instant' };
  if (dialog.open) dialog.close();
  render();
  if (calendarNavigation) window.scrollTo(scrollPosition);
  else window.scrollTo(0, 0);
});
render();
