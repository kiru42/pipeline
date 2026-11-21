// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Contact } from "@/services/contact.service";
import { ContactForm, type ContactFormState } from "./contact-form";

afterEach(cleanup);

const marie: Contact = {
  id: "1",
  name: "Marie Dupont",
  company: "Acme",
  email: "marie@acme.fr",
  phone: null,
  note: null,
  stage: "nouveau",
  nextFollowUp: null,
  lastContactedAt: null,
};

type Action = (state: ContactFormState, formData: FormData) => Promise<ContactFormState>;

function input(label: string) {
  return screen.getByLabelText(label) as HTMLInputElement | HTMLTextAreaElement;
}

describe("ContactForm", () => {
  it("pré-remplit les champs avec les informations actuelles", () => {
    render(<ContactForm contact={marie} action={vi.fn<Action>(async () => ({}))} />);
    expect(input("Entreprise").value).toBe("Acme");
    expect(input("Email").value).toBe("marie@acme.fr");
    expect(input("Téléphone").value).toBe("");
    expect(input("Note").value).toBe("");
  });

  it("transmet les champs saisis à l'action", async () => {
    const action = vi.fn<Action>(async () => ({}));
    render(<ContactForm contact={marie} action={action} />);
    fireEvent.change(input("Entreprise"), { target: { value: "Globex" } });
    fireEvent.change(input("Téléphone"), { target: { value: "06 12 34 56 78" } });
    fireEvent.change(input("Note"), { target: { value: "À rappeler" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const formData = action.mock.calls[0][1];
    expect(formData.get("company")).toBe("Globex");
    expect(formData.get("email")).toBe("marie@acme.fr");
    expect(formData.get("phone")).toBe("06 12 34 56 78");
    expect(formData.get("note")).toBe("À rappeler");
  });

  it("affiche l'erreur d'email et conserve la saisie", async () => {
    const action = vi.fn<Action>(async (_state, formData) => ({
      errors: { email: "L'email n'est pas valide." },
      values: {
        company: String(formData.get("company")),
        email: String(formData.get("email")),
        phone: String(formData.get("phone")),
        note: String(formData.get("note")),
      },
    }));
    render(<ContactForm contact={marie} action={action} />);
    fireEvent.change(input("Entreprise"), { target: { value: "Globex" } });
    fireEvent.change(input("Email"), { target: { value: "marie@" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe("L'email n'est pas valide.");
    expect(input("Email").getAttribute("aria-invalid")).toBe("true");
    await waitFor(() => expect(input("Email").value).toBe("marie@"));
    expect(input("Entreprise").value).toBe("Globex");
  });
});
