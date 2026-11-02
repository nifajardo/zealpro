import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemo } from '../src/data.js';
import * as model from '../src/model.js';

const details = { clientId: 'c1', date: '2026-11-03', time: '09:00', assessor: 'Marco Reyes', notes: 'Inspect adjacent areas next week.' };
const findings = [
  { location: 'Loading bay', problem: 'Rodent activity', serviceId: 's6', materialIds: ['m5', 'm3'], notes: 'Gaps beside the loading door.' },
  { location: 'Kitchen', problem: 'Cockroach activity', serviceId: 's3', materialIds: ['m2'], notes: 'Inspect behind the sink.' },
];

test('ocular assessment stores independent findings and products with a legacy first-finding projection', () => {
  const state = createDemo(), input = { ...details, findings: structuredClone(findings) };
  const before = structuredClone(input);
  const assessment = model.addAssessment(state, input);
  assert.deepEqual(assessment.findings, findings);
  assert.deepEqual(input, before);
  assert.equal(assessment.location, findings[0].location);
  assert.equal(assessment.problem, findings[0].problem);
  assert.equal(assessment.solution, 'Rodent traps');
  assert.equal(assessment.serviceId, 's6');
  assert.equal(assessment.materialId, 'm5');
  assert.equal(assessment.notes, details.notes);
  input.findings[0].materialIds.push('m1');
  assert.deepEqual(assessment.findings, findings);
  assert.equal(model.validateState(state), true);
});

test('invalid finding or catalog choice rejects the whole assessment without mutation', () => {
  const state = createDemo(), before = structuredClone(state);
  const invalid = [
    [], Array(21).fill(findings[0]), null, [findings[0], ,],
    [findings[0], { ...findings[1], location: '' }],
    [{ ...findings[0], serviceId: 'missing' }],
    [{ ...findings[0], problem: 'Unknown activity' }],
    [{ ...findings[0], materialIds: [] }],
    [{ ...findings[0], materialIds: ['m5', 'm5'] }],
    [{ ...findings[0], materialIds: ['missing'] }],
    [{ ...findings[0], materialIds: ['m5', ,] }],
    [{ ...findings[0], notes: 'x'.repeat(2001) }],
  ];
  for (const rows of invalid) {
    assert.throws(() => model.addAssessment(state, { ...details, findings: rows }));
    assert.deepEqual(state, before);
  }
  state.services.find(s => s.id === 's6').active = false;
  assert.throws(() => model.addAssessment(state, { ...details, findings }));
  state.services.find(s => s.id === 's6').active = true;
  state.materials.find(m => m.id === 'm3').active = false;
  assert.throws(() => model.addAssessment(state, { ...details, findings }));
});

test('finding and material count boundaries allow 20 entries and reject 21 without mutation', () => {
  const state = createDemo();
  for (let i = 0; i < 15; i++) state.materials.push({ ...state.materials[0], id: `extra-${i}`, name: `Extra product ${i}` });
  const materialIds = state.materials.slice(0, 20).map(m => m.id);
  const rows = Array.from({ length: 20 }, (_, i) => ({ ...findings[0], location: `Inspected area ${i}`, materialIds }));
  const assessment = model.addAssessment(state, { ...details, findings: rows });
  assert.equal(assessment.findings.length, 20);
  assert.equal(assessment.findings[0].materialIds.length, 20);
  assert.equal(model.validateState(state), true);
  const before = structuredClone(state);
  assert.throws(() => model.addAssessment(state, { ...details, findings: [{ ...findings[0], materialIds: state.materials.map(m => m.id) }] }));
  assert.deepEqual(state, before);
});

test('legacy input and prospect fields remain supported with stable service ID lookup', () => {
  const state = createDemo();
  const assessment = model.addAssessment(state, { ...details, clientId: '', accountName: ' New account ', branch: ' Branch A ', location: 'Store', problem: 'Rodent activity', solution: 'Rodent traps', materialId: 'm5' });
  assert.deepEqual(model.assessmentFindings(assessment), [{ location: 'Store', problem: 'Rodent activity', serviceId: 's6', materialIds: ['m5'], notes: details.notes }]);
  assert.equal(assessment.accountName, 'New account');
  assert.equal(assessment.branch, 'Branch A');
  state.services.find(s => s.id === 's6').name = 'Renamed trap service';
  const created = model.addAssessment(state, { ...details, serviceId: 's6', location: 'Store', problem: 'Rodent activity', solution: 'Rodent traps', materialId: 'm5' });
  assert.equal(created.solution, 'Renamed trap service');
});

