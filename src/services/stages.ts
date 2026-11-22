import type { Stage } from "@/data/contact.repository";

export type { Stage };

export type StageInfo = { id: Stage; label: string; closed: boolean };

/** Étapes fixes du pipeline, dans l'ordre. « Signé » et « Perdu » sont closes. */
export const STAGES: readonly StageInfo[] = [
  { id: "premier-contact", label: "Premier contact", closed: false },
  { id: "echange", label: "Échange", closed: false },
  { id: "proposition", label: "Proposition", closed: false },
  { id: "negociation", label: "Négociation", closed: false },
  { id: "signe", label: "Signé", closed: true },
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

/**
 * Étapes vers lesquelles un contact peut passer : l'étape suivante, ou « Perdu ».
 * Aucun retour en arrière ; un contact clos (« Signé », « Perdu ») ne change plus d'étape.
 */
export function allowedNextStages(id: Stage): Stage[] {
  if (isClosedStage(id)) return [];
  // La dernière étape ouverte (« Négociation ») est suivie de « Signé » : `next` existe toujours ici.
  const next = STAGES[STAGES.findIndex((stage) => stage.id === id) + 1];
  return [next.id, "perdu"];
}
