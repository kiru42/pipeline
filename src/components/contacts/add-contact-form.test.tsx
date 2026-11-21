// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AddContactForm, type AddContactState } from "./add-contact-form";

afterEach(cleanup);

function submit(name: string) {
  fireEvent.change(screen.getByLabelText("Nom"), { target: { value: name } });
  fireEvent.click(screen.getByRole("button", { name: "Ajouter" }));
}

describe("AddContactForm", () => {
  it("transmet le nom saisi à l'action", async () => {
    const action =
      vi.fn<(state: AddContactState, formData: FormData) => Promise<AddContactState>>(
        async () => ({}),
      );
    render(<AddContactForm action={action} />);
    submit("Marie Dupont");
    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const formData = action.mock.calls[0][1];
    expect(formData.get("name")).toBe("Marie Dupont");
  });

  it("affiche le message d'erreur renvoyé par l'action", async () => {
    const action = async (): Promise<AddContactState> => ({
      error: "Le nom est obligatoire.",
    });
    render(<AddContactForm action={action} />);
    submit("   ");
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe("Le nom est obligatoire.");
  });
});
