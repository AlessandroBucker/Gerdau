"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Printer } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type ViewMode = "month" | "week";
import { isTeam, sortTeam, Shift, TeamPerson, teamTitles } from "@/lib/plantao-team";
import { PlantaoTeamEditor } from "@/components/plantao-team-editor";
import { ShiftTable } from "@/components/plantao-shift-table";
import { Schedule, ScheduleEvent } from "@/lib/plantao-schedule";
import { PlantaoScheduleEditor, DaySelection } from "@/components/plantao-schedule-editor";

const TEAM_STORAGE_KEY = "portal-pdfs.plantao-team.v1";

const CYCLE_ANCHOR = new Date(2026, 7, 1, 12);
const START = new Date(2026, 6, 1, 12);
const END = new Date(2028, 7, 31, 12);
const DAY_MS = 86400000;
const FIRST_WEEK_START = addDays(START, (8 - START.getDay()) % 7);
const LAST_WEEK_START = addDays(END, -((END.getDay() + 6) % 7) - 14 + (END.getDay() === 0 ? 7 : 0));
const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function atNoon(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
}

function addDays(date: Date, amount: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return atNoon(result);
}

function monthDays(date: Date) {
  const total = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return Array.from({ length: total }, (_, index) => new Date(date.getFullYear(), date.getMonth(), index + 1, 12));
}

function weekDays(date: Date) {
  return Array.from({ length: 7 }, (_, index) => addDays(date, index));
}

function isoWeekValue(date: Date) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((target.getTime() - yearStart.getTime()) / DAY_MS) + 1) / 7);
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function mondayFromWeek(value: string) {
  const match = /^(\d{4})-W(\d{2})$/.exec(value);
  if (!match) return null;
  const januaryFourth = new Date(Number(match[1]), 0, 4, 12);
  const mondayWeekOne = addDays(januaryFourth, -((januaryFourth.getDay() + 6) % 7));
  return addDays(mondayWeekOne, (Number(match[2]) - 1) * 7);
}

