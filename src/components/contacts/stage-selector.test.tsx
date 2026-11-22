// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StageSelector, type StageSelectorState } from "./stage-selector";

afterEach(cleanup);

type Action = (state: StageSelectorState, stage: string) => Promise<StageSelectorState>;

function isDisabled(button: HTMLElement) {
  return (
    (button as HTMLButtonElement).disabled ||
    button.getAttribute("aria-disabled") === "true" ||
    button.hasAttribute("data-disabled")
  );
}

function buttons() {
  return screen.getAllByRole("button");
}

describe("StageSelector", () => {
  it("montre les six étapes dans l'ordre, dans un ToggleGroup, avec l'étape actuelle cochée", () => {
    render(
      <StageSelector
        stage="echange"
        allowed={["proposition", "perdu"]}
        action={vi.fn<Action>(async () => ({}))}
      />,
    );
    expect(buttons().map((button) => button.textContent)).toEqual([
      "Premier contact",
      "Échange",
      "Proposition",
      "Négociation",
      "Signé",
      "Perdu",
    ]);
    expect(buttons()[0].closest("[data-slot=toggle-group]")).not.toBeNull();
    expect(buttons().map((button) => button.getAttribute("aria-pressed"))).toEqual([
      "false",
      "true",
      "false",
      "false",
      "false",
      "false",
    ]);
  });

  it("n'active que les étapes permises par le service", () => {
    render(
      <StageSelector
        stage="echange"
        allowed={["proposition", "perdu"]}
        action={vi.fn<Action>(async () => ({}))}
      />,
    );
    const enabled = buttons()
      .filter((button) => !isDisabled(button))
      .map((button) => button.textContent);
    expect(enabled).toEqual(["Proposition", "Perdu"]);
  });

  it("rappelle que Signé et Perdu closent le contact", () => {
    render(<StageSelector stage="echange" allowed={["proposition", "perdu"]} action={vi.fn<Action>()} />);
    expect(screen.getByText("Signé et Perdu closent le contact : il sort des relances.")).toBeDefined();
  });

  it("transmet l'étape choisie à l'action", async () => {
    const action = vi.fn<Action>(async () => ({}));
    render(<StageSelector stage="echange" allowed={["proposition", "perdu"]} action={action} />);
    fireEvent.click(screen.getByRole("button", { name: "Proposition" }));
    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    expect(action.mock.calls[0][1]).toBe("proposition");
  });

  it("affiche l'erreur renvoyée par l'action dans une Alert", async () => {
    const action = vi.fn<Action>(async () => ({ error: "Contact introuvable." }));
    render(<StageSelector stage="echange" allowed={["proposition", "perdu"]} action={action} />);
    fireEvent.click(screen.getByRole("button", { name: "Perdu" }));
    const alert = await screen.findByRole("alert");
    expect(alert.getAttribute("data-slot")).toBe("alert");
    expect(alert.textContent).toBe("Contact introuvable.");
  });

  it("désactive toutes les étapes d'un contact clos et l'indique", () => {
    render(<StageSelector stage="signe" allowed={[]} action={vi.fn<Action>(async () => ({}))} />);
    expect(buttons().every(isDisabled)).toBe(true);
    expect(screen.getByText("Cette étape est définitive.")).toBeDefined();
  });
});
