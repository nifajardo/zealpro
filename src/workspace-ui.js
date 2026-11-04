import { can, workspaceUsers, scopeWorkspace } from './access.js';
import { STAFF } from './data.js';
import { ensurePresentation, updateUser, inviteUser, configureTeamProfile, requestRateChange, reviewRateChange, requestStock, recordPaymentDraft, verifyPayment, voidPayment, configureReminder, runReminder } from './presentation.js';

const roles = [{ id: 'owner', name: 'Owner' }, { id: 'admin', name: 'Administrator' }, { id: 'supervisor', name: 'Supervisor' }, { id: 'technician', name: 'Technician' }];
const roleName = value => roles.find(role => role.id === value)?.name || value;
function scopedUsers(ctx) {
  return workspaceUsers(ctx.state).filter(user => ['owner', 'admin'].includes(ctx.actor.role) || user.id === ctx.actor.id || ctx.actor.role === 'supervisor' && user.teamId === ctx.actor.teamId);
}
function metadata(ctx) {
  const screen = scopeWorkspace(ctx.state, ctx.actor), data = screen.presentation || {};
  if (ctx.actor.role === 'owner') return data;
  if (ctx.actor.role === 'admin') {
    const officeAction = /^(Recorded pending payment|Verified payment|Voided verified payment|Configured simulated reminder|Ran simulated reminder|Prepared demo invitation; no email sent|Requested rate change|Reviewed rate request|Scheduled visit|Rescheduled visit|Cancelled visit; released reservations|Restocked inventory|Client marked (Active|Archived))$/;
    const securityAction = /role|permission|security|team assignment|delegat|deactivat|activat.*account/i;
    return { ...data, audit: (data.audit || []).filter(row => !securityAction.test(row.action) && (officeAction.test(row.action) || row.actorId === ctx.actor.id || row.action === 'Updated user profile' && row.role === 'admin')) };
  }
  const visitIds = new Set(screen.visits.map(row => row.id)), recordIds = new Set([...screen.visits, ...screen.reports, ...screen.assessments].map(row => row.id));
  const actorIds = new Set(scopedUsers(ctx).map(user => user.id));
  const stockRequests = (data.stockRequests || []).filter(row => actorIds.has(row.actorId));
  for (const row of stockRequests) recordIds.add(row.id);
  const operational = /^(Saved report draft|Submitted corrected report|Submitted report|Approved & finalized report|Returned report for correction|Authorized report amendment|Rescheduled visit|Scheduled visit|Cancelled visit; released reservations|Saved assessment draft|Submitted assessment|Approved assessment|Returned assessment|Requested stock adjustment|Restocked inventory)$/;
  return { ...data, teams: (data.teams || []).filter(team => team.id === ctx.actor.teamId).map(team => ctx.actor.role === 'technician' ? { ...team, memberNames: [ctx.actor.name], branchIds: screen.clients.map(client => client.id) } : team), movements: (data.movements || []).filter(row => row.visitId ? visitIds.has(row.visitId) : actorIds.has(row.actorId)), stockRequests, payments: [], reminders: [], rateRequests: [], audit: (data.audit || []).filter(row => operational.test(row.action) && (recordIds.has(row.entityId) || actorIds.has(row.actorId))) };
}
const stamp = (ctx, value) => value ? ctx.e(String(value).replace('T', ' ').slice(0, 16)) : '-';
const table = (ctx, columns, rows, empty) => `<div class="table-scroll"><table><thead><tr>${columns.map(label => `<th>${ctx.e(label)}</th>`).join('')}</tr></thead><tbody>${rows.length ? rows.join('') : `<tr><td colspan="${columns.length}">${ctx.e(empty)}</td></tr>`}</tbody></table></div>`;
const badge = (ctx, value) => `<span class="badge">${ctx.e(value)}</span>`;
const note = value => `<p class="field-hint">${value}</p>`;
const textarea = (ctx, name, value = '', required = true) => `<textarea name="${name}" rows="3" maxlength="2000"${required ? ' required' : ''}>${ctx.e(value)}</textarea>`;
const requireCapability = (ctx, capability) => { if (!can(ctx.actor, capability)) throw new Error('This action is not available for your role.'); };
const find = (rows, id, label) => { const row = (rows || []).find(value => value.id === id); if (!row) throw new Error(`${label} was not found in your workspace.`); return row; };
const branchName = (ctx, id) => { const row = ctx.state.clients.find(client => client.id === id); return row ? `${row.name} / ${row.branch}` : id; };

