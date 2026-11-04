import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { webcrypto } from 'node:crypto';

// Exercise the real native-module templates without a browser or DOM automation.
const mount = { innerHTML: '' }, dialog = {
  innerHTML: '', open: false, className: '',
  showModal() { this.open = true; }, close() { this.open = false; },
  querySelector(selector) {
    if (selector === 'button') return { focus() {} };
    if (selector === '.form-footer') return { insertAdjacentHTML: (_position, text) => { this.innerHTML += text; } };
    return null;
  },
};
const handlers = {}, values = new Map();
const toast = { textContent: '', classList: { add() {}, remove() {} } };
class TestFormData {
  constructor(form) { this.values = form.values; }
  [Symbol.iterator]() { return this.values[Symbol.iterator](); }
  getAll(key) { return this.values.filter(([name]) => name === key).map(([, value]) => value); }
}
const context = vm.createContext({
  console, structuredClone, URL, URLSearchParams, Date, Intl, crypto: webcrypto, FormData: TestFormData,
  setTimeout: () => 0, clearTimeout() {},
  localStorage: { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value) },
  location: { hash: '#overview' },
  document: { title: '', body: { dataset: {} },
    querySelector: selector => selector === '#app' ? mount : selector === '#dialog' ? dialog : selector === '#toast' ? toast : null,
    addEventListener: (name, handler) => { handlers[name] = handler; },
  },
  window: { addEventListener() {}, scrollTo() {} },
});
const modules = new Map();
function moduleAt(path) {
  path = resolve(path);
  if (modules.has(path)) return modules.get(path);
  let source = readFileSync(path, 'utf8');
  if (path.replaceAll('\\', '/').endsWith('src/app.js')) source += `
export const templateTest = {
  signIn(email,password){actor=authenticateDemo(email,password,state);if(!actor)throw Error('Login failed');render();return app.innerHTML;},
  screen(name,params=''){location.hash='#'+name+(params?'?'+params:'');render();return app.innerHTML;},
  report(id){reportDetail(id);return dialog.innerHTML;},
  complete(id){completeForm(id);return dialog.innerHTML;},
  visit(id){visitDetail(id);return dialog.innerHTML;},
  cumulative(){const report=buildCumulativeReport({...screen,reports:screen.reports.filter(approved)}, {start:'2026-01-01',end:'2026-12-31'});return cumulativeDocument(report);},
  state(){return state;},
};`;
  const module = new vm.SourceTextModule(source, { context, identifier: path });
  modules.set(path, module);
  return module;
}
const app = moduleAt('src/app.js');
await app.link((specifier, source) => moduleAt(resolve(dirname(source.identifier), specifier)));
await app.evaluate();
const ui = app.namespace.templateTest;
assert(mount.innerHTML.includes('/assets/zealpro-field-visit.jpg'));
assert(mount.innerHTML.includes('/assets/zealpro-hygiene-inspection.jpg') && mount.innerHTML.includes('/assets/zealpro-site-work.jpg'));
assert(mount.innerHTML.includes('data-demo-account') && mount.innerHTML.includes('data-form="demo-login"'));
const demoFields = { email: { value: '' }, password: { value: '' } }, loginError = { hidden: false };
handlers.change({ target: { value: 'admin', matches: selector => selector === '[data-demo-account]', form: { elements: demoFields, querySelector: () => loginError } } });
assert.equal(demoFields.email.value, 'admin@zealpro.demo');
assert.equal(demoFields.password.value, 'AdminDemo!2026');
assert(loginError.hidden);
assert(mount.innerHTML.includes('data-form="demo-login"'), 'Picking a sample must not bypass sign-in');
const logins = [
  ['owner', 'owner@zealpro.demo', 'OwnerDemo!2026'],
  ['admin', 'admin@zealpro.demo', 'AdminDemo!2026'],
  ['supervisor1', 'supervisor@zealpro.demo', 'SupervisorDemo!2026'],
  ['supervisor2', 'supervisor2@zealpro.demo', 'SupervisorDemo!2026'],
  ['technician', 'technician@zealpro.demo', 'TechnicianDemo!2026'],
];
for (const [id, email, password] of logins) {
  ui.signIn(email, password);
  for (const view of ['overview', 'schedule', 'services', 'clients', 'ocular', 'reports', 'inventory', 'billing', 'analytics', 'settings', 'activity']) {
    const html = ui.screen(view);
    assert(!html.includes('undefined'), `${id}/${view}: undefined field`);
    if (id.startsWith('supervisor') || id === 'technician') {
      assert(!html.includes('href="#billing"'), `${id}/${view}: billing link`);
      assert(!html.includes('default service charge') && !html.includes('Agreed rate'), `${id}/${view}: commercial details`);
    }
    if (id === 'admin') assert(!html.includes('class="profit-band"') && !html.includes('Estimated contribution'), `${view}: Admin margin`);
  }
  ui.screen('reports');
  const ownReport = id === 'supervisor2' ? 'SR-2026-01368' : 'SR-2026-01366';
  const report = ui.report(ownReport);
  assert(!report.includes('Edit actual usage'), `${id}: approved edit escape`);
  if (id === 'technician') assert(!report.includes('Captured unit cost') && !report.includes('Commercial record'), 'Technician report contains financial fields');
  if (id.startsWith('supervisor')) assert(report.includes('Captured unit cost') && !report.includes('Commercial record') && !report.includes('Contribution after direct job costs'), 'Supervisor report boundaries');
  if (id === 'admin') assert(report.includes('Commercial record') && !report.includes('Contribution after direct job costs'), 'Admin report boundaries');
}
ui.signIn('technician@zealpro.demo', 'TechnicianDemo!2026');
ui.screen('overview');
const draft = ui.complete('v4');
assert(draft.includes('Save draft') && draft.includes('Submit for review'));
assert(!draft.includes('name="actualRevenue"') && !draft.includes('name="unitCost"'));
const state = ui.state();
state.presentation.jobs.v2.personnel.push('Marco Reyes');
ui.screen('reports');
assert(!ui.report('SR-2026-01367').includes('Job expense claim'), 'A co-assigned colleague expense was shown as a personal claim');
state.reports[0].financialsConfirmed = false;
delete state.invoices.find(i => i.visitId === 'v1').visitId;
ui.signIn('owner@zealpro.demo', 'OwnerDemo!2026');
assert(ui.report('SR-2026-01366').includes('Awaiting financial confirmation'), 'Unconfirmed historical contribution was presented as final');
assert(ui.report('SR-2026-01366').includes('Review historical financials'));
ui.signIn('technician@zealpro.demo', 'TechnicianDemo!2026');
const actor = modules.get(resolve('src/access.js')).namespace.authenticateDemo('technician@zealpro.demo', 'TechnicianDemo!2026', state);
const workflow = modules.get(resolve('src/presentation.js')).namespace;
workflow.submitReport(state, actor, 'v4', { timeIn:'11:00',timeOut:'12:00',location:'QA area',method:'Surface spraying',expense:25,products:[{productId:'m1',quantity:200}],pest:'Cockroaches',pestCount:3,findings:'QA observations',recommendation:'Monitor entry points',remarks:'' });
assert(!state.invoices.some(i => i.visitId === 'v4'));
assert(ui.screen('overview').includes('Submitted'));
assert(!ui.visit('v4').includes('badge success">Completed'));
ui.signIn('supervisor@zealpro.demo', 'SupervisorDemo!2026');
const pending = state.reports.find(r => r.visitId === 'v4');
assert(ui.report(pending.id).includes('Review submission'));
assert(!ui.cumulative().includes('QA observations'), 'Unapproved report appeared in finalized cumulative output');

