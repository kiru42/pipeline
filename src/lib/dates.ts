/** Affiche une date AAAA-MM-JJ au format JJ/MM. */
export function formatDay(day: string): string {
  const [, month, date] = day.split("-");
  return `${date}/${month}`;
}
