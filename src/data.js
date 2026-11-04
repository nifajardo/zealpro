export const DEMO_DATE = '2026-11-02';
export const CALENDAR_VIEWS = ['year', 'month', 'week', 'day'];
export const TREATMENTS = ['Surface spraying', 'Misting', 'Gel bathing', 'Rodenticide', 'Termicide', 'Rodent traps'];
export const STAFF = ['Marco Reyes', 'Paolo Santos', 'Luis Mendoza', 'Carlo Garcia', 'Nina Cruz', 'Adrian Ramos', 'Bea Torres', 'Diego Santos'];
export const PROBLEMS = ['Cockroach activity', 'Rodent activity', 'Termite activity', 'Flying insects', 'No activity observed'];
export const PESTS = ['Cockroaches', 'Rodents', 'Termites', 'Flying insects'];

export function seedServices(materials) {
  const quantities = [150, 100, 20, 250, 300, 4];
  const descriptions = ['Targeted surface treatment for identified pest activity.', 'Controlled misting of agreed service areas.', 'Targeted bait placement with follow-up monitoring.', 'Rodent bait placement and activity monitoring.', 'Targeted treatment for assessed termite activity.', 'Install and inspect rodent monitoring traps.'];
  return TREATMENTS.map((name, i) => ({ id: `s${i + 1}`, name, description: descriptions[i], price: [4500, 5500, 3500, 8000, 6500, 4500][i], plannedExpense: 150, active: true, products: materials.some(m => m.category === name) ? [{ productId: materials.find(m => m.category === name).id, quantity: quantities[i] }] : [] }));
}