test('version 2 migration preserves legacy assessment text and resolves IDs without mutating input', () => {
  const state = createDemo(), old = state.assessments[0];
  delete old.findings; delete old.serviceId;
  const before = structuredClone(state);
  assert.deepEqual(model.assessmentFindings(old), [{ location: old.location, problem: old.problem, serviceId: '', materialIds: [old.materialId], notes: old.notes }]);
  assert.equal(model.validateState(state), true);
  const migrated = model.migrateState(state);
  assert.deepEqual(state, before);
  assert.deepEqual(migrated.assessments[0], { ...old, serviceId: 's5', findings: [{ location: old.location, problem: old.problem, serviceId: 's5', materialIds: [old.materialId], notes: old.notes }] });
  assert.deepEqual(model.migrateState(migrated), migrated);
  old.solution = 'Historical recommendation outside catalog';
  const unresolved = model.migrateState(state);
  assert.equal(unresolved.assessments[0].solution, old.solution);
  assert.equal(unresolved.assessments[0].findings[0].serviceId, '');
  assert.equal(model.validateState(unresolved), true);
  const saved = structuredClone(unresolved);
  assert.throws(() => model.scheduleVisit(unresolved, { clientId: old.clientId, date: details.date, time: details.time, technician: details.assessor, treatment: old.solution, materialId: old.materialId, quantity: 1, rate: 1000 }), /active service/);
  assert.deepEqual(unresolved, saved);
  for (const invalid of [null, 0, false, 'missing']) {
    const broken = structuredClone(unresolved);
    broken.assessments[0].serviceId = invalid;
    assert.equal(model.validateState(broken), false);
  }
});

test('version 1 migration adds findings while retaining original records', () => {
  const legacy = createDemo();
  legacy.version = 1;
  legacy.invoices = legacy.invoices.filter(i => !i.visitId);
  delete legacy.services;
  for (const a of legacy.assessments) { delete a.findings; delete a.serviceId; }
  const before = structuredClone(legacy), migrated = model.migrateState(legacy);
  assert.deepEqual(legacy, before);
  assert.equal(migrated.assessments[0].findings[0].serviceId, 's5');
  assert.equal(migrated.assessments[0].findings[0].notes, before.assessments[0].notes);
  assert.equal(model.validateState(migrated), true);
});

test('saved findings reject malformed nested fields but retain archived and renamed catalog references', () => {
  const state = createDemo();
  const assessment = model.addAssessment(state, { ...details, findings });
  for (const invalid of [null, [], Array(21).fill(findings[0]), [null], [{ ...findings[0], location: 'x'.repeat(2001) }], [{ ...findings[0], notes: 1 }], [{ ...findings[0], serviceId: 'missing' }], [{ ...findings[0], serviceId: '' }], [{ ...findings[0], materialIds: 'm5' }], [{ ...findings[0], materialIds: ['m5', 'm5'] }], [{ ...findings[0], materialIds: Array(21).fill('m5') }], [{ ...findings[0], materialIds: ['missing'] }]]) {
    const broken = structuredClone(state);
    broken.assessments.at(-1).findings = invalid;
    assert.equal(model.validateState(broken), false, JSON.stringify(invalid));
    assert.throws(() => model.migrateState(broken));
  }
  for (const id of ['s6', 's3']) Object.assign(state.services.find(s => s.id === id), { active: false, name: `Archived ${id}` });
  for (const id of ['m5', 'm3', 'm2']) Object.assign(state.materials.find(m => m.id === id), { active: false, name: `Archived ${id}` });
  assert.equal(model.validateState(state), true);
  assert.deepEqual(model.migrateState(state).assessments.at(-1), assessment);
});
