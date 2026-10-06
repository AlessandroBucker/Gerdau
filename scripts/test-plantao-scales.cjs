const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const context = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/plantao-schedule.ts', 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText, context);
const { scheduleDay, withEvent, nextEventDate, validDate } = context.exports;
const config = { schedule_id: 'P', start_date: '2026-07-01', kind: 'config', work_days: 4, rest_days: 2, phase: 'work', cycle_offset: 4 };
const restart = { schedule_id: 'P', start_date: '2026-10-06', kind: 'restart', work_days: null, rest_days: null, phase: 'rest', cycle_offset: 0 };
const future = { ...restart, start_date: '2026-10-12', phase: 'work' };
let events = [config, future];
const previous = scheduleDay('P', '2026-10-05', events).working;
events = withEvent(events, restart);
assert.equal(scheduleDay('P', '2026-10-05', events).working, previous);
assert.equal(nextEventDate(events, restart), '2026-10-12');
for (const date of ['2026-10-06','2026-10-07']) assert.equal(scheduleDay('P',date,events).working,false);
for (const date of ['2026-10-08','2026-10-09','2026-10-10','2026-10-11','2026-10-12']) assert.equal(scheduleDay('P',date,events).working,true);
events = withEvent(events,{...config,start_date:'2026-10-09',work_days:5,rest_days:2,cycle_offset:0});
assert.equal(scheduleDay('P','2026-10-07',events).working,false);
assert.equal(scheduleDay('P','2026-10-16',events).working,true);
assert.equal(scheduleDay('P','2026-10-17',events).working,false);
assert.equal(events.filter(event=>event.start_date==='2026-10-12').length,1);
assert.equal(scheduleDay('P','2026-06-30',events),null);
assert.equal(validDate('2026-02-30'),false);
// Preserve every day of the previous P/Q and weekday-only 5X2 calendars.
for(let i=0;i<365;i++) {
 const date = new Date(Date.UTC(2026,6,1+i));
 const key = date.toISOString().slice(0,10);
 const offset = (date.getTime()-Date.UTC(2026,7,1))/86400000;
 for(const [id,seed,oldOffset] of [['P',4,5],['Q',0,1]]) {
  const expected=((offset+oldOffset)%6+6)%6<4;
  assert.equal(scheduleDay(id,key,[{...config,schedule_id:id,cycle_offset:seed}]).working,expected);
 }
 assert.equal(scheduleDay('5X2',key,[{...config,schedule_id:'5X2',work_days:5,rest_days:2,cycle_offset:2}]).working,![0,6].includes(date.getUTCDay()));
}
console.log('OK: historical preservation, future restarts, changed cycles, dates and legacy schedules.');