export function settingsView(ctx, params = new URLSearchParams()) {
  const { e, button, heading, panelHead } = ctx, data = metadata(ctx), users = scopedUsers(ctx);
  const teams = data.teams || [], tab = params.get('tab') || 'staff';
  const tabs = `<div class="tabs"><a href="#settings?tab=staff" ${tab === 'staff' ? 'aria-current="page"' : ''}>Staff directory</a>${can(ctx.actor, 'commercial') ? `<a href="#settings?tab=rates" ${tab === 'rates' ? 'aria-current="page"' : ''}>Pricing requests</a>` : ''}<a href="#activity">Activity history</a></div>`;
  if (tab === 'rates' && can(ctx.actor, 'commercial')) {
    return `${heading('Pricing requests', 'Owner reviews changes before service rates are updated.', ctx.actor.role === 'admin' ? button('Suggest a rate change', 'rate-request', '', 'button primary') : '')}${tabs}<section class="panel">${panelHead('Rate change queue', 'Existing scheduled charges remain as agreed.')}${table(ctx, ['Service', 'Requested rate', 'Reason', 'Status', 'Action'], (data.rateRequests || []).map(row => `<tr><td>${e(ctx.state.services.find(service => service.id === row.serviceId)?.name || row.serviceId)}</td><td>${ctx.money(row.requestedRate)}</td><td class="wrap-cell">${e(row.reason)}</td><td>${badge(ctx, row.status)}</td><td>${ctx.actor.role === 'owner' && row.status === 'Submitted' ? button('Review request', 'rate-review', row.id, 'button small-button') : e(row.history?.at(-1)?.reason || '-')}</td></tr>`), 'No rate change requests yet.')}</section>`;
  }
  return `${heading('Staff & settings', 'Access and assignments for the Zealpro demonstration.', can(ctx.actor, 'invite') ? button('Prepare invitation', 'staff-invite', '', 'button primary') : '')}${tabs}<section class="panel">${panelHead('Staff directory', ctx.actor.role === 'owner' ? 'Owner manages access. Assignment names preserve existing service records.' : ctx.actor.role === 'admin' ? 'Maintain contact profiles. Permissions remain with the Owner.' : 'Directory limited to your assigned workspace.')}${table(ctx, ['Staff member', 'Role', 'Team', 'Access', 'Action'], users.map(user => `<tr><td><strong>${e(user.displayName || user.name)}</strong><small>${e(user.email || '')}</small></td><td>${e(roleName(user.role))}</td><td>${e(teams.find(team => team.id === user.teamId)?.name || 'Office / company-wide')}</td><td>${badge(ctx, user.invitationStatus ? 'Invitation prepared' : user.active === false ? 'Disabled' : 'Active')}${user.canCollect && ctx.actor.role === 'owner' ? '<small>Collections delegated</small>' : ''}</td><td>${['owner', 'admin'].includes(ctx.actor.role) ? button('Edit profile', 'staff-edit', user.id, 'button small-button') : ''}${user.id === ctx.actor.id || ['owner', 'admin'].includes(ctx.actor.role) ? button('Reset preview', 'password-reset-preview', user.id, 'text-button') : ''}</td></tr>`), 'No staff profiles in this scope.')}</section><section class="panel">${panelHead('Team & branch assignments', 'Assignments determine which operational records field users can see.')}${table(ctx, ['Team', 'Personnel', 'Client branches', 'Action'], teams.map(team => `<tr><td><strong>${e(team.name)}</strong></td><td class="wrap-cell">${e((team.memberNames || []).join(', '))}</td><td class="wrap-cell">${e((team.branchIds || team.clientIds || []).map(id => branchName(ctx, id)).join('; ') || 'No branches assigned')}</td><td>${ctx.actor.role === 'owner' ? button('Edit team mapping', 'team-edit', team.id, 'button small-button') : ''}</td></tr>`), 'No team mapping in this scope.')}</section>${note('Invitations and password resets are previews. No email is sent and no production account is created.')}`;
}

