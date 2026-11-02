import { createDemo, DEMO_DATE, STAFF, PROBLEMS, PESTS, CALENDAR_VIEWS } from './data.js';
import { summary, money as formatMoney, scheduleVisit, completeVisit, recordPayment, restock, enrollClient, addAssessment, availableStock, saveService, saveProduct, setCatalogActive, productCost, calendarRange, calendarProfit, migrateState, reviseReport, paymentSummary, serviceDueDate, linkServicePayment, moveCalendar, assessmentFindings } from './model.js';

import { DEMO_USERS, authenticateDemo, can, canView, scopeWorkspace, assertDemoAction, protectedValues } from './access.js';
import { accountKey, accountOptions, pestObservations, buildCumulativeReport } from './reporting.js';

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
let actor = null;
let screen = scopeWorkspace(state, actor);
const money = value => can(actor, 'finance') ? formatMoney(value) : 'Owner only';
const finance = html => can(actor, 'finance') ? html : '';
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
  if (!can(actor, 'finance') || visit.status !== 'Completed') return '';
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

const navigation = [['overview', 'Overview'], ['schedule', 'Schedule'], ['services', 'Services'], ['ocular', 'Ocular visits'], ['clients', 'Clients & branches'], ['reports', 'Service reports'], ['inventory', 'Products & stock'], ['billing', 'Billing & collection'], ['analytics', 'Pest analytics']];
function render() {
  document.body.dataset.role = actor?.role || '';
  if (!actor) { document.title = 'Zealpro | Demo sign in'; app.innerHTML = demoLogin(); return; }
  screen = scopeWorkspace(state, actor);
  const { view, params } = route();
  const requested = navigation.some(([key]) => key === view) ? view : 'overview';
  const blocked = !canView(actor, requested);
  const active = blocked ? 'overview' : requested;
  document.title = `Zealpro | ${navigation.find(([key]) => key === active)[1]}`;
  app.innerHTML = `<aside class="sidebar" id="navigation" aria-label="Main navigation">
    <a class="brand" href="#overview" aria-label="Zealpro overview"><img src="/assets/zealpro-logo.png" width="1052" height="384" alt="Zealpro Solutions Incorporated — Pest and Pathogen Management"></a>
    <div class="workspace"><span class="workspace-mark">${icon('services')}</span><div><strong>Operations workspace</strong><span>Zealpro Solutions Inc.</span></div></div>
    <div class="nav-label">Workspace</div><nav>${navigation.filter(([key]) => canView(actor, key)).map(([key, label], i) => `${key === 'services' ? '<div class="nav-label nav-divider">Business management</div>' : ''}<a href="#${key}" ${active === key ? 'aria-current="page"' : ''}>${icon(key)}<span>${label}</span>${key === 'schedule' ? `<span class="nav-count">${screen.visits.filter(v => v.date === DEMO_DATE && v.status !== 'Completed').length}</span>` : ''}</a>`).join('')}</nav>
    <div class="sidebar-foot">${button(`${icon('info')} Demo guide`, 'guide', '', 'guide-button')}<div class="user"><span class="avatar navy">${initials(actor.name)}</span><div><strong>${e(actor.name)}</strong><span>${e(actor.label)} / Demo access</span></div></div></div></aside>
    <div class="mobile-bar">${button(icon('menu'), 'menu', '', 'icon-button menu-button')}<a href="#overview">Zealpro</a><span class="demo-label">UI demo</span></div>
    <main id="main" data-role="${actor.role}" tabindex="-1"><div class="utility"><div class="breadcrumb">Workspace ${icon('chevron')} <span>${navigation.find(([key]) => key === active)[1]}</span></div><div class="utility-actions">${button('Sign out', 'logout', '', 'button small-button')}<form class="global-search" data-form="global-search">${icon('search')}<input name="q" aria-label="Search client branches" placeholder="Search client branches…"><kbd>Enter</kbd></form><span class="demo-label">Presentation mode</span>${button(icon('info'), 'guide', '', 'icon-button help-button')}</div></div>
    ${screen.reports.some(r => !r.financialsConfirmed) || screen.visits.some(v => v.estimateBasis) ? `<div class="finance-notice">${icon('info')}<span>Older reports need actual charges and costs confirmed before they count toward actual profit.${screen.visits.some(v => v.estimateBasis) ? ' Legacy estimates use current product costs and omit unrecorded expenses.' : ''}</span><a href="#reports">Review reports</a></div>` : ''}
    ${screen.materials.some(p => p.legacyFractionalPieces) ? `<div class="finance-notice">${icon('info')}<span>Imported fractional piece quantities were preserved. Review affected stock and reports; new piece quantities must be whole numbers.</span></div>` : ''}
    ${storageWarning ? `<div class="storage-warning" role="alert">${icon('alert')}${e(storageWarning)}</div>` : ''}
    <div class="canvas">${blocked ? '<p class="role-notice" role="status">That view is not available for your role. Your overview is shown.</p>' : ''}<p class="role-notice">${e(actor.label)} demo access${actor.role === 'technician' ? ' / Assigned work only' : ''}. Browser-local role preview; not secure hosted authentication.</p>${({ overview, schedule, services, ocular, clients, reports, inventory, billing, analytics }[active])(params)}</div>
    <footer class="page-footer"><span>Zealpro Solutions Incorporated</span><span>Illustrative data. Changes saved in this browser only.</span></footer></main>`;
  document.querySelector('.menu-button')?.setAttribute('aria-label', 'Open navigation');
  document.querySelector('.menu-button')?.setAttribute('aria-expanded', 'false');
  document.querySelector('.help-button')?.setAttribute('aria-label', 'Open demo guide');
}
function heading(title, description, action = '') { return `<header class="page-heading"><div><h1>${title}</h1><p>${description}</p></div><div class="heading-actions">${action}</div></header>`; }
function metric(label, value, note, className = '') { if (!can(actor, 'finance') && ['Projected service value', 'Accounts receivable', 'On-hand stock value'].includes(label)) return ''; return `<div class="metric ${className}"><span>${label}</span><strong>${value}</strong><small>${note}</small></div>`; }
function panelHead(title, subtitle = '', action = '') { return `<div class="panel-heading"><div><h2>${title}</h2>${subtitle ? `<p>${subtitle}</p>` : ''}</div>${action}</div>`; }
function visitRows(visits, compact = false) {
  return visits.map(v => { const c = client(v.clientId); return `<tr><td class="time-cell"><strong>${timeLabel(v.time)}</strong>${compact ? '' : `<small>${dateLabel(v.date, { month: 'short', day: 'numeric' })}</small>`}</td><td><button class="identity-link" data-action="visit" data-id="${e(v.id)}">${e(c.name)}</button><small>${e(c.branch)}</small></td><td>${e(v.treatment)}</td><td><span class="person"><span class="avatar small ${STAFF.indexOf(v.technician) % 2 ? 'cyan' : ''}">${initials(v.technician)}</span>${e(v.technician)}</span></td><td>${badge(v.status)}${servicePayment(v)}</td><td>${button(icon('chevron')+'<span class="sr-only">Open visit for '+e(c.name)+'</span>', 'visit', v.id, 'icon-button row-action')}</td></tr>`; }).join('');
}
function visitsTable(visits, compact = false) { return visits.length ? `<div class="table-scroll"><table class="visit-table"><thead><tr><th>Time</th><th>Client / branch</th><th>Treatment</th><th>Technician</th><th>Status</th><th><span class="sr-only">Details</span></th></tr></thead><tbody>${visitRows(visits, compact)}</tbody></table></div>` : empty('No services found', 'Choose another date or filter, or schedule a service.'); }
function overview(params) {
  const totals = summary(screen, DEMO_DATE);
  const status = params.get('status') || 'all';
  const dayVisits = screen.visits.filter(v => v.date === DEMO_DATE);
  const visible = dayVisits.filter(v => status === 'all' || (status === 'pending' ? v.status !== 'Completed' : v.status === 'Completed'));
  const overdue = screen.invoices.filter(i => i.due < DEMO_DATE && i.paid < i.amount);
  const low = screen.materials.filter(m => m.active && m.stock < m.minimum);
  const completed = totals.completed / (totals.scheduled || 1);
  return `<section class="operations-band" aria-label="Today's operations">${heading('Operations overview', 'Protect every site. Keep every service accountable.', `${button(`${icon('plus')} Schedule service`, 'new-visit', '', 'button primary')}`)}
    <div class="date-line"><span>${icon('schedule')} Monday, 2 November 2026</span><span>Sample working day <span class="time-label">11:30 AM</span></span></div>
    <section class="metrics" aria-label="Operations summary">${metric('Scheduled services', totals.scheduled, `Across ${new Set(dayVisits.map(v => v.clientId)).size} client branches`)}${metric('Completed services', totals.completed, `${totals.scheduled - totals.completed} visits still to fulfill`, 'completed-metric')}${metric('Projected service value', money(totals.projected), 'Scheduled value for this day')}${metric('Accounts receivable', money(totals.receivable), `${overdue.length} overdue invoice${overdue.length === 1 ? '' : 's'}`)}</section></section>
    <div class="overview-grid"><section class="panel schedule-panel">${panelHead('Service schedule', `${dayVisits.length} planned visits for the sample day`, '<a class="text-link" href="#schedule">Open calendar '+icon('chevron')+'</a>')}<div class="tabs"><a href="#overview?status=all" ${status === 'all' ? 'aria-current="page"' : ''}>All services <span>${dayVisits.length}</span></a><a href="#overview?status=pending" ${status === 'pending' ? 'aria-current="page"' : ''}>Needs action <span>${totals.scheduled - totals.completed}</span></a><a href="#overview?status=completed" ${status === 'completed' ? 'aria-current="page"' : ''}>Completed <span>${totals.completed}</span></a></div>${visitsTable(visible.slice(0, 4), true)}<div class="panel-foot"><span>Showing ${Math.min(4, visible.length)} of ${visible.length} services</span><a href="#schedule?date=${DEMO_DATE}">View full schedule ${icon('chevron')}</a></div></section>
    <aside class="overview-rail"><section class="panel fulfillment">${panelHead('Daily fulfillment')}<div class="donut-wrap"><svg class="donut" viewBox="0 0 160 160" role="img" aria-label="${totals.completed} of ${totals.scheduled} services completed"><circle class="donut-track" cx="80" cy="80" r="62"/><circle class="donut-value" cx="80" cy="80" r="62" stroke-dasharray="${completed * 389.56} 389.56" transform="rotate(-90 80 80)"/></svg><div class="donut-text"><strong>${Math.round(completed * 100)}<small>%</small></strong><span>completed</span></div></div><div class="fulfillment-legend"><span><i class="swatch lime"></i>Completed <b>${totals.completed}</b></span><span><i class="swatch neutral"></i>Remaining <b>${totals.scheduled - totals.completed}</b></span></div></section>
    <section class="attention"><h2>Needs your attention <b class="attention-count">${overdue.length + low.length}</b></h2>${low.map(m => `<a href="#inventory" class="attention-row">${icon('inventory')}<div><strong>${e(m.name)}</strong><span>${m.stock} ${e(m.unit)} left, below reorder level</span></div>${icon('chevron')}</a>`).join('')}${!low.length && !overdue.length ? '<p class="all-clear">No overdue invoices or low-stock materials.</p>' : ''}${overdue.length ? `<a href="#billing?status=overdue" class="attention-row">${icon('billing')}<div><strong>${money(overdue.reduce((n, i) => n + i.amount - i.paid, 0))} overdue</strong><span>${overdue.length} account awaiting collection</span></div>${icon('chevron')}</a>` : ''}</section></aside>
    ${can(actor, 'analytics') ? `<section class="panel trend-panel">${panelHead('Pest activity trend', 'Recorded sightings across sample branches', '<a class="text-link" href="#analytics">View analytics '+icon('chevron')+'</a>')}${trendChart('all', true)}</section>` : ''}<section class="panel recent-panel">${panelHead('Latest service reports', 'Fieldwork, documented.', '<a class="text-link" href="#reports">View all '+icon('chevron')+'</a>')}<div class="report-list">${[...screen.reports].reverse().slice(0, 3).map(r => `<button class="report-list-row" data-action="report" data-id="${e(r.id)}"><span class="document-icon">${icon('reports')}</span><span><strong>${e(client(r.clientId).name)}</strong><small>${e(r.treatment)} / ${timeLabel(r.timeOut)}</small></span>${icon('chevron')}</button>`).join('')}</div></section></div>`;
}
function profitBand(totals, label) {
  if (!can(actor, 'finance')) return '';
  return `<section class="profit-band" aria-label="${e(label)} profitability"><div class="profit-band-title"><span>${e(label)}</span><span>${totals.visits} planned services / ${totals.completed} confirmed reports</span></div><div class="profit-figures">
    <div><span>Theoretical profit</span><strong>${money(totals.theoreticalProfit)}</strong><small>All services in this view</small></div>
    <div><span>Actual profit</span><strong>${totals.actualProfit === null ? '<span class="not-recorded">Not recorded</span>' : money(totals.actualProfit)}</strong><small>${totals.completed} completed, financially confirmed</small></div>
    <div><span>Actual vs. estimate</span><strong class="${totals.variance !== null && totals.variance < 0 ? 'profit-down' : 'profit-up'}">${totals.variance === null ? '—' : `${totals.variance > 0 ? '+' : ''}${money(totals.variance)}`}</strong><small>Same completed services only</small></div>
    <div><span>Scheduled service value</span><strong>${money(totals.revenue)}</strong><small>${totals.unconfirmed ? `${totals.unconfirmed} reports await financial review` : 'Based on quoted charges'}</small></div></div>
    <p>Profit = service charge − product costs − recorded expenses. Before unrecorded overhead and tax; independent of payment collection.</p></section>`;
}
function yearCalendar(selected) {
  const year = selected.slice(0, 4), occupied = new Set(screen.visits.map(v => v.date));
  return `<div class="year-calendar" role="group" aria-label="Months in ${year}"><div class="year-months">${Array.from({ length: 12 }, (_, index) => {
    const prefix = `${year}-${String(index + 1).padStart(2, '0')}`, date = `${prefix}-01`;
    const range = calendarRange(date, 'month'), totals = calendarProfit(screen, range.start, range.end);
    const offset = (new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7, days = Number(range.end.slice(-2));
    const active = selected.startsWith(prefix), target = active ? selected : date;
    const label = dateLabel(date, { month: 'long', year: 'numeric' });
    return `<a class="year-month ${active ? 'selected-month' : ''}" href="#schedule?date=${target}&view=month" aria-label="Open ${e(label)}, ${totals.visits} services, theoretical profit ${money(totals.theoreticalProfit)}, actual profit ${totals.actualProfit === null ? 'not recorded' : money(totals.actualProfit)}"><span class="year-month-heading"><strong>${dateLabel(date, { month: 'long' })}</strong><span>${totals.visits} service${totals.visits === 1 ? '' : 's'}</span></span><span class="mini-weekdays" aria-hidden="true">${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(day => `<span>${day}</span>`).join('')}</span><span class="mini-days" aria-hidden="true">${Array.from({ length: 42 }, (_, cell) => {
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
  const allDay = screen.visits.filter(v => v.date === selected).sort((a, b) => a.time.localeCompare(b.time));
  const status = params.get('status') || 'all';
  const visible = allDay.filter(v => status === 'all' || v.status === status);
  const totals = calendarProfit(screen, range.start, range.end), dayTotals = calendarProfit(screen, selected, selected);
  const dates = [];
  if (view !== 'year') for (let date = new Date(`${range.start}T12:00:00Z`); date.getTime() <= Date.parse(`${range.end}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + 1)) dates.push(date.toISOString().slice(0, 10));
  const offset = view === 'month' ? (new Date(`${range.start}T12:00:00Z`).getUTCDay() + 6) % 7 : 0;
  const grid = view === 'year' ? yearCalendar(selected) : view === 'day' ? `<div class="day-agenda">${allDay.length ? allDay.map(v => `<button type="button" class="agenda-row" data-action="visit" data-id="${e(v.id)}"><span class="agenda-time">${timeLabel(v.time)}</span><span><strong>${e(client(v.clientId).name)}</strong><small>${e(v.treatment)} / ${e(v.technician)}</small></span>${finance(`<span class="agenda-profit">${money(v.rate - productCost(v.estimatedProducts) - v.plannedExpense)}<small>theoretical profit</small></span>`)}<span class="agenda-status">${badge(v.status)}${servicePayment(v)}</span></button>`).join('') : empty('No services on this day', 'Schedule a service to start planning this day.')}</div>` : `<div class="calendar-weekdays">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => `<span>${day}</span>`).join('')}</div><div class="calendar-grid ${view === 'week' ? 'week-grid' : ''}">${Array.from({ length: offset }, () => '<div class="calendar-day outside" aria-hidden="true"></div>').join('')}${dates.map(date => {
      const items = screen.visits.filter(v => v.date === date).sort((a, b) => a.time.localeCompare(b.time));
      return `<a class="calendar-day ${date === selected ? 'selected' : ''} ${items.length ? 'has-services' : ''}" href="#schedule?date=${date}&view=${view}" ${date === selected ? 'aria-current="date"' : ''} aria-label="${dateLabel(date)}, ${items.length} services"><span class="day-number">${Number(date.slice(-2))}</span>${items.length ? `<span class="calendar-event">${items.length} service${items.length === 1 ? '' : 's'}</span>${items.slice(0, view === 'week' ? 3 : 1).map(v => `<small class="calendar-client">${e(client(v.clientId).name)}</small>`).join('')}${view === 'week' && can(actor, 'finance') ? `<span class="cell-profit">${money(calendarProfit(screen, date, date).theoreticalProfit)}<small>theoretical</small></span>` : ''}` : ''}</a>`;
    }).join('')}${view === 'month' ? Array.from({ length: (7 - (dates.length + offset) % 7) % 7 }, () => '<div class="calendar-day outside" aria-hidden="true"></div>').join('') : ''}</div>`;
  return `${heading('Service calendar', 'Plan the work. See what each service earns.', button(`${icon('plus')} Schedule service`, 'new-visit', selected, 'button primary'))}
    <div class="calendar-topline"><div class="view-switch" aria-label="Calendar view">${CALENDAR_VIEWS.map(mode => `<a href="#schedule?date=${selected}&view=${mode}" ${mode === view ? 'aria-current="page"' : ''}>${mode[0].toUpperCase()+mode.slice(1)}</a>`).join('')}</div><span class="muted">${dateLabel(range.start)} – ${dateLabel(range.end)}</span></div>
    ${profitBand(totals, `${view[0].toUpperCase()+view.slice(1)} view`)}
    <div class="calendar-layout"><section class="panel calendar-panel"><div class="calendar-toolbar"><h2>${e(title)}</h2><div>${button(icon('left')+'<span class="sr-only">Previous period</span>', 'calendar-prev', selected, 'icon-button')}${button('Sample day', 'sample-day', '', 'button small-button')}${button(icon('chevron')+'<span class="sr-only">Next period</span>', 'calendar-next', selected, 'icon-button')}</div></div>${grid}<div class="calendar-key"><span class="calendar-key-mark"></span>Scheduled service${view === 'month' ? '<span class="calendar-outside-label"><i aria-hidden="true"></i>Outside this month</span>' : ''}<span>${view === 'year' ? 'Open a month to plan its services.' : 'Choose a day to see its details.'}</span></div></section>
    <aside class="day-detail panel" aria-label="Selected day details"><div class="day-detail-heading"><strong class="day-detail-number">${Number(selected.slice(-2))}</strong><div><h2>${dateLabel(selected, { weekday: 'long' })}</h2><p>${dateLabel(selected, { month: 'long', year: 'numeric' })}</p></div><span>${allDay.length} services</span></div>
      ${finance(`<div class="day-profits"><div><span>Theoretical profit</span><strong>${money(dayTotals.theoreticalProfit)}</strong></div><div><span>Actual profit</span><strong>${dayTotals.actualProfit === null ? 'Not recorded' : money(dayTotals.actualProfit)}</strong></div></div>
      `)}<div class="day-detail-filter"><h3>Day’s services</h3><label class="sr-only" for="day-status">Filter day services</label><select id="day-status" data-param="status"><option value="all">All statuses</option>${options(['Scheduled', 'In progress', 'Completed'], status)}</select></div>
      <div class="dispatch-list">${visible.length ? visible.map(v => { const report = screen.reports.find(r => r.visitId === v.id); return `<button type="button" class="dispatch-row" data-action="visit" data-id="${e(v.id)}"><span class="dispatch-row-top"><span>${timeLabel(v.time)}</span>${badge(v.status)}</span><strong>${e(client(v.clientId).name)}</strong><small>${e(client(v.clientId).branch)} / ${e(v.treatment)}</small>${servicePayment(v)}<span class="dispatch-row-foot"><span class="person"><span class="avatar small">${initials(v.technician)}</span>${e(v.technician)}</span><span>${report?.financialsConfirmed ? money(report.actualRevenue - productCost(report.products) - report.expense)+' actual' : money(v.rate - productCost(v.estimatedProducts) - v.plannedExpense)+' est.'}</span></span></button>`; }).join('') : empty('No services in this view', 'Change the status filter or select another day.')}</div>
      <div class="day-detail-footer">${button(icon('plus')+' Add service for this day', 'new-visit', selected, 'button')}</div></aside></div>`;
}
function services(params) {
  const archived = params.get('status') === 'archived', query = (params.get('q') || '').toLowerCase();
  const visible = screen.services.filter(s => s.active !== archived && `${s.name} ${s.description}`.toLowerCase().includes(query));
  return `${heading('Services', 'Define the work, price it clearly, and plan the products it needs.', button(icon('plus')+' Define service', 'service-form', '', 'button primary'))}
    <div class="catalog-toolbar"><div class="tabs standalone"><a href="#services" ${!archived ? 'aria-current="page"' : ''}>Active services <span>${screen.services.filter(s => s.active).length}</span></a><a href="#services?status=archived" ${archived ? 'aria-current="page"' : ''}>Archived</a></div>${searchBar('Search services', params)}</div>
    <div class="service-catalog">${visible.length ? visible.map(service => { const cost = service.products.reduce((total, line) => total + Math.round(line.quantity * material(line.productId).cost * 100) / 100, 0); return `<article class="service-card"><div class="service-card-heading"><span class="service-symbol">${icon('services')}</span>${badge(service.active ? 'Active service' : 'Archived')}</div><h2>${e(service.name)}</h2><p class="service-description">${e(service.description)}</p><div class="service-price"><strong>${money(service.price)}</strong><span>default service charge</span></div><div class="recipe"><h3>Estimated products</h3>${service.products.length ? service.products.map(line => `<div><span>${e(material(line.productId).name)}</span><strong>${line.quantity} ${e(material(line.productId).unit)}</strong></div>`).join('') : '<p>No products planned for this service.</p>'}</div>${finance(`<div class="service-economics"><span>Products <b>${money(cost)}</b></span><span>Other expenses <b>${money(service.plannedExpense)}</b></span><span>Theoretical profit <b>${money(service.price - cost - service.plannedExpense)}</b></span></div>`)}<div class="service-card-actions">${button('Edit service', 'service-form', service.id, 'button small-button')}${button(service.active ? 'Archive' : 'Restore', service.active ? 'catalog-archive' : 'catalog-restore', 'services:'+service.id, 'text-button')}</div></article>`; }).join('') : empty('No services found', 'Define a service or change the search and status filter.')}</div>`;
}
function searchBar(placeholder, params) { return `<form class="filter-search" data-form="filter">${icon('search')}<input name="q" aria-label="${e(placeholder)}" value="${e(params.get('q') || '')}" placeholder="${e(placeholder)}"><button type="submit" class="button small-button">Search</button></form>`; }
function clients(params) {
  const query = (params.get('q') || '').toLowerCase();
  const visible = screen.clients.filter(c => [c.name, c.branch, c.address, c.contactPerson, c.contact, c.phone, c.email].join(' ').toLowerCase().includes(query));
  return `${heading('Clients & branches', 'Manage branch details, contacts, and service agreements.', button(`${icon('plus')} Enroll client`, 'new-client', '', 'button primary'))}<div class="list-toolbar">${searchBar('Search client, branch or contact', params)}<span class="muted">${visible.length} branches</span></div><section class="panel">${visible.length ? `<div class="table-scroll"><table class="clients-table"><thead><tr><th>Client / branch</th><th>Contact details</th><th>Service agreement</th>${finance(`<th>Agreed rate</th>`)}<th>Visits</th><th>Manage</th></tr></thead><tbody>${visible.map(c => `<tr><td><button class="identity-link" data-action="client" data-id="${e(c.id)}">${e(c.name)}</button><small>${e(c.branch)} / ${e(c.address)}</small></td><td class="client-contact-cell"><strong>${e(c.contactPerson || 'Contact person not provided')}</strong>${c.contact ? `<small>${e(c.contact)}</small>` : ''}${c.phone ? `<small>${e(c.phone)}</small>` : ''}${c.email ? `<small>${e(c.email)}</small>` : ''}${!c.phone && !c.email ? '<small>No phone or email provided</small>' : ''}</td><td>${e(c.package)}<small>${e(c.duration)} from ${dateLabel(c.since)}</small></td>${finance(`<td class="numeric">${money(c.rate)}<small>per scheduled service</small></td>`)}<td>${screen.visits.filter(v => v.clientId === c.id).length}</td><td><div class="product-actions">${button('Edit details', 'edit-client', c.id, 'button small-button')}${button('View profile', 'client', c.id, 'text-button')}</div></td></tr>`).join('')}</tbody></table></div>` : empty('No matching branches', 'Try another client, branch or contact, or enroll a new branch.')}</section>`;
}
function ocular(params) {
  return `${heading('Ocular visits', 'Document each inspected area, problem and treatment recommendation.', button(`${icon('plus')} New assessment`, 'new-assessment', '', 'button primary'))}<section class="panel">${panelHead('Site assessments', 'Several findings and suggested products can belong to one inspection')}<div class="assessment-list">${screen.assessments.length ? [...screen.assessments].reverse().map(a => `<article class="assessment"><div class="assessment-date"><strong>${dateLabel(a.date, { day: 'numeric' })}</strong><span>${dateLabel(a.date, { month: 'short' })}</span></div><div><h3>${e(assessmentAccount(a).name)}</h3><span class="assessment-branch">${e(assessmentAccount(a).branch)}${a.clientId ? '' : ' / Prospect'}</span><p>${e(a.assessor)} / ${timeLabel(a.time)}</p><p>${assessmentFindings(a).length} finding${assessmentFindings(a).length === 1 ? '' : 's'}: ${assessmentFindings(a).map(f => e(f.problem)).join(', ')}</p><p>${e(a.notes)}</p></div><div class="assessment-actions">${button('View findings', 'ocular-detail', a.id, 'button small-button')}${a.clientId ? button('Plan service', 'assessment-schedule', a.id, 'text-button') : button('Enroll client', 'new-client', a.id, 'text-button')}</div></article>`).join('') : empty('No assessments yet', 'Record an inspection and add one or more findings.')}</div></section>`;
}
function reports(params) {
  if (params.get('tab') === 'cumulative') return cumulativeView(params);
  const query = (params.get('q') || '').toLowerCase();
  const visible = screen.reports.filter(r => `${r.id} ${client(r.clientId).name} ${r.treatment}`.toLowerCase().includes(query));
  return `${heading('Service reports', 'Your paper service report, connected to the work performed.', button(icon('plus')+' Record service report', 'choose-report', '', 'button primary'))}${reportTabs()}<div class="report-note">${icon('reports')}<span>Reports compile automatically when a treatment is completed. Customer signatures remain uncollected in this demo.</span></div><div class="list-toolbar">${searchBar('Search report or client', params)}<span class="muted">${visible.length} reports</span></div><section class="panel">${visible.length ? `<div class="table-scroll"><table><thead><tr><th>Report / date</th><th>Client / branch</th><th>Activity conducted</th><th>Personnel</th>${finance(`<th>Payment</th>`)}<th>Action</th></tr></thead><tbody>${[...visible].reverse().map(r => `<tr><td><strong class="report-id">${e(r.id.startsWith('SR-2026') ? r.id : 'SR-'+r.id.slice(-8).toUpperCase())}</strong><small>${dateLabel(r.date)}</small></td><td><strong>${e(client(r.clientId).name)}</strong><small>${e(client(r.clientId).branch)}</small></td><td>${e(r.treatment)}<small>${e(r.location)}</small></td><td>${e(r.technician)}</td>${finance(`<td>${servicePayment(screen.visits.find(v => v.id === r.visitId))}</td>`)}<td><div class="report-actions">${button('View report', 'report', r.id, 'button small-button')}${button(r.financialsConfirmed ? 'Edit actual usage' : 'Review actual values', 'edit-report', r.id, 'text-button')}</div></td></tr>`).join('')}</tbody></table></div>` : empty('No matching reports', 'Complete a service to generate a report, or clear your search.')}</section>`;
}
function inventory(params) {
  const archived = params.get('status') === 'archived';
  const active = screen.materials.filter(p => p.active), visible = screen.materials.filter(p => p.active !== archived);
  return `${heading('Products & stock', 'Your product catalog, unit costs, and field stock in one place.', button(icon('plus')+' Define product', 'product-form', '', 'button primary'))}
    <section class="metrics three">${metric('Active products', active.length, 'Available for service planning')}${metric('Below reorder level', active.filter(p => p.stock < p.minimum).length, 'Based on on-hand stock')}${metric('On-hand stock value', money(active.reduce((n, p) => n + Math.round(p.stock * p.cost * 100) / 100, 0)), 'Active products at catalog costs')}</section>
    <div class="tabs standalone"><a href="#inventory" ${!archived ? 'aria-current="page"' : ''}>Active products</a><a href="#inventory?status=archived" ${archived ? 'aria-current="page"' : ''}>Archived products</a></div>
    <section class="panel">${panelHead(archived ? 'Archived product definitions' : 'Product register', 'Product costs are per base unit. Existing visits and reports retain their captured costs.')} ${visible.length ? `<div class="table-scroll"><table class="product-table"><thead><tr><th>Product</th>${finance(`<th class="numeric">Unit cost</th>`)}<th class="numeric">On hand</th><th class="numeric">Allocated</th><th class="numeric">Available</th><th>Status</th><th>Manage</th></tr></thead><tbody>${visible.map(p => { const available = availableStock(state, p.id); return `<tr><td><strong>${e(p.name)}</strong><small>${e(p.description)}</small></td>${finance(`<td class="numeric">${money(p.cost)}<small>per ${e(p.unit)}</small></td>`)}<td class="numeric">${p.stock.toLocaleString()} ${e(p.unit)}</td><td class="numeric">${Math.round((p.stock - available)*100)/100} ${e(p.unit)}</td><td class="numeric">${available.toLocaleString()} ${e(p.unit)}</td><td>${badge(!p.active ? 'Archived' : p.stock < p.minimum ? 'Low stock' : 'Sufficient')}<small>Reorder at ${p.minimum} ${e(p.unit)}</small></td><td><div class="product-actions">${button('Edit', 'product-form', p.id, 'button small-button')}${p.active ? button('Restock', 'restock', p.id, 'button small-button') : ''}${button(p.active ? 'Archive' : 'Restore', p.active ? 'catalog-archive' : 'catalog-restore', 'materials:'+p.id, 'text-button')}</div></td></tr>`; }).join('')}</tbody></table></div>` : empty('No products in this catalog', 'Define a product or choose another catalog status.')}</section>`;
}
function billing(params) {
  const filter = params.get('status') || 'all';
  const filters = [['all', 'All invoices'], ['outstanding', 'All unpaid balances'], ['unpaid', 'Unpaid'], ['partial', 'Partially paid'], ['overdue', 'Overdue'], ['paid', 'Paid']];
  const visible = screen.invoices.filter(i => {
    const payment = paymentSummary(i, DEMO_DATE);
    return (!params.get('invoice') || i.id === params.get('invoice')) && (filter === 'all' || (filter === 'outstanding' ? payment.balance > 0 : filter === 'partial' ? i.paid > 0 && payment.balance > 0 : payment.status.toLowerCase() === filter));
  });
  return `${heading('Billing & collection', 'Service completion and payment collection are tracked separately.')}
    <section class="metrics three">${metric('Outstanding balance', money(summary(state, DEMO_DATE).receivable), 'All sample accounts')}${metric('Overdue balance', money(screen.invoices.filter(i => i.due < DEMO_DATE).reduce((n, i) => n + i.amount - i.paid, 0)), 'As of 2 November 2026')}${metric('Amount collected', money(screen.invoices.reduce((n, i) => n + i.paid, 0)), 'Across all sample invoices')}</section>
    <div class="report-note">${icon('info')}<span>Newly completed services are payable within 30 calendar days of delivery. Statuses shown as of ${dateLabel(DEMO_DATE)}, the sample day. Existing invoice terms are preserved.</span></div>
    <div class="tabs standalone">${filters.map(([key, label]) => `<a href="#billing?status=${key}" ${key === filter && !params.has('invoice') ? 'aria-current="page"' : ''}>${label}</a>`).join('')}</div>
    <section class="panel">${visible.length ? `<div class="table-scroll"><table class="billing-table"><thead><tr><th>Invoice / client</th><th>Service</th><th>Billing date</th><th>Due date</th><th class="numeric">Balance</th><th>Payment status</th><th>Action</th></tr></thead><tbody>${visible.map(i => {
      const payment = paymentSummary(i, DEMO_DATE);
      return `<tr><td><strong>${e(i.id)}</strong><small>${e(client(i.clientId).name)} / ${e(client(i.clientId).branch)}</small></td><td>${i.visitId ? badge('Completed') + button('View service', 'visit', i.visitId, 'text-button') : '<small>Account invoice · no service link</small>'}</td><td>${dateLabel(i.date)}</td><td>${dateLabel(i.due)}<small>${e(payment.timing)}</small></td><td class="numeric"><strong>${money(payment.balance)}</strong><small>${money(i.paid)} paid of ${money(i.amount)}</small></td><td>${badge(payment.status)}</td><td class="action-cell">${payment.balance > 0 ? button('Record payment', 'payment', i.id, 'button small-button') + button('Preview reminder', 'reminder', i.id, 'text-button') : button('Payment history', 'payment-history', i.id, 'button small-button')}</td></tr>`;
    }).join('')}</tbody></table></div>` : empty('No invoices in this view', 'Choose another invoice status.')}</section>
    <p class="muted footnote">Local demonstration records only; these are not issued tax invoices. Reminder previews do not send email or SMS.</p>`;
}
function observations(scope) {
  return pestObservations(screen, scope);
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
function analytics(params) {
  const scope = screen.clients.some(c => c.id === params.get('client')) ? params.get('client') : 'all', data = observations(scope);
  return `${heading('Pest analytics', 'Inspect the observations behind each graph.', `<label class="inline-label">Branch <select data-param="client"><option value="all">All client branches</option>${clientOptions(scope)}</select></label>`)}<div class="report-note">${icon('info')}<span>The original 15 historical counts and 3 service reports are illustrative samples. Reports you save add their own pest counts. This is not an external/live data feed. Sources are listed below; counts do not prove treatment effectiveness.</span></div><section class="panel analytics-chart">${panelHead('Pest occurrence over time', 'Monthly sums from recorded observations')}${trendChart(scope)}</section><section class="panel day-panel">${panelHead('Observation source records', 'Use a service-report link to inspect a contributing record')}<div class="table-scroll"><table><thead><tr><th>Client / branch</th><th>Observation date</th><th>Pest</th><th class="numeric">Sightings</th><th>Source</th></tr></thead><tbody>${[...data].sort((a, b) => b.date.localeCompare(a.date)).map(o => `<tr><td><strong>${e(client(o.clientId).name)}</strong><small>${e(client(o.clientId).branch)}</small></td><td>${dateLabel(o.date)}</td><td>${e(o.pest)}</td><td class="numeric">${o.count}</td><td>${e(o.sourceLabel)}${o.sourceKind === 'report' ? button('View source report', 'report', o.sourceId, 'text-button') : ''}</td></tr>`).join('')}</tbody></table></div></section>`;
}

function demoLogin() {
  return `<main id="main" class="login-page" tabindex="-1"><section class="login-panel"><img src="/assets/zealpro-logo.png" width="1052" height="384" alt="Zealpro Solutions Incorporated"><h1>Demo sign in</h1><p>Preview the Owner, Supervisor and Technician workflows.</p><form data-form="demo-login">${field('Demo email', input('email', 'email', '', 'autocomplete="username"'))}${field('Demo password', input('password', 'password', '', 'autocomplete="current-password"'))}<p class="form-error" role="alert" hidden></p><button class="button primary" type="submit">Sign in to demo</button></form><p class="role-notice">Public sample accounts, not secure authentication. Do not enter real passwords or confidential data. Reloading ends the demo session; saved workspace records remain.</p><details><summary>Sample login credentials</summary><div class="table-scroll"><table><thead><tr><th>Role</th><th>Email</th><th>Demo password</th></tr></thead><tbody>${DEMO_USERS.map(u => `<tr><td>${e(u.label)}</td><td>${e(u.email)}</td><td>${e(u.password)}</td></tr>`).join('')}</tbody></table></div></details></section></main>`;
}
function reportTabs(tab = 'services') {
  return `<div class="tabs standalone"><a href="#reports" ${tab === 'services' ? 'aria-current="page"' : ''}>Service reports</a>${can(actor, 'cumulative') ? `<a href="#reports?tab=cumulative" ${tab === 'cumulative' ? 'aria-current="page"' : ''}>Cumulative client / branch report</a>` : ''}</div>`;
}
function cumulativeFilters(params) {
  return { account: params.get('account') || 'all', branch: params.get('branch') || 'all', start: params.get('start') || `${DEMO_DATE.slice(0, 4)}-01-01`, end: params.get('end') || `${DEMO_DATE.slice(0, 4)}-12-31` };
}
function cumulativeContent(report, printable = false) {
  const table = (heads, rows) => `<div class="table-scroll"><table><thead><tr>${heads.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.length ? rows.join('') : `<tr><td colspan="${heads.length}">No records in this scope.</td></tr>`}</tbody></table></div>`;
  return `<div class="cumulative-summary">${printable ? '' : `<h2>${e(report.accountLabel)} / ${e(report.branchLabel)}</h2><p>${dateLabel(report.start)} through ${dateLabel(report.end)}, inclusive.</p>`}<div class="metrics">${metric('Services', report.totals.visits, 'Services dated in this period')}${metric('Completed', report.totals.completed, 'Fulfillment, independent of payment')}${metric('Service reports', report.totals.reports, 'Recorded treatment reports')}${metric('Ocular assessments', report.totals.assessments, 'Linked branch assessments')}</div></div>${can(actor, 'finance') ? profitBand(report.financial, 'Cumulative report') : printable ? '' : '<p class="role-notice">Operational report. Pricing, costs, profit and billing are available to the Owner only.</p>'}<section class="cumulative-section"><h2>Branch summary</h2>${table(['Account / branch', 'Services', 'Completed', 'Reports', 'Assessments'], report.branches.map(b => `<tr><td><strong>${e(b.name)}</strong><small>${e(b.branch)}</small></td><td>${b.visits}</td><td>${b.completed}</td><td>${b.reports}</td><td>${b.assessments}</td></tr>`))}</section><section class="cumulative-section"><h2>Services in this period</h2>${table(['Date', 'Account / branch', 'Treatment', 'Technician', 'Status'], report.visits.map(v => `<tr><td>${dateLabel(v.date)}<small>${timeLabel(v.time)}</small></td><td>${e(client(v.clientId).name)}<small>${e(client(v.clientId).branch)}</small></td><td>${e(v.treatment)}</td><td>${e(v.technician)}</td><td>${badge(v.status)}</td></tr>`))}</section><section class="cumulative-section"><h2>Actual products used</h2>${table(['Captured product name', 'Quantity', 'Unit'], report.products.map(p => `<tr><td>${e(p.name)}</td><td>${p.quantity}</td><td>${e(p.unit)}</td></tr>`))}</section>${printable ? cumulativeNarratives(report) : `<section class="cumulative-section"><h2>Service findings and recommendations</h2>${table(['Date / branch', 'Pest count', 'Findings', 'Recommendation'], report.reports.map(r => `<tr><td>${dateLabel(r.date)}<small>${e(client(r.clientId).branch)}</small></td><td>${r.pestCount} ${e(r.pest)}</td><td class="wrap-cell">${e(r.findings)}</td><td class="wrap-cell">${e(r.recommendation)}</td></tr>`))}</section><section class="cumulative-section"><h2>Ocular findings</h2>${table(['Date / branch', 'Inspected area', 'Problem', 'Recommended service', 'Suggested products', 'Notes'], report.assessments.flatMap(a => a.findings.map(f => `<tr><td>${dateLabel(a.date)}<small>${e(client(a.clientId).branch)}</small></td><td class="wrap-cell">${e(f.location)}</td><td>${e(f.problem)}</td><td>${e(f.serviceName)}</td><td class="wrap-cell">${e(f.materialNames.join(', '))}</td><td class="wrap-cell"><strong>Finding notes</strong>${e(f.notes || 'No additional notes.')}<small>Assessment notes: ${e(a.notes || 'None recorded.')}</small></td></tr>`)))}</section>`}<p class="footnote">Counts are recorded sightings, not unique pests or proof of treatment effectiveness. Qualitative ocular findings are not converted into sighting counts. Product quantities retain their own units.</p>`;
}
function cumulativeNarratives(report) {
  return `<section class="cumulative-section"><h2>Service findings and recommendations</h2>${report.reports.length ? report.reports.map(r => `<section class="cumulative-record"><h3>${dateLabel(r.date)} / ${e(client(r.clientId).name)} / ${e(client(r.clientId).branch)}</h3><dl class="detail-grid"><div><dt>Activity / method</dt><dd>${e(r.treatment)} / ${e(r.method)}</dd></div><div><dt>Personnel / time</dt><dd>${e(r.technician)} / ${timeLabel(r.timeIn)}–${timeLabel(r.timeOut)}</dd></div><div><dt>Area covered</dt><dd>${e(r.location)}</dd></div><div><dt>Observed count</dt><dd>${r.pestCount} ${e(r.pest)}</dd></div></dl><div class="report-sections"><section><h4>Findings</h4><p>${e(r.findings)}</p></section><section><h4>Recommendation</h4><p>${e(r.recommendation)}</p></section></div></section>`).join('') : '<p>No service reports in this period.</p>'}</section><section class="cumulative-section"><h2>Ocular inspection findings</h2>${report.assessments.length ? report.assessments.map(a => `<section class="cumulative-record"><h3>${dateLabel(a.date)} / ${e(client(a.clientId).name)} / ${e(client(a.clientId).branch)}</h3><p>${e(a.assessor)} / ${timeLabel(a.time)}</p>${a.findings.map((f, index) => `<div class="finding-document"><h4>Finding ${index + 1}: ${e(f.location)}</h4><dl class="detail-grid"><div><dt>Problem</dt><dd>${e(f.problem)}</dd></div><div><dt>Recommended service</dt><dd>${e(f.serviceName)}</dd></div><div><dt>Suggested products</dt><dd>${e(f.materialNames.join(', '))}</dd></div><div><dt>Finding notes</dt><dd>${e(f.notes || 'No additional notes.')}</dd></div></dl></div>`).join('')}<h4>General assessment notes</h4><p>${e(a.notes || 'No additional notes.')}</p></section>`).join('') : '<p>No linked branch assessments in this period.</p>'}</section>`;
}
function cumulativeDocument(report) {
  return `<article class="report-sheet cumulative-pdf"><div class="report-mast"><img src="/assets/zealpro-logo.png" width="1052" height="384" alt="Zealpro Solutions Incorporated"><div><strong>Cumulative service report</strong><span>${e(report.start)} / ${e(report.end)}</span><small>${can(actor, 'finance') ? 'Owner financial copy' : 'Operational copy'} / Demonstration</small></div></div><div class="report-account"><div><span>Client / account</span><h3>${e(report.accountLabel)}</h3><p>${e(report.branchLabel)}</p></div><div><span>Reporting period</span><strong>${dateLabel(report.start)} through ${dateLabel(report.end)}</strong><p>Service dates within this period, inclusive.</p></div></div>${cumulativeContent(report, true)}<div class="report-signatures"><div><span>Compiled by</span><strong>${e(actor.name)}</strong><small>${e(actor.label)} / Demo workspace</small></div><div><span>Customer acknowledgment</span><strong>Not signed</strong><small>Presentation copy only</small></div></div></article>`;
}
function cumulativeView(params) {
  if (!can(actor, 'cumulative')) return heading('Cumulative reports', 'This report is available to Supervisors and the Owner.');
  const filter = cumulativeFilters(params), accounts = accountOptions(screen);
  const branches = screen.clients.filter(c => filter.account === 'all' || accountKey(c.name) === filter.account);
  let report;
  try { report = buildCumulativeReport(screen, filter); } catch (error) { return `${heading('Cumulative reports', 'Choose an account, branch and date range.')}${reportTabs('cumulative')}<p class="form-error" role="alert">${e(error.message)}</p><a class="button" href="#reports?tab=cumulative">Reset report filters</a>`; }
  return `${heading('Cumulative reports', 'Combine branch service history, inspections and actual products used.', button(icon('reports') + ' Generate PDF report', 'cumulative-preview', '', 'button primary'))}${reportTabs('cumulative')}<form data-form="cumulative-filter" class="cumulative-filters">${field('Client / account', `<select name="account"><option value="all">All accounts</option>${accounts.map(a => `<option value="${e(a.key)}" ${a.key === filter.account ? 'selected' : ''}>${e(a.name)}</option>`).join('')}</select>`)}${field('Branch', `<select name="branch"><option value="all">All branches</option>${options(branches.map(c => ({ id: c.id, name: `${c.name} / ${c.branch}` })), filter.branch)}</select>`)}${field('From date', input('start', 'date', filter.start))}${field('Through date', input('end', 'date', filter.end))}<button class="button" type="submit">Apply filters</button></form>${cumulativeContent(report)}`;
}
function assessmentLine(row = {}) {
  return `<fieldset class="finding-line"><legend>Inspection finding</legend><div class="field-pair">${field('Location / area inspected', input('findingLocation', 'text', row.location || '', 'maxlength="2000"'))}${field('Problem found', select('findingProblem', options(PROBLEMS, row.problem)))}</div>${field('Recommended solution', select('findingService', serviceOptions(row.serviceId)))}<fieldset class="finding-products"><legend>Suggested products — select at least one</legend>${state.materials.filter(m => m.active).map(m => `<label><input type="checkbox" name="findingMaterialId" value="${e(m.id)}" ${(row.materialIds || []).includes(m.id) ? 'checked' : ''}> ${e(m.name)} (${e(m.unit)})</label>`).join('')}</fieldset>${field('Finding notes (optional)', `<textarea name="findingNotes" rows="2" maxlength="2000">${e(row.notes || '')}</textarea>`)}${button('Remove finding', 'remove-finding', '', 'text-button')}</fieldset>`;
}
function assessmentForm() {
  form('New ocular assessment', 'assessment', `${field('Client / prospect', select('clientId', '<option value="prospect">New prospect (not yet enrolled)</option>' + clientOptions()))}<div id="prospect-fields" class="field-pair">${field('Prospect account name', input('accountName', 'text', '', 'maxlength="100"'))}${field('Prospect branch / store', input('branch', 'text', '', 'maxlength="100"'))}</div><div class="field-pair">${field('Assessment date', input('date', 'date', DEMO_DATE))}${field('Time', input('time', 'time', '09:00'))}</div>${actor.role === 'technician' ? `<p>Assessed by ${e(actor.name)}</p>` : field('Assessed by', select('assessor', options(STAFF)))}<div class="finding-lines">${assessmentLine()}</div>${button('Add another finding', 'add-finding', '', 'button small-button')}${field('General assessment notes (optional)', '<textarea name="notes" rows="2" maxlength="2000"></textarea>')}<p class="field-hint">Record each area/problem separately, with its own recommended service and products. Up to 20 findings per inspection.</p>`, 'Save assessment');
}
function assessmentDetail(id) {
  const a = screen.assessments.find(a => a.id === id);
  if (!a) return;
  showDialog('Ocular inspection findings', `<div class="dialog-body"><h3>${e(assessmentAccount(a).name)} / ${e(assessmentAccount(a).branch)}</h3><p>${dateLabel(a.date)} / ${timeLabel(a.time)} / ${e(a.assessor)}</p>${assessmentFindings(a).map((f, index) => `<section class="cumulative-section"><h3>Finding ${index + 1}: ${e(f.location)}</h3><dl><dt>Problem</dt><dd>${e(f.problem)}</dd><dt>Recommended service</dt><dd>${e(state.services.find(s => s.id === f.serviceId)?.name || a.solution)}</dd><dt>Suggested products</dt><dd>${f.materialIds.map(id => e(material(id)?.name || id)).join(', ')}</dd><dt>Notes</dt><dd>${e(f.notes || 'No additional notes.')}</dd></dl>${a.clientId ? button('Plan this treatment', 'finding-schedule', `${id}:${index}`, 'button small-button') : ''}</section>`).join('')}<p>${e(a.notes)}</p></div><div class="form-footer">${button('Close', 'close')}${!a.clientId ? button('Enroll client', 'new-client', id, 'button primary') : ''}</div>`, true);
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
  return `<div class="product-line"><div class="product-line-fields">${field('Product', select('productId', materialOptions(p.id)))}${field(`Quantity (${e(p.unit)})`, input('productQuantity', 'number', line.quantity ?? 1, `min="${p.unit === 'pcs' ? '1' : '0.01'}" max="1000000" step="${p.unit === 'pcs' ? '1' : '0.01'}"`))}${can(actor, 'finance') ? (actual ? field('Actual unit cost (PHP)', input('unitCost', 'number', line.unitCost ?? p.cost, 'min="0" max="1000000000" step="0.01"')) : `<div class="line-price"><span>Cost per ${e(p.unit)}</span><strong>${money(p.cost)}</strong></div>`) : ''}</div>${button(icon('close')+'<span class="sr-only">Remove product</span>', 'remove-product', '', 'icon-button')}</div>`;
}
function productEditor(lines, actual = false) {
  return `<fieldset class="product-editor" data-actual="${actual}"><legend>${actual ? 'Actual products used' : 'Estimated products'}</legend><p class="field-hint">${actual ? 'Enter what was actually consumed. Adjust quantity and unit cost, add different products, or remove every row if no product was used.' : 'Plan quantities in each product’s base unit. Service estimates are copied into each visit.'}</p><div class="product-lines">${lines.map(line => productLine(line, actual)).join('')}</div>${button(icon('plus')+' Add product', 'add-product', '', 'button small-button')}<p class="products-empty" ${lines.length ? 'hidden' : ''}>No products in this ${actual ? 'actual usage' : 'estimate'}.</p>${finance(`<div class="estimate-preview"><span>Product cost</span><strong data-product-total></strong><span>${actual ? 'Actual' : 'Theoretical'} profit</span><strong data-profit-preview></strong></div>`)}</fieldset>`;
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
  form(c ? 'Edit client branch' : 'Enroll a client branch', c ? 'client-edit' : 'client', `${field('Account name', input('name', 'text', c?.name || assessment?.accountName || '', 'maxlength="100"'))}${field('Branch / store', input('branch', 'text', c?.branch || assessment?.branch || '', 'maxlength="100"'))}${field('Address', input('address', 'text', c?.address || '', 'maxlength="500"'))}<div class="field-pair">${field('Contact person (optional)', input('contactPerson', 'text', c?.contactPerson || '', 'maxlength="100" autocomplete="name"', false))}${field('Contact role / position (optional)', input('contact', 'text', c?.contact || '', 'maxlength="100" autocomplete="organization-title"', false))}</div><div class="field-pair">${field('Phone / mobile (optional)', input('phone', 'tel', c?.phone || '', 'maxlength="50" autocomplete="tel"', false))}${field('Email (optional)', input('email', 'email', c?.email || '', 'maxlength="254" autocomplete="email"', false))}</div>${field('Duration of service agreement', select('duration', options(durations, c?.duration)))}${field('Service / treatment package', select('package', options(packages, c?.package)))}<div class="field-pair">${field('Agreement start', input('since', 'date', c?.since || DEMO_DATE))}${field('Agreed rate per service (PHP)', input('rate', 'number', c?.rate ?? '', 'min="0" max="1000000000" step="0.01"'))}</div>${c ? '<p class="field-hint">Updates keep this branch’s service and payment history. Existing quoted charges and invoices retain their recorded amounts.</p>' : ''}`, c ? 'Save changes' : 'Enroll branch', c ? id : assessmentId);
}

function visitForm(date = DEMO_DATE, preset = {}) {
  const recommended = preset.serviceId ? state.services.find(s => s.id === preset.serviceId) : preset.solution ? state.services.find(s => s.name === preset.solution) : null;
  if ((preset.serviceId || preset.solution) && !recommended?.active) {
    showDialog('Recommended service unavailable', `<div class="dialog-body"><p>The recommended service ${e(preset.solution || recommended?.name || '')} is archived or no longer identifiable. Restore it, or explicitly choose a different service.</p><a class="button" href="#services?status=archived">Manage archived services</a></div><div class="form-footer">${button('Close', 'close')}${button('Choose a different service', 'new-visit', date, 'button primary')}</div>`);
    return;
  }
  const service = recommended || state.services.find(s => s.active);
  if (!service) { showDialog('No active services', `<div class="dialog-body"><p>Define or restore a service before scheduling.</p><a class="button primary" href="#services">Manage services</a></div>`); return; }
  form('Schedule a service', 'visit', `${field('Client / branch', select('clientId', clientOptions(preset.clientId)))}<div class="field-pair">${field('Service date', input('date', 'date', date))}${field('Start time', input('time', 'time', '13:00'))}</div>${field('Service definition', select('serviceId', serviceOptions(service.id)))}<p class="field-hint" id="service-description">${e(service.description)}</p>${field('Technician in charge', select('technician', options(STAFF)))}<div class="field-pair">${can(actor, 'finance') ? field('Quoted service charge (PHP)', input('rate', 'number', service.price, 'min="0" max="1000000000" step="0.01"')) : ''}${can(actor, 'finance') ? field('Planned other expenses (PHP)', input('plannedExpense', 'number', service.plannedExpense, 'min="0" max="1000000000" step="0.01"')) : ''}</div>${productEditor(service.products)}<p class="field-hint">Appointments reserve one hour per technician. Product quantities reserve available stock until completion.</p>`, 'Save service');
  updateEstimate(dialog.querySelector('form'));
}
function visitDetail(id) {
  const v = state.visits.find(v => v.id === id); if (!v) return;
  const c = client(v.clientId), report = state.reports.find(r => r.visitId === id);
  const invoice = state.invoices.find(i => i.visitId === id);
  showDialog('Service visit', `<div class="dialog-body"><div class="detail-title"><span class="avatar large">${initials(c.name)}</span><div><h3>${e(c.name)}</h3><p>${e(c.branch)} / ${e(c.address)}</p></div>${badge(v.status)}</div><dl class="detail-grid"><div><dt>Date and time</dt><dd>${dateLabel(v.date)} / ${timeLabel(v.time)}</dd></div><div><dt>Technician</dt><dd>${e(v.technician)}</dd></div><div><dt>Service</dt><dd>${e(v.treatment)}</dd></div>${finance(`<div><dt>Quoted charge</dt><dd>${money(v.rate)}</dd></div><div><dt>Theoretical profit</dt><dd>${money(v.rate - productCost(v.estimatedProducts) - v.plannedExpense)}</dd></div><div><dt>Actual profit</dt><dd>${report?.financialsConfirmed ? money(report.actualRevenue - productCost(report.products) - report.expense) : 'Not recorded / confirmed'}</dd></div>`)}</dl>${v.status === 'Completed' && can(actor, 'finance') ? `<section class="service-payment-detail"><h3>Payment status</h3>${servicePayment(v)}${invoice ? `<p>Due ${dateLabel(invoice.due)} / ${money(invoice.paid)} collected of ${money(invoice.amount)}</p><a class="text-link" href="#billing?invoice=${e(invoice.id)}">View linked payment record</a>` : '<p>No payment status is assumed from another invoice for this client.</p>'}</section>` : ''}<h3>Estimated products</h3><div class="planned-products">${v.estimatedProducts.map(p => `<div><span>${e(p.name)}</span><strong>${p.quantity} ${e(p.unit)}</strong><small>${money(p.quantity*p.unitCost)}</small></div>`).join('') || '<p>No products planned.</p>'}</div><p class="field-hint">Planned other expenses: ${money(v.plannedExpense)}. ${e(v.estimateBasis || 'Estimate captured when scheduled.')}</p></div><div class="form-footer">${button('Close', 'close')}${invoice && invoice.paid < invoice.amount ? button('Record payment', 'payment', invoice.id) : v.status === 'Completed' && !invoice && report?.financialsConfirmed ? button('Review payment link', 'service-payment', id) : ''}${report ? button('View service report', 'report', report.id, 'button primary') : button('Record service report', 'complete', id, 'button primary')}</div>`);
}
function completeForm(id, reportId = '') {
  const v = state.visits.find(v => v.id === id), r = state.reports.find(r => r.id === reportId);
  const actual = r?.products || v.estimatedProducts;
  form(r ? 'Edit actual usage & service report' : 'Record service report', r ? 'report-revision' : 'complete', `<p class="field-hint">${e(client(v.clientId).name)} / ${e(v.treatment)} / ${e(v.technician)}</p>${r && !r.financialsConfirmed ? '<p class="review-notice">Historical charges and costs were not captured. Review every quantity, unit cost, charge and expense before confirming this report.</p>' : ''}<div class="field-pair">${field('Time-in', input('timeIn', 'time', r?.timeIn || v.time))}${field('Time-out', input('timeOut', 'time', r?.timeOut || ''))}</div>${field('Location / area covered', input('location', 'text', r?.location || '', 'maxlength="2000"'))}${field('Method / activity conducted', input('method', 'text', r?.method || v.treatment, 'maxlength="2000"'))}<div class="field-pair">${can(actor, 'finance') ? field('Actual service charge (PHP)', input('actualRevenue', 'number', r?.actualRevenue ?? v.rate, 'min="0" max="1000000000" step="0.01"')) : ''}${field('Actual other expenses (PHP)', input('expense', 'number', r?.expense ?? 0, 'min="0" max="1000000000" step="0.01"'))}</div>${productEditor(actual, true)}<div class="field-pair">${field('Observed pest type', select('pest', options(PESTS, r?.pest)))}${field('Observed pest count', input('pestCount', 'number', r?.pestCount ?? 0, 'min="0" max="100000" step="1"'))}</div>${field('Findings / recurring issues', `<textarea name="findings" rows="2" maxlength="2000" required>${e(r?.findings || '')}</textarea>`)}${field('Recommendation', `<textarea name="recommendation" rows="2" maxlength="2000" required>${e(r?.recommendation || '')}</textarea>`)}${field('Remarks (optional)', `<textarea name="remarks" rows="2" maxlength="2000">${e(r?.remarks || '')}</textarea>`)}<p class="field-hint">${r ? 'Saving adjusts stock by the usage change and updates any linked service balance. Charges cannot fall below amounts already collected.' : 'Completing the report deducts actual usage and creates a local payment record due 30 calendar days after the service date.'}</p>`, r ? 'Save report changes' : 'Complete & create report', reportId || id);
  updateEstimate(dialog.querySelector('form'));
}
function reportDetail(id) {
  const r = state.reports.find(r => r.id === id); if (!r) return;
  const c = client(r.clientId), v = state.visits.find(v => v.id === r.visitId);
  const prior = observations(r.clientId).filter(o => o.date < r.date && o.pest === r.pest).sort((a, b) => b.date.localeCompare(a.date))[0];
  const productIds = [...new Set([...v.estimatedProducts.map(p => p.productId), ...r.products.map(p => p.productId)])];
  showDialog('Service report preview', `<article class="report-sheet"><div class="report-mast"><img src="/assets/zealpro-logo.png" width="1052" height="384" alt="Zealpro Solutions Incorporated"><div><strong>Service report</strong><span>${e(r.id.startsWith('SR-2026') ? r.id : 'SR-'+r.id.slice(-8).toUpperCase())}</span><small>Demonstration copy</small></div></div><div class="report-account"><div><span>Account name</span><h3>${e(c.name)}</h3><p>${e(c.branch)} / ${e(c.address)}</p></div><div><span>Service date</span><strong>${dateLabel(r.date)}</strong><p>Time-in ${timeLabel(r.timeIn)} / Time-out ${timeLabel(r.timeOut)}</p></div></div><h4>${e(r.treatment)}</h4><dl class="detail-grid report-method"><div><dt>Area covered</dt><dd>${e(r.location)}</dd></div><div><dt>Method / observed count</dt><dd>${e(r.method)} / ${r.pestCount} ${e(r.pest)}</dd></div></dl><h4>Estimated vs. actual products</h4><div class="table-scroll"><table><thead><tr><th>Product</th><th class="numeric">Estimated</th><th class="numeric">Actual used</th>${finance(`<th class="numeric">Actual unit cost</th><th class="numeric">Actual cost</th>`)}</tr></thead><tbody>${productIds.map(productId => { const estimated = v.estimatedProducts.find(p => p.productId === productId), actual = r.products.find(p => p.productId === productId), p = actual || estimated; return `<tr><td>${e(p.name)}</td><td class="numeric">${estimated?.quantity || 0} ${e(p.unit)}</td><td class="numeric">${actual?.quantity || 0} ${e(p.unit)}</td>${finance(`<td class="numeric">${actual ? money(actual.unitCost) : '—'}</td><td class="numeric">${money(actual ? actual.quantity * actual.unitCost : 0)}</td>`)}</tr>`; }).join('') || '<tr><td colspan="5">No products planned or used.</td></tr>'}</tbody></table></div><div class="report-sections"><section><h4>Findings</h4><p>${e(r.findings)}</p></section><section><h4>Recommendation</h4><p>${e(r.recommendation)}</p></section><section><h4>Tracked changes</h4><p>${prior ? `${prior.count} sightings on ${dateLabel(prior.date)}; ${r.pestCount} observed this visit. Sample observations only; counts do not establish causality.` : 'First recorded observation for this branch. No earlier comparison available.'}</p></section>${finance(`<section><h4>Recorded service financials</h4><p>Quoted charge: ${money(v.rate)}<br>Actual charge: ${money(r.actualRevenue)}<br>Actual product cost: ${money(productCost(r.products))}<br>Other expenses: ${money(r.expense)}<br>Actual profit: ${r.financialsConfirmed ? money(r.actualRevenue - productCost(r.products) - r.expense) : 'Awaiting financial confirmation'}<br><small>Before unrecorded overhead and tax.</small></p></section>`)}<section><h4>Service & payment status</h4>${badge(v.status)}${servicePayment(v)}</section><section><h4>Remarks</h4><p>${e(r.remarks || 'No additional remarks.')}</p></section></div><div class="report-signatures"><div><span>Serviced by</span><strong>${e(r.technician)}</strong><small>Digital signature not collected</small></div><div><span>Customer acknowledgment</span><strong>Not signed</strong><small>Presentation copy only</small></div></div></article><div class="form-footer no-print">${button('Close', 'close')}${button(r.financialsConfirmed ? 'Edit actual usage' : 'Review actual values', 'edit-report', r.id, 'button')}${button(icon('print')+' Print report', 'print', '', 'button primary')}</div>`, true);
}
function clientDetail(id) {
  const c = client(id); if (!c) return;
  showDialog('Client profile', `<div class="dialog-body client-profile"><div class="detail-title"><span class="avatar large">${initials(c.name)}</span><div><h3>${e(c.name)}</h3><p>${e(c.branch)} / ${e(c.address)}</p></div></div><dl class="detail-grid"><div><dt>Service package</dt><dd>${e(c.package)}</dd></div><div><dt>Agreement duration</dt><dd>${e(c.duration)} from ${dateLabel(c.since)}</dd></div>${finance(`<div><dt>Agreed rate</dt><dd>${money(c.rate)} per service</dd></div>`)}<div><dt>Contact person</dt><dd>${e(c.contactPerson || 'Not provided')}</dd></div><div><dt>Contact role / position</dt><dd>${e(c.contact || 'Not provided')}</dd></div><div><dt>Phone / mobile</dt><dd>${e(c.phone || 'Not provided')}</dd></div><div><dt>Email</dt><dd>${e(c.email || 'Not provided')}</dd></div></dl><h3 class="history-title">Branch service history</h3>${screen.visits.filter(v => v.clientId === id).map(v => `<button class="history-row" data-action="visit" data-id="${e(v.id)}"><span><strong>${e(v.treatment)}</strong><small>${dateLabel(v.date)} / ${e(v.technician)}</small></span><span>${badge(v.status)}${servicePayment(v, false)}</span>${icon('chevron')}</button>`).join('') || '<p>No services recorded for this branch.</p>'}</div><div class="form-footer">${button('Close', 'close')}${button('Edit details', 'edit-client', id)}${button('Schedule service', 'client-schedule', id, 'button primary')}</div>`);
}
function showGuide() {
  showDialog('Welcome to the Zealpro demo', `<div class="dialog-body guide-content"><h3>From site assessment to collection.</h3><p>Explore a working UI based on your SRS and service paperwork. The sample day is 2 November 2026. All records and figures are illustrative.</p><ol><li>Open <strong>Schedule</strong> to plan a visit and assign a technician.</li><li>Open a visit, then <strong>Record treatment</strong>. Actual material usage deducts stock and creates a service report.</li><li>Review branch history in <strong>Clients & branches</strong> and changes in <strong>Pest analytics</strong>.</li><li>Open <strong>Billing & collection</strong> to record a sample payment or preview a reminder.</li></ol><p>Changes stay in this browser. No authentication, live messaging, production database or customer signatures are connected.</p></div><div class="form-footer">${button('Reset sample data', 'reset-confirm', '', 'button danger-button')}${button('Explore workspace', 'close', '', 'button primary')}</div>`);
}

document.addEventListener('click', event => {
  if (event.target.closest('.skip-link')) { event.preventDefault(); document.querySelector('#main').focus(); return; }
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const { action, id } = target.dataset;
  try { assertDemoAction(actor, action, state, id); } catch (error) { notify(error.message); return; }
  if (action === 'close') dialog.close();
  else if (action === 'logout') { if (dialog.open) dialog.close(); dialog.innerHTML = ''; actor = null; render(); }
  else if (action === 'ocular-detail') assessmentDetail(id);
  else if (action === 'add-finding') { const lines = dialog.querySelector('.finding-lines'); if (lines.children.length >= 20) { notify('Enter up to 20 findings per assessment.'); return; } lines.insertAdjacentHTML('beforeend', assessmentLine()); }
  else if (action === 'remove-finding') { if (dialog.querySelectorAll('.finding-line').length <= 1) { notify('Keep at least one finding.'); return; } target.closest('.finding-line').remove(); }
  else if (action === 'cumulative-preview') {
    try {
      const report = buildCumulativeReport(screen, cumulativeFilters(route().params));
      showDialog('Cumulative report preview', cumulativeDocument(report) + `<div class="form-footer no-print">${button('Close', 'close')}${button('Print / save PDF', 'print', '', 'button primary')}</div>`, true);
    } catch (error) { notify(error.message); }
  }
  else if (action === 'service-form') serviceForm(id);
  else if (action === 'product-form') productForm(id);
  else if (action === 'edit-report') { const report = state.reports.find(r => r.id === id); completeForm(report.visitId, id); }
  else if (action === 'choose-report') { const pending = screen.visits.filter(v => v.status !== 'Completed'); showDialog('Choose a service to report', `<div class="dialog-body">${pending.length ? pending.map(v => `<button type="button" class="history-row" data-action="complete" data-id="${e(v.id)}"><span><strong>${e(client(v.clientId).name)} / ${e(v.treatment)}</strong><small>${dateLabel(v.date)} / ${timeLabel(v.time)} / ${e(v.technician)}</small></span>${icon('chevron')}</button>`).join('') : '<p>Every scheduled service has a report. Schedule a new visit to continue.</p>'}</div>`); }
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
  else if (action === 'payment-history') { const i = state.invoices.find(i => i.id === id); showDialog('Payment history', `<div class="dialog-body"><h3>${e(i.id)}</h3><p>Total collected: ${money(i.paid)} of ${money(i.amount)}</p>${i.payments.length ? i.payments.map(p => `<div class="history-row"><span><strong>${money(p.amount)} / ${e(p.method)}</strong><small>${e(p.reference)}</small></span></div>`).join('') : '<p class="muted">This sample opening balance was already settled. No detailed proof is included.</p>'}</div><div class="form-footer">${button('Close', 'close')}</div>`); }
  else if (action === 'reset-confirm') showDialog('Reset this demonstration?', `<div class="dialog-body"><p>This replaces only this app’s saved sample records in this browser. Your original paperwork and logo are not affected.</p></div><div class="form-footer">${button('Keep changes', 'close')}${button('Reset sample records', 'reset', '', 'button danger-button')}</div>`);
  else if (action === 'reset') { state = createDemo(); dialog.close(); persist('Sample records restored.'); }
});
document.addEventListener('change', event => {
  if (event.target.matches('form[data-form="cumulative-filter"] [name="account"]')) { const choices = screen.clients.filter(c => event.target.value === 'all' || accountKey(c.name) === event.target.value); event.target.form.elements.branch.innerHTML = '<option value="all">All branches</option>' + options(choices.map(c => ({ id: c.id, name: `${c.name} / ${c.branch}` }))); }
  if (event.target.matches('form[data-form="assessment"] [name="clientId"]')) { const fields = document.querySelector('#prospect-fields'); fields.hidden = event.target.value !== 'prospect'; fields.querySelectorAll('input').forEach(input => { input.required = event.target.value === 'prospect'; }); }
  if (event.target.matches('[data-param]')) changeParam(event.target.dataset.param, event.target.value);
  if (event.target.matches('form[data-form="visit"] [name="serviceId"]')) { const form = event.target.form, service = state.services.find(s => s.id === event.target.value); if (form.elements.rate) form.elements.rate.value = service.price; if (form.elements.plannedExpense) form.elements.plannedExpense.value = service.plannedExpense; form.querySelector('#service-description').textContent = service.description; form.querySelector('.product-editor').outerHTML = productEditor(service.products); }
  if (event.target.matches('.product-line [name="productId"]')) { const row = event.target.closest('.product-line'), cost = row.querySelector('[name="unitCost"]'); if (cost) cost.value = material(event.target.value).cost; }
  updateEstimate(event.target.closest('form'));
});
document.addEventListener('input', event => updateEstimate(event.target.closest('form')));
document.addEventListener('submit', event => {
  const formElement = event.target.closest('form[data-form]'); if (!formElement) return;
  event.preventDefault();
  const values = Object.fromEntries(new FormData(formElement));
  const kind = formElement.dataset.form, id = formElement.dataset.id;
  if (kind === 'demo-login') {
    const signedIn = authenticateDemo(values.email, values.password);
    if (!signedIn) { const error = formElement.querySelector('.form-error'); error.textContent = 'Use one of the public sample email/password pairs below.'; error.hidden = false; return; }
    actor = signedIn; render(); return;
  }
  try { assertDemoAction(actor, ({ visit: 'visit-create', client: 'client-create' })[kind] || kind, state, id); }
  catch (error) { notify(error.message); return; }
  if (kind === 'cumulative-filter') { go('reports', { tab: 'cumulative', ...values }); return; }

  if (kind === 'global-search') { go('clients', { q: values.q }); return; }
  if (kind === 'filter') { changeParam('q', values.q); return; }
  const numeric = keys => keys.forEach(key => { values[key] = Number(values[key]); });
  try {
    let message = '';
    if (kind === 'service') { numeric(['price', 'plannedExpense']); saveService(state, { ...values, products: readProducts(formElement) }, id); message = 'Service definition saved. Existing visit estimates preserved.'; }
    if (kind === 'product') { numeric(['cost', 'minimum']); if (!id) numeric(['stock']); saveProduct(state, values, id); message = 'Product definition saved. Recorded costs preserved.'; }
    if (kind === 'visit') { numeric(['rate', 'plannedExpense']); values.products = readProducts(formElement); Object.assign(values, protectedValues(actor, kind, state, id, values)); scheduleVisit(state, values); message = 'Service scheduled. Materials allocated.'; }
    if (kind === 'complete' || kind === 'report-revision') { numeric(['expense', 'pestCount', 'actualRevenue']); values.products = readProducts(formElement); Object.assign(values, protectedValues(actor, kind, state, id, values)); const report = kind === 'report-revision' ? reviseReport(state, id, values) : completeVisit(state, id, values); persist(kind === 'report-revision' ? 'Actual usage updated. Stock and profit adjusted.' : 'Service completed. Payment is due 30 days after the service date.'); reportDetail(report.id); return; }
    if (kind === 'client-edit') { numeric(['rate']); enrollClient(state, values, id); dialog.close(); persist('Client branch and contact details updated.'); clientDetail(id); return; }
    if (kind === 'client') { numeric(['rate']); enrollClient(state, { ...values, assessmentId: id }); message = 'Client branch enrolled.'; }
    if (kind === 'assessment') { if (values.clientId === 'prospect') values.clientId = ''; values.findings = [...formElement.querySelectorAll('.finding-line')].map(row => ({ location: row.querySelector('[name="findingLocation"]').value, problem: row.querySelector('[name="findingProblem"]').value, serviceId: row.querySelector('[name="findingService"]').value, materialIds: [...row.querySelectorAll('[name="findingMaterialId"]:checked')].map(field => field.value), notes: row.querySelector('[name="findingNotes"]').value })); Object.assign(values, protectedValues(actor, kind, state, id, values)); addAssessment(state, values); message = 'Ocular assessment saved.'; }
    if (kind === 'restock') { restock(state, id, Number(values.quantity)); message = 'Material stock updated.'; }
    if (kind === 'payment') { recordPayment(state, id, Number(values.amount), values.method, values.reference); message = 'Sample payment recorded. Invoice balance updated.'; }
    if (kind === 'service-payment') { if (!values.reviewed) throw new Error('Confirm that existing billing has been reviewed.'); linkServicePayment(state, id, values.invoiceId === 'new' ? '' : values.invoiceId); message = 'Service payment linked. Completion status preserved.'; }
    dialog.close(); persist(message);
  } catch (error) { const alert = formElement.querySelector('.form-error'); alert.textContent = error.message; alert.hidden = false; alert.scrollIntoView({ block: 'nearest' }); }
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
