"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Printer } from "lucide-react";
import { useMemo, useState } from "react";

type ViewMode = "month" | "week";
type Shift = "P" | "Q" | "5X2";

const CYCLE_ANCHOR = new Date(2026, 7, 1, 12);
const START = new Date(2026, 6, 1, 12);
const END = new Date(2028, 7, 31, 12);
const DAY_MS = 86400000;
const weekLetters = ["D", "S", "T", "Q", "Q", "S", "S"];
const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function atNoon(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
}

function addDays(date: Date, amount: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return atNoon(result);
}

function dateOffset(date: Date) {
  return Math.round((atNoon(date).getTime() - CYCLE_ANCHOR.getTime()) / DAY_MS);
}

function positiveModulo(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor;
}

function works(date: Date, shift: Shift) {
  const offset = dateOffset(date);
  if (shift === "P") return positiveModulo(offset + 5, 6) < 4;
  if (shift === "Q") return positiveModulo(offset + 1, 6) < 4;
  return date.getDay() !== 0 && date.getDay() !== 6;
}

function monthDays(date: Date) {
  const total = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return Array.from({ length: total }, (_, index) => new Date(date.getFullYear(), date.getMonth(), index + 1, 12));
}

function weekDays(date: Date) {
  return Array.from({ length: 7 }, (_, index) => addDays(date, index)).filter(day => day <= END);
}

function isoWeekValue(date: Date) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((target.getTime() - yearStart.getTime()) / DAY_MS) + 1) / 7);
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function sundayFromWeek(value: string) {
  const match = /^(\d{4})-W(\d{2})$/.exec(value);
  if (!match) return null;
  const januaryFourth = new Date(Number(match[1]), 0, 4, 12);
  const mondayWeekOne = addDays(januaryFourth, -((januaryFourth.getDay() + 6) % 7));
  return addDays(mondayWeekOne, (Number(match[2]) - 1) * 7 - 1);
}