export function activityView(ctx) {
  const data = metadata(ctx), { e, heading, panelHead } = ctx;
  return `${heading('Activity history', 'Role-scoped actions in this browser workspace.')}<section class="panel">${panelHead('Recent actions', 'Browser-local presentation history; production audit storage is deferred.')}${table(ctx, ['When', 'Staff member', 'Action', 'Reference', 'Reason'], [...(data.audit || [])].reverse().map(row => `<tr><td>${stamp(ctx, row.at)}</td><td>${e(row.actorName || row.actorId || 'Legacy record')}</td><td>${e(row.action)}</td><td>${e(row.entityId || '-')}</td><td class="wrap-cell">${e(row.reason || '-')}</td></tr>`), 'No activity recorded for your assigned workspace.')}</section>`;
}

export function inventoryExtras(ctx) {
  const data = metadata(ctx), { e, button, panelHead } = ctx;
  return `<section class="panel">${panelHead('Stock movement ledger', 'Actual consumption posts at submission; corrections post only the difference.', can(ctx.actor, 'requestStock') ? button('Request stock adjustment', 'request-stock', '', 'button small-button') : '')}${table(ctx, ['When', 'Material', 'Movement', 'Quantity', 'Service'], [...(data.movements || [])].reverse().map(row => { const material = ctx.screen.materials.find(value => value.id === row.productId); return `<tr><td>${stamp(ctx, row.at)}</td><td>${e(material?.name || row.productId)}</td><td>${e(row.type)}</td><td>${row.quantity > 0 ? '+' : ''}${e(row.quantity)} ${e(material?.unit || '')}</td><td>${row.visitId ? button(e(row.visitId), 'visit', row.visitId, 'text-button') : '-'}</td></tr>`; }), 'No posted stock movements in this scope.')}</section>${ctx.actor.role !== 'technician' ? `<section class="panel">${panelHead('Adjustment requests', 'Requests remain pending until office stock is checked and restocked.')}${table(ctx, ['When', 'Material', 'Quantity', 'Reason', 'Status'], [...(data.stockRequests || [])].reverse().map(row => `<tr><td>${stamp(ctx, row.at)}</td><td>${e(ctx.screen.materials.find(value => value.id === row.productId)?.name || row.productId)}</td><td>${e(row.quantity)}</td><td class="wrap-cell">${e(row.reason)}</td><td>${badge(ctx, row.status)}</td></tr>`), 'No adjustment requests in this scope.')}</section>` : ''}`;
}

