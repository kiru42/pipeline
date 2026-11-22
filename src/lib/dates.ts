/** Affiche une date AAAA-MM-JJ au format JJ/MM. */
export function formatDay(day: string): string {
  const [, month, date] = day.split("-");
  return `${date}/${month}`;
}

/** Affiche une échéance en jours (0 aujourd'hui, négatif en retard) : « demain », « dans 7 j »… */
export function formatDueIn(days: number): string {
  if (days === 0) return "aujourd'hui";
  if (days === 1) return "demain";
  if (days > 1) return `dans ${days} j`;
  return `en retard de ${-days} j`;
}