export function PlantaoCalendar() {
  const now = atNoon(new Date());
  const initialMonth = new Date(now.getFullYear(), now.getMonth(), 1, 12);
  const currentWeekStart = addDays(now, -now.getDay());
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
      if (next >= START && addDays(next, 13) <= END) setCursor(next);
    }
  }

  function selectMode(nextMode: ViewMode) {
    setMode(nextMode);
    if (nextMode === "month") setCursor(initialMonth < START ? START : initialMonth);
    else {
      setCursor(currentWeekStart < START ? START : currentWeekStart);
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
      const selectedWeek = sundayFromWeek(value);
      if (selectedWeek) {
        if (selectedWeek >= START && addDays(selectedWeek, 13) <= END) setCursor(selectedWeek);
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

  const canPrevious = mode === "month" ? cursor > START : addDays(cursor, -14) >= START;
  const canNext = mode === "month" ? new Date(cursor.getFullYear(), cursor.getMonth() + 2, 1, 12) <= END : addDays(cursor, 27) <= END;

  return (
    <div>
      <header className="calendar-print-hide mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600"><CalendarDays size={23} /></span><h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Calendário do plantão</h1></div>
        <div className="flex flex-wrap items-center gap-2"><div className="inline-flex w-fit rounded-xl border border-slate-200 bg-white p-1 shadow-sm"><button onClick={() => selectMode("month")} className={`rounded-lg px-4 py-2 text-sm font-bold transition ${mode === "month" ? "bg-brand-600 text-white" : "text-slate-500 hover:bg-slate-50"}`}>Mensal</button><button onClick={() => selectMode("week")} className={`rounded-lg px-4 py-2 text-sm font-bold transition ${mode === "week" ? "bg-brand-600 text-white" : "text-slate-500 hover:bg-slate-50"}`}>Semanal</button></div><label className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm"><span className="mr-2 text-xs font-bold text-slate-500">Selecionar {mode === "month" ? "mês" : "semana"}</span><input type={mode === "month" ? "month" : "week"} value={mode === "month" ? `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}` : isoWeekValue(addDays(cursor, 1))} min={mode === "month" ? "2026-08" : "2026-W31"} max={mode === "month" ? "2028-07" : "2028-W31"} onChange={event => selectPeriod(event.target.value)} className="bg-transparent text-sm font-semibold text-slate-700 outline-none" /></label><button onClick={printCalendars} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"><Printer size={17} /> Imprimir</button></div>
      </header>

      <div>
      <section className="calendar-team-print mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="border-b border-slate-100 px-3 py-2.5"><h2 className="text-sm font-bold text-slate-900">Colaboradores por equipe</h2></div>
        <div className="overflow-x-auto p-2.5">
          <TeamTable
            titles={["Mec. dia", "Mec. noite", "Ele. dia", "Ele. noite"]}
            columns={[
              [{ name: "Mauricio", shift: "P" }, { name: "Marcos", shift: "Q" }, { name: "Everton", shift: "5X2" }],
              [{ name: "Nelson", shift: "P" }, { name: "Luciano", shift: "Q" }],
              [{ name: "Charles", shift: "P" }, { name: "Cleber", shift: "Q" }],
              [{ name: "Lucas", shift: "P" }, { name: "Wagner", shift: "Q" }],
            ]}
          />
        </div>
      </section>
      <section className="calendar-print-area min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <span className="sr-only">{title}</span>

        <div className="space-y-7 p-2 sm:p-4">
          {dateGroups.map((group, index) => <ShiftTable key={group[0].toISOString()} dates={group} title={mode === "month" ? `${monthNames[group[0].getMonth()]} ${group[0].getFullYear()}` : `${index === 0 ? "Semana atual" : "Semana seguinte"} — ${formatShort(group[0])} a ${formatShort(group[group.length - 1])}`} />)}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 px-5 py-3 text-xs font-semibold text-slate-600">
          <div className="flex flex-wrap gap-4"><Legend color="bg-lime-400" label="Turma P · escala 4×2" /><Legend color="bg-blue-300" label="Turma Q · escala 4×2" /><Legend color="bg-orange-500" label="5X2 · segunda a sexta" /><Legend color="bg-slate-600" label="Folga" /></div>
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

function ShiftTable({ dates, title }: { dates: Date[]; title: string }) {
  const weekdayCells = dates.map(date => <th key={date.toISOString()} className={`whitespace-nowrap border border-slate-400 bg-slate-100 py-1 text-center text-[9px] font-bold sm:text-[10px] xl:text-xs ${date.getDay() === 0 || date.getDay() === 6 ? "text-red-600" : "text-slate-800"}`}>{weekLetters[date.getDay()]}</th>);
  const dateCells = dates.map(date => <th key={date.toISOString()} className="whitespace-nowrap border border-slate-500 bg-blue-950 px-0 py-1 text-center text-[8px] font-bold tracking-tighter text-white sm:text-[9px] xl:text-[10px]">{String(date.getDate()).padStart(2, "0")}/{String(date.getMonth() + 1).padStart(2, "0")}</th>);
  const shiftCells = (shift: Shift) => dates.map(date => { const active = works(date, shift); return <td key={date.toISOString()} className={`h-7 whitespace-nowrap border border-slate-500 p-0 text-center text-[9px] font-bold xl:text-[10px] ${active ? shift === "P" ? "bg-lime-400 text-slate-900" : shift === "Q" ? "bg-blue-300 text-slate-900" : "bg-orange-500 text-slate-950" : "bg-slate-600 text-transparent"}`}>{active ? shift : "-"}</td>; });

  return <div className="w-full overflow-hidden"><table className="w-full table-fixed border-collapse"><thead><tr><th colSpan={dates.length} className="h-6 border-2 border-slate-900 bg-white p-0 text-center text-xs font-extrabold uppercase leading-none text-slate-950 sm:text-sm">{title}</th></tr><tr>{weekdayCells}</tr><tr>{dateCells}</tr></thead><tbody>{(["P", "Q", "5X2"] as Shift[]).map(shift => <tr key={shift}>{shiftCells(shift)}</tr>)}</tbody></table></div>;
}

function TeamTable({ titles, columns }: { titles: string[]; columns: { name: string; shift: Shift }[][] }) {
  const rows = Math.max(...columns.map(column => column.length));
  return <table className="w-full min-w-[620px] table-fixed border-collapse text-center text-[9px] font-semibold uppercase tracking-wide"><thead><tr>{titles.map(title => <th key={title} className="border-2 border-slate-900 bg-white px-1 py-1.5 font-extrabold text-slate-900">{title}</th>)}</tr></thead><tbody>{Array.from({ length: rows }, (_, index) => <tr key={index}>{columns.map((column, columnIndex) => { const person = column[index]; return person ? <TeamCell key={person.name} name={person.name} shift={person.shift} /> : <td key={columnIndex} className="border border-slate-700 bg-slate-100" />; })}</tr>)}</tbody></table>;
}

function TeamCell({ name, shift }: { name: string; shift: Shift }) {
  return <td className={`border border-slate-700 px-1 py-1.5 text-slate-950 ${shift === "P" ? "bg-lime-400" : shift === "Q" ? "bg-blue-300" : "bg-orange-500"}`}>{name} ({shift})</td>;
}