export function billingExtras(ctx) {
  if (!can(ctx.actor, 'commercial')) return '';
  const data = metadata(ctx), { e, button, panelHead } = ctx;
  const invoiceName = id => { const invoice = ctx.screen.invoices.find(row => row.id === id); return invoice ? `${ctx.client(invoice.clientId).name} / ${id}` : id; };
  return `<section class="panel">${panelHead('Payment verification & history', 'Pending evidence does not reduce the balance. Verify only after reconciliation.')}${table(ctx, ['Client / invoice', 'Amount / method', 'Evidence', 'Status', 'Action'], [...(data.payments || [])].reverse().map(row => `<tr><td>${e(invoiceName(row.invoiceId))}<small>${stamp(ctx, row.createdAt)}</small></td><td>${ctx.money(row.amount)}<small>${e(row.method)} / ${e(row.reference || 'No reference')}</small></td><td>${row.proof ? button(e(row.proof.name), 'payment-proof', row.id, 'text-button') : 'No proof supplied'}</td><td>${badge(ctx, row.status)}${row.voidReason ? `<small>${e(row.voidReason)}</small>` : ''}</td><td>${row.status === 'Pending' && can(ctx.actor, 'collect') ? button('Verify payment', 'payment-verify', row.id, 'button small-button') : ''}${row.status === 'Verified' && ctx.actor.role === 'owner' ? button('Void with reason', 'payment-void', row.id, 'text-button') : ''}</td></tr>`), 'No new payment submissions. Existing legacy collections remain in invoice history.')}</section><section class="panel">${panelHead('Reminder schedules', 'Email simulation only. Running a reminder never contacts the client.')}${table(ctx, ['Client / invoice', 'Scheduled for', 'Last simulation', 'Action'], (data.reminders || []).map(row => { const last = row.logs?.at(-1); return `<tr><td>${e(invoiceName(row.invoiceId))}<small>${e(row.channel || 'Email simulation')}</small></td><td>${e(row.date)} / ${e(row.time)}<small>${row.enabled ? 'Enabled for simulation' : 'Paused'}</small></td><td>${last ? `${e(last.outcome)}<small>${stamp(ctx, last.at)} / ${e(last.reason || 'Simulated delivery')}</small>` : 'Not run'}</td><td>${button('Edit schedule', 'reminder-schedule', row.invoiceId, 'button small-button')}${row.enabled ? button(last?.outcome === 'failed' ? 'Simulate retry' : 'Run simulation', last?.outcome === 'failed' ? 'reminder-retry' : 'reminder-run', row.id, 'button small-button') : ''}${button('Delivery log', 'reminder-log', row.id, 'text-button')}</td></tr>`; }), 'No reminder schedules. Use Schedule reminder on an outstanding invoice.')}</section>`;
}

function userFields(ctx, user, invite = false) {
  const { e, field, input, select, options } = ctx, owner = ctx.actor.role === 'owner';
  const access = owner ? `${field('Role', select('role', options(roles, user.role || 'technician')))}${invite ? '' : `${field('Sign-in status', select('active', options([{ id: 'true', name: 'Active' }, { id: 'false', name: 'Disabled' }], user.active === false ? 'false' : 'true')))}${field('Team', `<select name="teamId"><option value="">Office / no team</option>${options((ctx.state.presentation?.teams || []).map(team => ({ id: team.id, name: team.name })), user.teamId)}</select>`)}${field('Collection verification', select('canCollect', options([{ id: 'false', name: 'Not delegated' }, { id: 'true', name: 'Delegated to Administrator' }], user.canCollect ? 'true' : 'false')))}`}` : invite ? note('Administrator invitations prepare Technician access only. The Owner assigns team and permissions.') : '';
  return `${invite ? '' : `<p>Assignment identity: <strong>${e(user.assignmentName || user.name)}</strong>. Existing service records keep this name.</p>`}${field('Display name', input('displayName', 'text', user.displayName || user.name || '', 'maxlength="100"'))}${field('Email', input('email', 'email', user.email || '', 'maxlength="200"'))}${invite ? '' : field('Phone (optional)', input('phone', 'tel', user.phone || '', 'maxlength="60"', false))}${access}`;
}

function previewProof(ctx, proof) {
  if (!proof) return '<p>No proof supplied.</p>';
  const safeImage = /^image\/(png|jpeg|webp|gif)$/.test(proof.type) && new RegExp(`^data:${proof.type};base64,[A-Za-z0-9+/=]+$`).test(proof.dataUrl || '');
  const safePDF = proof.type === 'application/pdf' && /^data:application\/pdf;base64,[A-Za-z0-9+/=]+$/.test(proof.dataUrl || '');
  return `<p><strong>${ctx.e(proof.name)}</strong><br>${ctx.e(proof.type)} / ${ctx.e(proof.size)} bytes</p>${safeImage ? `<img src="${proof.dataUrl}" alt="Supplied payment proof" style="max-width:100%;max-height:55vh;object-fit:contain">` : safePDF ? `<a class="button" href="${proof.dataUrl}" download="${ctx.e(proof.name)}">Download local PDF proof</a>` : '<p>Metadata preview only.</p>'}${note('Optional demonstration evidence stored only in this browser. No private cloud storage is configured.')}`;
}

