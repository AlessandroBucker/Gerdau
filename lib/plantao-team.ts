export type Shift = string;
export const teamTitles = ["Mec. dia", "Mec. noite", "Ele. dia", "Ele. noite"] as const;
export type TeamPerson = { id: string; name: string; shift: Shift; team: number; active: boolean; position?: number };
export function sortTeam(people: TeamPerson[]) {
  return [...people].sort((a,b)=>a.team-b.team || (a.position ?? 0)-(b.position ?? 0) || a.id.localeCompare(b.id));
}
export function moveTeamPerson(people: TeamPerson[], id: string, direction: -1 | 1) {
  const person=people.find(item=>item.id===id);
  if(!person) return people;
  const team=sortTeam(people.filter(item=>item.team===person.team)).map((item,position)=>({...item,position}));
  const visible=team.filter(item=>item.active===person.active);
  const index=visible.findIndex(item=>item.id===id), other=visible[index+direction];
  if(!other) return people;
  const current=visible[index], position=current.position;
  current.position=other.position;other.position=position;
  return sortTeam(people.map(item=>team.find(row=>row.id===item.id)??item));
}
export const initialTeam: TeamPerson[] = [
  { id: "mauricio", name: "Mauricio", shift: "P", team: 0, active: true },
  { id: "marcos", name: "Marcos", shift: "Q", team: 0, active: true },
  { id: "everton", name: "Everton", shift: "5X2", team: 0, active: true },
  { id: "nelson", name: "Nelson", shift: "P", team: 1, active: true },
  { id: "luciano", name: "Luciano", shift: "Q", team: 1, active: true },
  { id: "charles", name: "Charles", shift: "P", team: 2, active: true },
  { id: "cleber", name: "Cleber", shift: "Q", team: 2, active: true },
  { id: "lucas", name: "Lucas", shift: "P", team: 3, active: true },
  { id: "wagner", name: "Wagner", shift: "Q", team: 3, active: true },
];
export function isTeam(value: unknown): value is TeamPerson[] {
  return Array.isArray(value) && value.every(person => person && typeof person.id === "string" &&
    typeof person.name === "string" && person.name.trim().length > 0 && person.name.length <= 100 &&
    typeof person.shift === "string" && /^[\w-]{1,100}$/.test(person.shift) && Number.isInteger(person.team) && person.team >= 0 && person.team < 4 &&
    typeof person.active === "boolean" && (person.position === undefined || (Number.isInteger(person.position) && person.position >= 0 && person.position <= 1000000))) && new Set(value.map(person => person.id)).size === value.length;
}
