import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemo } from '../src/data.js';
import { calendarRange, moveCalendar, calendarProfit, scheduleVisit, completeVisit } from '../src/model.js';

test('year scope covers exactly January through December, including leap years', () => {
  assert.deepEqual(calendarRange('2026-11-02', 'year'), { start: '2026-01-01', end: '2026-12-31' });
  assert.deepEqual(calendarRange('2028-02-29', 'year'), { start: '2028-01-01', end: '2028-12-31' });
  assert.throws(() => calendarRange('2026-02-29', 'year'));
});

test('calendar navigation moves whole periods and clamps leap-day and month-end selections', () => {
  assert.equal(moveCalendar('2028-02-29', 'year', 1), '2029-02-28');
  assert.equal(moveCalendar('2028-02-29', 'year', -1), '2027-02-28');
  assert.equal(moveCalendar('2026-12-31', 'year', 1), '2027-12-31');
  assert.equal(moveCalendar('2026-01-31', 'month', 1), '2026-02-28');
  assert.equal(moveCalendar('2026-11-02', 'week', -1), '2026-10-26');
  assert.equal(moveCalendar('2026-12-31', 'day', 1), '2027-01-01');
  assert.throws(() => moveCalendar('9999-12-31', 'year', 1), /supported/);
  assert.throws(() => moveCalendar('2026-11-02', 'year', 2));
});

test('annual profit reconciles with all twelve months and excludes the following year', () => {
  const state = createDemo();
  const visit = scheduleVisit(state, { clientId: 'c1', serviceId: state.services[0].id, date: '2026-12-31', time: '13:00', technician: 'Marco Reyes', rate: 1000, plannedExpense: 100, products: [] });
  completeVisit(state, visit.id, { timeIn: '13:00', timeOut: '14:00', products: [], actualRevenue: 900, expense: 100, pest: 'Rodents', pestCount: 0, location: 'Storage', findings: 'No activity', recommendation: 'Monitor', method: 'Inspection' });
  scheduleVisit(state, { clientId: 'c1', serviceId: state.services[0].id, date: '2027-01-01', time: '13:00', technician: 'Marco Reyes', rate: 9999, plannedExpense: 0, products: [] });
  const year = calendarRange('2026-11-02', 'year');
  const total = calendarProfit(state, year.start, year.end);
  const months = Array.from({ length: 12 }, (_, index) => {
    const range = calendarRange(`2026-${String(index + 1).padStart(2, '0')}-01`, 'month');
    return calendarProfit(state, range.start, range.end);
  });
  for (const key of ['visits', 'completed', 'revenue', 'theoreticalProfit', 'actualProfit']) assert.equal(total[key], months.reduce((sum, month) => sum + (month[key] ?? 0), 0), key);
  assert.equal(total.visits, 11);
  const empty = calendarRange('2025-01-01', 'year');
  assert.equal(calendarProfit(state, empty.start, empty.end).actualProfit, null);
});
