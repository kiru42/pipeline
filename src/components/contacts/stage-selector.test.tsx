// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StageSelector, type StageSelectorState } from "./stage-selector";

afterEach(cleanup);

type Action = (state: StageSelectorState, stage: string) => Promise<StageSelectorState>;

describe("StageSelector", () => {
  it("propose toutes les étapes et signale l'étape actuelle", () => {
    render(<StageSelector stage="contacte" action={vi.fn<Action>(async () => ({}))} />);
    for (const label of ["Nouveau", "Contacté", "Rendez-vous", "Proposition", "Gagné", "Perdu"]) {
      expect(screen.getByRole("button", { name: label })).toBeDefined();
    }
    expect(
      screen.getByRole("button", { name: "Contacté" }).getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      screen.getByRole("button", { name: "Rendez-vous" }).getAttribute("aria-pressed"),
    ).toBe("false");
  });

  it("transmet l'étape choisie à l'action", async () => {
    const action = vi.fn<Action>(async () => ({}));
    render(<StageSelector stage="contacte" action={action} />);
    fireEvent.click(screen.getByRole("button", { name: "Rendez-vous" }));
    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    expect(action.mock.calls[0][1]).toBe("rendez-vous");
  });

  it("affiche l'erreur renvoyée par l'action", async () => {
    const action = vi.fn<Action>(async () => ({ error: "Contact introuvable." }));
    render(<StageSelector stage="contacte" action={action} />);
    fireEvent.click(screen.getByRole("button", { name: "Proposition" }));
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe("Contact introuvable.");
  });
});
