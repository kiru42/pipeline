// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { STAGES } from "@/services/stages";
import { StageBadge } from "./stage-badge";

afterEach(cleanup);

describe("StageBadge", () => {
  it.each(STAGES.map((stage) => [stage.id, stage.label]))(
    "affiche « %s » avec le libellé et les couleurs de son étape",
    (id, label) => {
      render(<StageBadge stage={id} />);
      const badge = screen.getByText(label);
      expect(badge.getAttribute("data-slot")).toBe("badge");
      expect(badge.className).toContain(`bg-stage-${id}`);
      expect(badge.className).toContain(`text-stage-${id}-foreground`);
      expect(badge.className).not.toContain("bg-primary");
    },
  );
});
