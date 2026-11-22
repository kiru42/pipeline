/** Initiales d'un nom (deux au plus), pour les avatars : « Camille Durand » → « CD ». */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join("");
}
