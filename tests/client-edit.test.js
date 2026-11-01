import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemo } from '../src/data.js';
import { enrollClient, migrateState, validateState } from '../src/model.js';

test('editing a client preserves its identity and existing service, report and payment records', () => {
  const state = createDemo(), original = state.clients[0];
  const history = structuredClone({ visits: state.visits, reports: state.reports, invoices: state.invoices });
  const edited = enrollClient(state, { ...original, name: ' Updated account ', branch: ' Updated branch ', address: ' Updated address ', contact: ' Facilities coordinator ', contactPerson: ' Demo Contact ', phone: ' +63 (2) 0000-0000 ext. 12 ', email: ' contact@example.invalid ', rate: 4800 }, original.id);
  assert.equal(edited, original);
  assert.equal(edited.name, 'Updated account');
  assert.equal(edited.contactPerson, 'Demo Contact');
  assert.equal(edited.phone, '+63 (2) 0000-0000 ext. 12');
  assert.equal(edited.email, 'contact@example.invalid');
  assert.equal(state.clients.length, 5);
  assert.deepEqual({ visits: state.visits, reports: state.reports, invoices: state.invoices }, history);
  assert.equal(validateState(state), true);
});

test('client editing rejects duplicate branches, invalid contacts and assessment relinking without mutation', () => {
  const state = createDemo(), client = state.clients[0];
  const before = structuredClone(state);
  for (const values of [
    { name: state.clients[1].name, branch: state.clients[1].branch },
    { email: 'invalid-email' }, { phone: 'not a phone' }, { phone: '123' },
    { contactPerson: 123 }, { email: 123 }, { phone: 123 }, { assessmentId: 'a1' },
  ]) {
    assert.throws(() => enrollClient(state, { ...client, ...values }, client.id));
    assert.deepEqual(state, before);
  }
  assert.throws(() => enrollClient(state, client, 'missing-client'), /found/);
  assert.deepEqual(state, before);
  enrollClient(state, { ...client, name: ` ${client.name} `, contactPerson: '', phone: '', email: '' }, client.id);
  assert.equal(state.clients.length, 5);
});

test('enrollment accepts optional contact details and legacy contact roles remain valid without guessed names', () => {
  const state = createDemo();
  assert.deepEqual(migrateState(state).clients, state.clients);
  const created = enrollClient(state, { name: 'Demo account', branch: 'New branch', address: 'Demo city', contact: '', contactPerson: 'Demo Contact', phone: '+63 900 000 0000', email: 'demo@example.invalid', duration: '6 months', package: 'General pest control', rate: 1000, since: '2026-11-02' });
  assert.equal(created.contactPerson, 'Demo Contact');
  assert.equal(created.contact, '');
  assert.equal(validateState(state), true);
  created.email = 'broken';
  assert.equal(validateState(state), false);
});