export function openWorkspaceAction(ctx, action, id = '') {
  const { e, field, input, select, options, form, showDialog } = ctx, data = metadata(ctx);
  if (action === 'staff-edit') {
    if (!['owner', 'admin'].includes(ctx.actor.role)) throw new Error('Profile maintenance is available to office users.');
    const user = find(workspaceUsers(ctx.state, ctx.actor), id, 'Staff profile');
    form('Edit staff profile', 'user-save', userFields(ctx, user), 'Save profile', id);
  } else if (action === 'staff-invite') {
    requireCapability(ctx, 'invite');
    form('Prepare staff invitation', 'invite-save', `${userFields(ctx, {}, true)}${note('Prepared only. No email is sent. The invitation has no usable password or sign-in session.')}`, 'Prepare invitation');
  } else if (action === 'password-reset-preview') {
    const user = find(workspaceUsers(ctx.state, ctx.actor), id, 'Staff profile');
    if (!['owner', 'admin'].includes(ctx.actor.role) && user.id !== ctx.actor.id) throw new Error('This reset preview is not available.');
    showDialog('Password reset preview', `<div class="dialog-body"><p>Reset instructions would be prepared for <strong>${e(user.email)}</strong>.</p><p>No email is sent. Public demo passwords remain unchanged. Real resets require the future authentication service.</p></div>`);
  } else if (action === 'team-edit') {
    requireCapability(ctx, 'manageUsers');
    const team = find(data.teams, id, 'Team');
    form('Edit team & branch mapping', 'team-save', `${field('Team name', input('name', 'text', team.name, 'maxlength="100"'))}<fieldset><legend>Assigned personnel</legend>${STAFF.map(name => `<label><input type="checkbox" name="memberNames" value="${e(name)}" ${(team.memberNames || []).includes(name) ? 'checked' : ''}> ${e(name)}</label>`).join('')}</fieldset><fieldset><legend>Assigned client branches</legend>${ctx.state.clients.map(client => `<label><input type="checkbox" name="branchIds" value="${e(client.id)}" ${(team.branchIds || team.clientIds || []).includes(client.id) ? 'checked' : ''}> ${e(client.name)} / ${e(client.branch)}</label>`).join('')}</fieldset>${note('Mapping changes alter the field-role demonstration scope.')}`, 'Save mapping', id);
  } else if (action === 'rate-request') {
    requireCapability(ctx, 'commercial');
    form('Suggest rate change', 'rate-save', `${field('Service', select('serviceId', options(ctx.state.services.filter(service => service.active))))}${field('Requested rate (PHP)', input('requestedRate', 'number', '', 'min="0" max="1000000000" step="0.01"'))}${field('Reason for change', textarea(ctx, 'reason'))}${note('The Owner must review this request. Existing client agreements and scheduled charges are preserved.')}`, 'Submit rate request');
  } else if (action === 'rate-review') {
    requireCapability(ctx, 'manageUsers');
    const row = find(data.rateRequests, id, 'Rate request');
    form('Review rate request', 'review-save', `<p>Requested rate: <strong>${ctx.money(row.requestedRate)}</strong></p><p>${e(row.reason)}</p>${field('Decision', select('decision', options([{ id: 'Approved', name: 'Approve requested rate' }, { id: 'Returned', name: 'Return for correction' }], 'Approved')))}${field('Review reason', textarea(ctx, 'reason'))}`, 'Save review', id);
  } else if (action === 'request-stock') {
    requireCapability(ctx, 'requestStock');
    form('Request stock adjustment', 'stock-request', `${field('Material', select('productId', options(ctx.screen.materials.filter(material => material.active))))}${field('Quantity requested', input('quantity', 'number', '', 'min="0.01" max="1000000000" step="0.01"'))}${field('Reason', textarea(ctx, 'reason'))}${note('Submitting a request does not change on-hand stock. Office staff reconcile stock before restocking.')}`, 'Submit adjustment request');
  } else if (action === 'payment' || action === 'payment-draft') {
    requireCapability(ctx, 'collect');
    const invoice = find(ctx.screen.invoices, id, 'Invoice');
    form('Submit payment for verification', 'payment-submit', `<p>Outstanding: <strong>${ctx.money(invoice.amount - invoice.paid)}</strong></p>${field('Amount (PHP)', input('amount', 'number', '', `min="0.01" max="${invoice.amount - invoice.paid}" step="0.01"`))}${field('Method', select('method', options(['Cash', 'Bank transfer', 'Check'])))}${field('Reference (optional)', input('reference', 'text', '', 'maxlength="200"', false))}${field('Payment proof (optional, up to 1 MB)', '<input name="proof" type="file" accept="image/png,image/jpeg,image/webp,image/gif,application/pdf">')}${note('Evidence stays in this browser. The balance changes only after an authorized user verifies the payment.')}`, 'Submit pending payment', id);
  } else if (action === 'payment-proof') {
    requireCapability(ctx, 'commercial');
    const row = find(data.payments, id, 'Payment');
    showDialog('Payment proof preview', `<div class="dialog-body">${previewProof(ctx, row.proof)}</div>`, true);
  } else if (action === 'payment-void') {
    requireCapability(ctx, 'manageUsers');
    const row = find(data.payments, id, 'Payment');
    form('Void payment with reason', 'payment-void-save', `<p>${ctx.money(row.amount)} / ${e(row.method)}. Verified payment reversals restore the amount due.</p>${field('Reason for void / reversal', textarea(ctx, 'reason'))}${note('The original payment and reversal remain in history.')}`, 'Void payment', id);
  } else if (action === 'reminder-schedule') {
    requireCapability(ctx, 'commercial');
    const invoice = find(ctx.screen.invoices, id, 'Invoice'), row = data.reminders?.find(value => value.invoiceId === id) || {};
    form('Schedule reminder simulation', 'schedule-save', `<p>Invoice ${e(invoice.id)} / ${ctx.money(invoice.amount - invoice.paid)} outstanding.</p>${field('Simulation date', input('date', 'date', row.date || invoice.due))}${field('Simulation time', input('time', 'time', row.time || '09:00'))}${field('Schedule state', select('enabled', options([{ id: 'true', name: 'Enabled for simulation' }, { id: 'false', name: 'Paused' }], row.enabled === false ? 'false' : 'true')))}${field('Schedule note', textarea(ctx, 'reason', row.reason || 'Email reminder simulation'))}${note('Email simulation only. Use Run simulation to create a delivery log; no messages are sent.')}`, 'Save reminder schedule', id);
  } else if (action === 'reminder-log') {
    requireCapability(ctx, 'commercial');
    const row = find(data.reminders, id, 'Reminder');
    showDialog('Simulated reminder delivery log', `<div class="dialog-body">${table(ctx, ['When', 'Outcome', 'Reason'], [...(row.logs || [])].reverse().map(log => `<tr><td>${stamp(ctx, log.at)}</td><td>${e(log.outcome)} (simulation)</td><td>${e(log.reason || 'Simulated delivery')}</td></tr>`), 'No simulation attempts yet.')}${note('No email or SMS was sent.')}</div>`);
  } else if (action === 'reminder-run' || action === 'reminder-retry') {
    requireCapability(ctx, 'commercial');
    find(data.reminders, id, 'Reminder');
    form(action === 'reminder-retry' ? 'Retry reminder simulation' : 'Run reminder simulation', 'reminder-simulate', `${field('Simulation outcome', select('outcome', options([{ id: 'sent', name: 'Simulated success - no message sent' }, { id: 'failed', name: 'Simulated delivery failure' }], 'sent')))}${note('This records a local demonstration attempt only. Failed attempts can be retried.')}`, 'Run simulation', id);
  } else if (action === 'inventory-history') {
    showDialog('Stock movement history', `<div class="dialog-body">${inventoryExtras(ctx)}</div>`, true);
  } else return false;
  return true;
}

