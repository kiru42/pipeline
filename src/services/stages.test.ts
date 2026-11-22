import { describe, expect, it } from "vitest";
import { STAGES, allowedNextStages, getStage, isClosedStage } from "./stages";

describe("étapes du pipeline", () => {
  it("sont fixes et ordonnées : Premier contact → Échange → Proposition → Négociation → Signé / Perdu", () => {
    expect(STAGES.map((stage) => stage.label)).toEqual([
      "Premier contact",
      "Échange",
      "Proposition",
      "Négociation",
      "Signé",
      "Perdu",
    ]);
  });

  it.each(["signe", "perdu"] as const)("considère « %s » comme close", (stage) => {
    expect(isClosedStage(stage)).toBe(true);
    expect(getStage(stage).closed).toBe(true);
  });

  it.each(["premier-contact", "echange", "proposition", "negociation"] as const)(
    "considère « %s » comme ouverte",
    (stage) => {
      expect(isClosedStage(stage)).toBe(false);
    },
  );

  it("renvoie le libellé d'une étape", () => {
    expect(getStage("negociation").label).toBe("Négociation");
  });
});

describe("allowedNextStages", () => {
  it.each([
    ["premier-contact", ["echange", "perdu"]],
    ["echange", ["proposition", "perdu"]],
    ["proposition", ["negociation", "perdu"]],
    ["negociation", ["signe", "perdu"]],
  ] as const)("propose pour « %s » l'étape suivante et « Perdu »", (stage, expected) => {
    expect(allowedNextStages(stage)).toEqual(expected);
  });

  it.each(["signe", "perdu"] as const)("ne propose rien pour l'étape close « %s »", (stage) => {
    expect(allowedNextStages(stage)).toEqual([]);
  });
});
