export type Schedule = { id: string; name: string; active: boolean; color: string };
export type ScheduleEvent = { id?: string; schedule_id: string; start_date: string; kind: "config" | "restart"; work_days: number | null; rest_days: number | null; phase: "work" | "rest"; cycle_offset: number; };
export const dayNumber = (date: string) => Date.parse(`${date}T00:00:00Z`) / 86400000;
export const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export function validDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(dayNumber(value)) && new Date(dayNumber(value) * 86400000).toISOString().slice(0, 10) === value;
}
export function scheduleDay(id: string, date: string, events: ScheduleEvent[]) {
  const history = events.filter(event => event.schedule_id === id && event.start_date <= date).sort((a, b) => a.start_date.localeCompare(b.start_date));
  const config = history.filter(event => event.kind === "config").at(-1);
  if (!config || !config.work_days || !config.rest_days) return null;
  const anchor = history.at(-1)!;
  const cycle = config.work_days + config.rest_days;
  const position = ((dayNumber(date) - dayNumber(anchor.start_date) + (anchor.phase === "rest" ? config.work_days : 0) + anchor.cycle_offset) % cycle + cycle) % cycle;
  return { working: position < config.work_days, restart: anchor.start_date === date, workDays: config.work_days, restDays: config.rest_days };
}
export function withEvent(events: ScheduleEvent[], event: ScheduleEvent) {
  return [...events.filter(item => item.schedule_id !== event.schedule_id || item.start_date !== event.start_date), event];
}
export function nextEventDate(events: ScheduleEvent[], event: ScheduleEvent) {
  return events.filter(item => item.schedule_id === event.schedule_id && item.start_date > event.start_date).map(item => item.start_date).sort()[0] ?? null;
}
