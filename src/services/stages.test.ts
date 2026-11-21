import { describe, expect, it } from "vitest";
import { STAGES, getStage, isClosedStage } from "./stages";

describe("étapes du pipeline", () => {
  it("sont fixes et ordonnées : Nouveau → Contacté → Rendez-vous → Proposition → Gagné / Perdu", () => {
    expect(STAGES.map((stage) => stage.label)).toEqual([
      "Nouveau",
      "Contacté",
      "Rendez-vous",
      "Proposition",
      "Gagné",
      "Perdu",
    ]);
  });

  it.each(["gagne", "perdu"] as const)("considère « %s » comme close", (stage) => {
    expect(isClosedStage(stage)).toBe(true);
    expect(getStage(stage).closed).toBe(true);
  });

  it.each(["nouveau", "contacte", "rendez-vous", "proposition"] as const)(
    "considère « %s » comme ouverte",
    (stage) => {
      expect(isClosedStage(stage)).toBe(false);
    },
  );

  it("renvoie le libellé d'une étape", () => {
    expect(getStage("rendez-vous").label).toBe("Rendez-vous");
  });
});
