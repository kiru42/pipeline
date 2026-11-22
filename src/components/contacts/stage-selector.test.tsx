// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StageSelector, type StageSelectorState } from "./stage-selector";

afterEach(cleanup);

type Action = (state: StageSelectorState, stage: string) => Promise<StageSelectorState>;

describe("StageSelector", () => {
  it("ne propose que les étapes permises par le service, et affiche l'étape actuelle", () => {
    render(
      <StageSelector
        stage="echange"
        allowed={["proposition", "perdu"]}
        action={vi.fn<Action>(async () => ({}))}
      />,
    );
    expect(screen.getByText("Étape actuelle : Échange")).toBeDefined();
    expect(screen.getAllByRole("button").map((button) => button.textContent)).toEqual([
      "Proposition",
      "Perdu",
    ]);
  });

  it("transmet l'étape choisie à l'action", async () => {
    const action = vi.fn<Action>(async () => ({}));
    render(<StageSelector stage="echange" allowed={["proposition", "perdu"]} action={action} />);
    fireEvent.click(screen.getByRole("button", { name: "Proposition" }));
    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    expect(action.mock.calls[0][1]).toBe("proposition");
  });

  it("affiche l'erreur renvoyée par l'action", async () => {
    const action = vi.fn<Action>(async () => ({ error: "Contact introuvable." }));
    render(<StageSelector stage="echange" allowed={["proposition", "perdu"]} action={action} />);
    fireEvent.click(screen.getByRole("button", { name: "Perdu" }));
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe("Contact introuvable.");
  });

  it("n'affiche aucun bouton quand aucune étape n'est permise (contact clos)", () => {
    render(<StageSelector stage="signe" allowed={[]} action={vi.fn<Action>(async () => ({}))} />);
    expect(screen.queryAllByRole("button")).toEqual([]);
    expect(screen.getByText("Cette étape est définitive.")).toBeDefined();
  });
});
