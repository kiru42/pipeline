import type { Stage } from "@/data/contact.repository";

export type { Stage };

export type StageInfo = { id: Stage; label: string; closed: boolean };

/** Étapes fixes du pipeline, dans l'ordre. « Gagné » et « Perdu » sont closes. */
export const STAGES: readonly StageInfo[] = [
  { id: "nouveau", label: "Nouveau", closed: false },
  { id: "contacte", label: "Contacté", closed: false },
  { id: "rendez-vous", label: "Rendez-vous", closed: false },
  { id: "proposition", label: "Proposition", closed: false },
  { id: "gagne", label: "Gagné", closed: true },
  { id: "perdu", label: "Perdu", closed: true },
];

export function isStage(value: string): value is Stage {
  return STAGES.some((stage) => stage.id === value);
}

export function getStage(id: Stage): StageInfo {
  const stage = STAGES.find((candidate) => candidate.id === id);
  if (!stage) throw new Error(`Étape inconnue : ${id}`);
  return stage;
}

export function isClosedStage(id: Stage): boolean {
  return getStage(id).closed;
}