export function PlantaoCalendar() {
  const [people, setPeople] = useState<TeamPerson[]>([]);
  const [ready, setReady] = useState(false);
  const [managing, setManaging] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [saved, setSaved] = useState(false);
  const [localPeople, setLocalPeople] = useState<TeamPerson[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [login, setLogin] = useState(false);
  const [loginBusy, setLoginBusy] = useState(false);
  const [scalesOpen, setScalesOpen] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [selectedDay, setSelectedDay] = useState<DaySelection | null>(null);
  const [pendingAction, setPendingAction] = useState<"team" | "scales" | "import" | "day">("team");
  const [accessBusy, setAccessBusy] = useState(false);
  const managerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (managing || scalesOpen) managerRef.current?.scrollIntoView({behavior:"smooth",block:"start"});
  }, [managing, scalesOpen, selectedDay]);
  async function loadData() {
    const responses = await Promise.all([fetch("/api/rotina/plantao", {cache:"no-store"}), fetch("/api/rotina/plantao/scales", {cache:"no-store"})]);
    const [team, scales] = await Promise.all(responses.map(response => response.json()));
    if (!responses[0].ok || !responses[1].ok || !isTeam(team.people)) throw new Error(team.error || scales.error || "Falha ao carregar dados.");
    setPeople(sortTeam(team.people)); setSchedules(scales.schedules); setEvents(scales.events); setReady(true);
  }
  async function openManager(action: "team" | "scales" | "import" | "day") {
    setPendingAction(action); setStorageError(""); setAccessBusy(true);
    try {
      const response = await fetch("/api/rotina/plantao/session", {cache:"no-store"});
      if (!response.ok) throw new Error("Falha ao verificar acesso.");
      const data = await response.json();
      if (!data.authenticated) {setLogin(true); return;}
      await loadData();
      if (action === "team") {setManaging(true);setScalesOpen(false);}
      else if(action === "import") {if(localPeople) await savePeople(localPeople,true);}
      else {setScalesOpen(true);setManaging(false);if(action === "scales") setSelectedDay(null);}
    } catch(error) {setStorageError(error instanceof Error ? error.message : "Falha ao abrir gerenciamento.");}
    finally {setAccessBusy(false);}
  }
  async function saveSchedule(row: Schedule, event: ScheduleEvent | null) {
    if (saving) return false;
    setSaving(true);setSaved(false);setStorageError("");
    try {
      const response = await fetch("/api/rotina/plantao/scales", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({row,event})});
      const data = await response.json();
      if(response.status===401) {setPendingAction("scales");setLogin(true);}
      if(!response.ok) throw new Error(data.error || "Falha ao salvar escala.");
      await loadData();setSaved(true);return true;
    } catch(error) {setStorageError(error instanceof Error?error.message:"Falha ao salvar escala.");return false;}
    finally {setSaving(false);}
  }
  useEffect(() => {
    try {
      const raw = localStorage.getItem(TEAM_STORAGE_KEY);
      if (raw !== null) {
        const parsed: unknown = JSON.parse(raw);
        if (isTeam(parsed)) setLocalPeople(parsed);
      }
    } catch { /* Local storage is optional; server data remains available. */ }
    loadData().catch(error => setStorageError(error.message));
  }, []);
  async function savePeople(next: TeamPerson[], importing = false) {
    if (saving) return false;
    setSaved(false); setStorageError(""); setSaving(true);
    try {
      if (!isTeam(next)) throw new Error("Dados invalidos.");
      const changed = importing ? next : next.filter(person => JSON.stringify(person) !== JSON.stringify(people.find(item => item.id === person.id)));
      if (!changed.length) return true;
      const response = await fetch("/api/rotina/plantao", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ people: changed }) });
      const data = await response.json();
      if (response.status === 401) setLogin(true);
      if (!response.ok) throw new Error(data.error || "Falha ao salvar.");
      if (!isTeam(data.people)) throw new Error("Resposta invalida do banco.");
      const rows: TeamPerson[] = data.people;
      setPeople(current => sortTeam([...current.map(person => rows.find(row => row.id === person.id) ?? person), ...rows.filter(row => !current.some(person => person.id === row.id))]));
      if (importing) {
        try { localStorage.removeItem(TEAM_STORAGE_KEY); } catch { /* Keep the local backup if storage is unavailable. */ }
        setLocalPeople(null);
      }
      setSaved(true); return true;
    } catch (error) { setStorageError(error instanceof Error ? error.message : "Falha ao salvar no banco."); return false; }
    finally { setSaving(false); }
  }
  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoginBusy(true); setStorageError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: form.get("username"), password: form.get("password") }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Falha no acesso.");
      setLogin(false);
      await openManager(pendingAction);
    } catch (error) { setStorageError(error instanceof Error ? error.message : "Falha no acesso."); }
    finally { setLoginBusy(false); }
  }
  const now = atNoon(new Date());
  const initialMonth = new Date(now.getFullYear(), now.getMonth(), 1, 12);
  const currentWeekStart = addDays(now, -((now.getDay() + 6) % 7));
  const [mode, setMode] = useState<ViewMode>("month");
  const [cursor, setCursor] = useState(initialMonth < START ? START : initialMonth);
  const dateGroups = useMemo(() => mode === "month"
    ? [0, 1].map(offset => new Date(cursor.getFullYear(), cursor.getMonth() + offset, 1, 12)).filter(month => month <= END).map(monthDays)
    : [0, 1].map(offset => weekDays(addDays(cursor, offset * 7))), [cursor, mode]);
  const dates = dateGroups.flat();
  const title = mode === "month" ? `${monthNames[dateGroups[0][0].getMonth()]} — ${monthNames[dateGroups[dateGroups.length - 1][0].getMonth()]} ${dateGroups[dateGroups.length - 1][0].getFullYear()}` : `${formatShort(dates[0])} a ${formatShort(dates[dates.length - 1])}`;

  function navigate(direction: -1 | 1) {
    if (mode === "month") {
      const next = new Date(cursor.getFullYear(), cursor.getMonth() + direction * 2, 1, 12);
      if (next >= START && next <= END) setCursor(next);
    } else {
      const next = addDays(cursor, direction * 14);
      if (next >= FIRST_WEEK_START && next <= LAST_WEEK_START) setCursor(next);
    }
  }

  function selectMode(nextMode: ViewMode) {
    setMode(nextMode);
    if (nextMode === "month") setCursor(initialMonth < START ? START : initialMonth);
    else {
      setCursor(currentWeekStart < FIRST_WEEK_START ? FIRST_WEEK_START : currentWeekStart > LAST_WEEK_START ? LAST_WEEK_START : currentWeekStart);
    }
  }

  function selectPeriod(value: string) {
    if (mode === "month") {
      const [year, month] = value.split("-").map(Number);
      if (year && month) {
        const selectedMonth = new Date(year, month - 1, 1, 12);
        if (selectedMonth >= START && selectedMonth <= END) setCursor(selectedMonth);
      }
    } else {
      const selectedWeek = mondayFromWeek(value);
      if (selectedWeek) {
        if (selectedWeek >= FIRST_WEEK_START && selectedWeek <= LAST_WEEK_START) setCursor(selectedWeek);
      }
    }
  }

  function printCalendars() {
    const originalTitle = document.title;
    const first = dates[0];
    const last = dates[dates.length - 1];
    const period = mode === "month"
      ? `${monthNames[first.getMonth()]}_${first.getFullYear()}_${monthNames[last.getMonth()]}_${last.getFullYear()}`
      : `${formatShort(first).replaceAll("/", "-")}_${formatShort(last).replaceAll("/", "-")}`;
    document.title = `Calendario_Plantao_${mode === "month" ? "Mensal" : "Semanal"}_${period}`;
    window.addEventListener("afterprint", () => { document.title = originalTitle; }, { once: true });
    window.print();
  }

  const canPrevious = mode === "month" ? cursor > START : addDays(cursor, -14) >= FIRST_WEEK_START;
  const canNext = mode === "month" ? new Date(cursor.getFullYear(), cursor.getMonth() + 2, 1, 12) <= END : addDays(cursor, 14) <= LAST_WEEK_START;

  return (
    <div>
      <header className="calendar-print-hide mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600"><CalendarDays size={23} /></span><h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Calendário do plantão</h1></div>
        <div className="flex flex-wrap items-center gap-2"><div className="inline-flex w-fit rounded-xl border border-slate-200 bg-white p-1 shadow-sm"><button onClick={() => selectMode("month")} className={`rounded-lg px-4 py-2 text-sm font-bold transition ${mode === "month" ? "bg-brand-600 text-white" : "text-slate-500 hover:bg-slate-50"}`}>Mensal</button><button onClick={() => selectMode("week")} className={`rounded-lg px-4 py-2 text-sm font-bold transition ${mode === "week" ? "bg-brand-600 text-white" : "text-slate-500 hover:bg-slate-50"}`}>Semanal</button></div><label className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm"><span className="mr-2 text-xs font-bold text-slate-500">Selecionar {mode === "month" ? "mês" : "semana"}</span><input type={mode === "month" ? "month" : "week"} value={mode === "month" ? `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}` : isoWeekValue(cursor)} min={mode === "month" ? "2026-08" : isoWeekValue(FIRST_WEEK_START)} max={mode === "month" ? "2028-07" : isoWeekValue(LAST_WEEK_START)} onChange={event => selectPeriod(event.target.value)} className="bg-transparent text-sm font-semibold text-slate-700 outline-none" /></label><button type="button" disabled={accessBusy||saving} onClick={() => openManager("team")} className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50">Gerenciar colaboradores</button><button disabled={accessBusy||saving} onClick={()=>openManager("scales")} className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50">Gerenciar escalas</button><button onClick={printCalendars} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"><Printer size={17} /> Imprimir</button></div>
      </header>

      {storageError && <p role="alert" className="calendar-print-hide mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{storageError} <button onClick={()=>loadData().then(()=>setStorageError("")).catch(error=>setStorageError(error.message))} className="underline">Tentar carregar novamente</button></p>}
      {saved && <p role="status" className="calendar-print-hide mb-4 text-emerald-700">Alterações salvas no banco de dados.</p>}
      {accessBusy && <p role="status" className="calendar-print-hide mb-4">Verificando acesso...</p>}
      {login && <div className="calendar-print-hide fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-label="Login administrativo"><form onSubmit={authenticate} className="w-full max-w-md space-y-4 rounded-xl bg-white p-6"><h2 className="text-xl font-bold">Acesso administrativo</h2><label className="block">Usuário<input autoFocus required name="username" autoComplete="username" className="mt-1 w-full rounded border p-2"/></label><label className="block">Senha<input required name="password" type="password" autoComplete="current-password" className="mt-1 w-full rounded border p-2"/></label>{storageError && <p role="alert" className="text-red-700">{storageError}</p>}<div className="flex gap-3"><button disabled={loginBusy} className="rounded-lg bg-brand-600 px-4 py-2 text-white">{loginBusy?"Entrando...":"Entrar"}</button><button type="button" disabled={loginBusy} onClick={()=>setLogin(false)}>Cancelar</button></div></form></div>}
      {localPeople && <div className="calendar-print-hide mb-4 rounded-lg border bg-blue-50 p-3"><p>Existem dados de colaboradores salvos neste navegador.</p><button disabled={accessBusy||saving} onClick={()=>openManager("import")} className="mt-2 rounded bg-brand-600 px-3 py-2 text-white">Enviar dados locais ao banco</button></div>}
      <div ref={managerRef} className="scroll-mt-20">
        {managing && <PlantaoTeamEditor schedules={schedules} people={people} saving={saving} onSave={savePeople} onClose={()=>setManaging(false)}/>}
        {scalesOpen && <PlantaoScheduleEditor key={selectedDay?selectedDay.id+selectedDay.date:"scales"} schedules={schedules} events={events} selected={selectedDay} saving={saving} onSave={saveSchedule} onClose={()=>setScalesOpen(false)}/>}
      </div>
      <div>
      <section className="calendar-team-print mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2.5"><h2 className="text-sm font-bold text-slate-900">Colaboradores por equipe</h2></div>
        <div className="overflow-x-auto p-2.5">
          <TeamTable schedules={schedules} titles={[...teamTitles]} columns={teamTitles.map((_, team) => people.filter(person => person.active && person.team === team))} />
          {ready && people.every(person => !person.active) && <p className="p-3 text-center text-sm text-slate-500">Nenhum colaborador ativo. Use Gerenciar colaboradores para adicionar ou reativar um cadastro.</p>}
        </div>
      </section>
      <section className="calendar-print-area min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <span className="sr-only">{title}</span>
        {!ready && <p className="p-4 text-sm">Aguardando carregamento das escalas.</p>}

        <div className="space-y-7 p-2 sm:p-4">
          {dateGroups.map((group, index) => <ShiftTable schedules={schedules} events={events} onDay={(id,date)=>{setSelectedDay({id,date});openManager("day");}} key={group[0].toISOString()} dates={group} title={mode === "month" ? `${monthNames[group[0].getMonth()]} ${group[0].getFullYear()}` : `${index === 0 ? "Semana atual" : "Semana seguinte"} — ${formatShort(group[0])} a ${formatShort(group[group.length - 1])}`} />)}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 px-5 py-3 text-xs font-semibold text-slate-600">
          <div className="flex flex-wrap gap-4">{schedules.filter(row=>row.active).map(row=><span key={row.id} className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-sm" style={{backgroundColor:row.color}} />{row.name}</span>)}<Legend color="bg-slate-600" label="Folga" /></div>
          <div className="calendar-print-hide flex gap-2"><button disabled={!canPrevious} onClick={() => navigate(-1)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-30" aria-label="Período anterior"><ChevronLeft size={20} /></button><button disabled={!canNext} onClick={() => navigate(1)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-30" aria-label="Próximo período"><ChevronRight size={20} /></button></div>
        </div>
      </section>

      </div>
    </div>
  );
}

function formatShort(date: Date) {
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="inline-flex items-center gap-2"><span className={`h-3 w-3 rounded-sm ${color}`} />{label}</span>;
}

function TeamTable({ titles, columns, schedules }: { titles: string[]; columns: TeamPerson[][]; schedules: Schedule[] }) {
  const rows = Math.max(...columns.map(column => column.length));
  return <table className="w-full min-w-[620px] table-fixed border-collapse text-center text-[9px] font-semibold uppercase tracking-wide"><thead><tr>{titles.map(title => <th key={title} className="border-2 border-slate-900 bg-white px-1 py-1.5 font-extrabold text-slate-900">{title}</th>)}</tr></thead><tbody>{Array.from({ length: rows }, (_, index) => <tr key={index}>{columns.map((column, columnIndex) => { const person = column[index]; return person ? <TeamCell key={person.id} name={person.name} shift={schedules.find(row=>row.id===person.shift)?.name ?? person.shift} /> : <td key={columnIndex} className="border border-slate-700 bg-slate-100" />; })}</tr>)}</tbody></table>;
}

function TeamCell({ name, shift }: { name: string; shift: Shift }) {
  return <td className={`border border-slate-700 px-1 py-1.5 text-slate-950 ${shift === "P" ? "bg-lime-400" : shift === "Q" ? "bg-blue-300" : "bg-orange-500"}`}>{name} ({shift})</td>;
}