const owner = modules.get(resolve('src/access.js')).namespace.authenticateDemo('owner@zealpro.demo', 'OwnerDemo!2026', state);
workflow.reviewReport(state, owner, pending.id, 'Approved');
workflow.beginAmendment(state, owner, pending.id, 'Review service charge');
let current = state.reports.find(r => r.id === pending.id);
workflow.submitReport(state, owner, current.visitId, { ...current, actualRevenue: current.actualRevenue + 1000 });
workflow.reviewReport(state, owner, current.id, 'Returned', 'Clarify field notes');
const staged = state.presentation.reports[current.id].pendingRevenue;
current = state.reports.find(r => r.id === current.id);
ui.signIn('owner@zealpro.demo', 'OwnerDemo!2026');
const error = { textContent: '', hidden: true, scrollIntoView() {} };
const fields = ['timeIn','timeOut','location','method','expense','pest','pestCount','findings','recommendation','remarks'];
const form = {
  dataset: { form: 'report-submit', id: current.visitId },
  values: fields.map(key => [key, String(current[key] ?? '')]),
  closest() { return this; },
  querySelector(selector) { return selector === '.form-error' ? error : null; },
  querySelectorAll(selector) { return selector === '.product-line' ? current.products.map(product => ({ querySelector(selector) { return selector.includes('unitCost') ? null : { value: String(selector.includes('productId') ? product.productId : product.quantity) }; } })) : []; },
};
await handlers.submit({ target: form, preventDefault() {}, submitter: {} });
assert(error.hidden, error.textContent);
assert.equal(state.presentation.reports[current.id].pendingRevenue, staged, 'UI correction overwrote staged amendment revenue');
console.log('Five profiles, eleven route templates, report dialogs and submission projection passed.');