export function createDemo() {
  const clients = [
    { id: 'c1', name: 'Abenson', branch: 'Pasig branch', address: 'Pasig City', contact: 'Branch administrator', duration: '12 months', package: 'General pest control', rate: 4500, since: '2026-06-01' },
    { id: 'c2', name: 'Northpoint Residences', branch: 'Quezon City', address: 'Quezon City', contact: 'Property administrator', duration: '12 months', package: 'Integrated pest management', rate: 6500, since: '2026-07-15' },
    { id: 'c3', name: 'The Green Table', branch: 'Makati kitchen', address: 'Makati City', contact: 'Operations manager', duration: '6 months', package: 'General pest control', rate: 3500, since: '2026-08-01' },
    { id: 'c4', name: 'Eastbridge Logistics', branch: 'Taguig warehouse', address: 'Taguig City', contact: 'Facilities manager', duration: '12 months', package: 'Rodent management', rate: 8000, since: '2026-05-01' },
    { id: 'c5', name: 'Willow Medical Center', branch: 'Mandaluyong', address: 'Mandaluyong City', contact: 'Facilities administrator', duration: '6 months', package: 'Integrated pest management', rate: 5500, since: '2026-09-01' },
  ];
  const materials = [
    { id: 'm1', name: 'Surface treatment concentrate', category: 'Surface spraying', stock: 4200, minimum: 1500, unit: 'mL', cost: 2 },
    { id: 'm2', name: 'Cockroach gel bait', category: 'Gel bathing', stock: 180, minimum: 250, unit: 'g', cost: 8 },
    { id: 'm3', name: 'Rodent bait', category: 'Rodenticide', stock: 3600, minimum: 1000, unit: 'g', cost: 1 },
    { id: 'm4', name: 'Termite treatment concentrate', category: 'Termicide', stock: 2800, minimum: 1000, unit: 'mL', cost: 3 },
    { id: 'm5', name: 'Monitoring traps', category: 'Rodent traps', stock: 36, minimum: 12, unit: 'pcs', cost: 95 },
    { id: 'm6', name: 'Misting concentrate', category: 'Misting', stock: 2400, minimum: 1000, unit: 'mL', cost: 2 },
  ];
  materials.forEach(m => { m.active = true; m.description = `${m.category} product, measured in ${m.unit}.`; });
  const services = seedServices(materials);
  const rows = [
    ['v1', 'c1', '08:00', 'Surface spraying', 'Marco Reyes', 'Completed', 'm1', 150],
    ['v2', 'c3', '09:00', 'Gel bathing', 'Paolo Santos', 'Completed', 'm2', 20],
    ['v3', 'c5', '09:30', 'Misting', 'Luis Mendoza', 'Completed', 'm6', 100],
    ['v4', 'c2', '11:00', 'Surface spraying', 'Marco Reyes', 'In progress', 'm1', 200],
    ['v5', 'c4', '13:00', 'Rodenticide', 'Carlo Garcia', 'Scheduled', 'm3', 250],
    ['v6', 'c1', '14:00', 'Rodent traps', 'Paolo Santos', 'Scheduled', 'm5', 4],
    ['v7', 'c2', '15:00', 'Termicide', 'Luis Mendoza', 'Scheduled', 'm4', 300],
    ['v8', 'c3', '16:00', 'Gel bathing', 'Marco Reyes', 'Scheduled', 'm2', 20],
  ];
  const visits = rows.map(([id, clientId, time, treatment, technician, status, materialId, quantity]) => ({ id, clientId, date: DEMO_DATE, time, treatment, technician, status, materialId, quantity, rate: clients.find(c => c.id === clientId).rate }));
  visits.push({ id: 'v9', clientId: 'c4', date: '2026-11-04', time: '10:00', treatment: 'Rodent traps', technician: 'Carlo Garcia', status: 'Scheduled', materialId: 'm5', quantity: 6, rate: 8000 });
  visits.push({ id: 'v10', clientId: 'c5', date: '2026-11-06', time: '09:00', treatment: 'Misting', technician: 'Luis Mendoza', status: 'Scheduled', materialId: 'm6', quantity: 150, rate: 5500 });
  const reports = visits.filter(v => v.status === 'Completed').map((v, i) => ({ id: `SR-2026-${String(1366 + i).padStart(5, '0')}`, visitId: v.id, clientId: v.clientId, date: v.date, timeIn: v.time, timeOut: ['08:45', '09:40', '10:15'][i], technician: v.technician, treatment: v.treatment, method: v.treatment, materialId: v.materialId, quantity: v.quantity, expense: 150, pest: ['Cockroaches', 'Cockroaches', 'Flying insects'][i], pestCount: [2, 4, 1][i], location: ['Stockroom and receiving area', 'Kitchen and dry storage', 'Service corridors'][i], findings: ['Low cockroach activity at receiving area.', 'Activity observed around dry storage.', 'One flying insect observed in a service corridor.'][i], recommendation: 'Keep access points sealed and maintain sanitation.', remarks: 'Routine follow-up recommended. Sample report; no customer signature collected.' }));
  visits.forEach(v => { const m = materials.find(m => m.id === v.materialId); v.serviceId = services.find(s => s.name === v.treatment).id; v.plannedExpense = 150; v.estimatedProducts = [{ productId: m.id, quantity: v.quantity, name: m.name, unit: m.unit, unitCost: m.cost }]; });
  reports.forEach(r => { const m = materials.find(m => m.id === r.materialId); r.products = [{ productId: m.id, quantity: r.quantity, name: m.name, unit: m.unit, unitCost: m.cost }]; r.actualRevenue = visits.find(v => v.id === r.visitId).rate; r.financialsConfirmed = true; });
  // shortcut: historical observations are illustrative counts, replace with validated field records before production analytics.
  const observations = ['2026-06-15', '2026-07-15', '2026-08-15', '2026-09-15', '2026-10-15'].flatMap((date, i) => [
    { clientId: 'c1', date, pest: 'Cockroaches', count: [18, 15, 11, 8, 5][i] },
    { clientId: 'c2', date, pest: 'Cockroaches', count: [22, 20, 15, 12, 7][i] },
    { clientId: 'c4', date, pest: 'Rodents', count: [9, 7, 8, 5, 3][i] },
  ]);
  observations.forEach(o => { o.source = 'Illustrative historical seed'; });
  return { version: 2, services, clients, visits, materials, reports, observations,
    assessments: [{ id: 'a1', clientId: 'c2', serviceId: 's5', findings: [{ location: 'Ground floor service area', problem: 'Termite activity', serviceId: 's5', materialIds: ['m4'], notes: '' }], date: '2026-10-29', time: '10:00', assessor: 'Marco Reyes', location: 'Ground floor service area', problem: 'Termite activity', solution: 'Termicide', materialId: 'm4', notes: 'Activity near timber fixtures. Inspect adjacent areas before treatment.' }],
    invoices: [
      ...reports.map((r, index) => ({ id: `INV-SERVICE-${index + 1}`, visitId: r.visitId, clientId: r.clientId, date: r.date, due: '2026-12-02', amount: r.actualRevenue, paid: [0, 1000, r.actualRevenue][index], treatment: r.treatment, payments: [] })),
      { id: 'INV-2026-0108', clientId: 'c1', date: '2026-10-15', due: '2026-10-30', amount: 18000, paid: 4500, treatment: 'General pest control', payments: [] },
      { id: 'INV-2026-0109', clientId: 'c2', date: '2026-10-20', due: '2026-11-05', amount: 19500, paid: 6500, treatment: 'Integrated pest management', payments: [] },
      { id: 'INV-2026-0110', clientId: 'c4', date: '2026-10-22', due: '2026-11-06', amount: 24000, paid: 8000, treatment: 'Rodent management', payments: [] },
      { id: 'INV-2026-0111', clientId: 'c3', date: '2026-10-25', due: '2026-11-09', amount: 7000, paid: 0, treatment: 'General pest control', payments: [] },
      { id: 'INV-2026-0107', clientId: 'c5', date: '2026-10-10', due: '2026-10-25', amount: 5500, paid: 5500, treatment: 'Misting', payments: [] },
    ] };
}
