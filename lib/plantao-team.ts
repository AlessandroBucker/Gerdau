export type Shift = "P" | "Q" | "5X2";
export const teamTitles = ["Mec. dia", "Mec. noite", "Ele. dia", "Ele. noite"] as const;
export type TeamPerson = { id: string; name: string; shift: Shift; team: number; active: boolean };
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
    ["P", "Q", "5X2"].includes(person.shift) && Number.isInteger(person.team) && person.team >= 0 && person.team < 4 &&
    typeof person.active === "boolean") && new Set(value.map(person => person.id)).size === value.length;
}