async function readProof(formElement) {
  const file = formElement?.elements.proof?.files?.[0];
  if (!file) return null;
  if (file.size > 1024 * 1024 || !['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf'].includes(file.type)) throw new Error('Choose a PNG, JPEG, WebP, GIF or PDF proof no larger than 1 MB.');
  const dataUrl = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error('The payment proof could not be read. Choose the file again.')); reader.readAsDataURL(file); });
  return { name: file.name, size: file.size, type: file.type, dataUrl };
}

export async function handleWorkspaceForm(ctx, kind, id, values, formElement) {
  const { state, actor } = ctx;
  if (!['user-save', 'profile-save', 'invite-save', 'team-save', 'rate-save', 'review-save', 'payment-submit', 'payment-void-save', 'schedule-save', 'stock-request', 'reminder-simulate'].includes(kind)) return { handled: false };
  ensurePresentation(state);
  let message;
  if (kind === 'user-save' || kind === 'profile-save') {
    const input = { displayName: values.displayName, phone: values.phone, email: values.email };
    if (actor.role === 'owner') Object.assign(input, { role: values.role, active: values.active === 'true', teamId: values.teamId, canCollect: values.canCollect === 'true' });
    updateUser(state, actor, id, input); message = 'Staff profile saved in this browser.';
  } else if (kind === 'invite-save') {
    inviteUser(state, actor, { ...values, role: actor.role === 'owner' ? values.role : 'technician', active: false, canCollect: actor.role === 'owner' && values.canCollect === 'true' }); message = 'Invitation prepared. No email was sent.';
  } else if (kind === 'team-save') {
    configureTeamProfile(state, actor, id, { name: values.name, memberNames: [...formElement.querySelectorAll('[name="memberNames"]:checked')].map(field => field.value), branchIds: [...formElement.querySelectorAll('[name="branchIds"]:checked')].map(field => field.value) }); message = 'Team mapping saved. Assigned workspace visibility updated.';
  } else if (kind === 'rate-save') {
    requestRateChange(state, actor, { ...values, requestedRate: Number(values.requestedRate) }); message = 'Rate request submitted for Owner review.';
  } else if (kind === 'review-save') {
    reviewRateChange(state, actor, id, values.decision, values.reason); message = 'Rate request reviewed. Existing agreed charges preserved.';
  } else if (kind === 'stock-request') {
    requestStock(state, actor, values.productId, Number(values.quantity), values.reason); message = 'Stock adjustment requested. On-hand stock is unchanged.';
  } else if (kind === 'payment-submit') {
    recordPaymentDraft(state, actor, id, { ...values, amount: Number(values.amount), proof: await readProof(formElement) }); message = 'Payment pending verification. Invoice balance is unchanged.';
  } else if (kind === 'payment-void-save') {
    voidPayment(state, actor, id, values.reason); message = 'Payment voided with its reason retained.';
  } else if (kind === 'schedule-save') {
    configureReminder(state, actor, id, { ...values, enabled: values.enabled === 'true' }); message = 'Reminder simulation scheduled. No messages will be sent.';
  } else if (kind === 'reminder-simulate') {
    runReminder(state, actor, id, values.outcome); message = 'Reminder simulation logged. No message was sent.';
  }
  return { handled: true, message };
}

export function handleWorkspaceAction(ctx, action, id) {
  if (action !== 'payment-verify') return { handled: false };
  verifyPayment(ctx.state, ctx.actor, id);
  return { handled: true, message: 'Payment verified. Invoice balance and payment history updated.' };
}
