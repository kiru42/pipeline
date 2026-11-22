// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Contact } from "@/services/contact.service";
import { ContactCoordinates } from "./contact-coordinates";
import type { ContactFormState } from "./contact-form";

afterEach(cleanup);

const marie: Contact = {
  id: "1",
  name: "Marie Dupont",
  company: "Acme",
  email: "marie@acme.fr",
  phone: null,
  note: "Rencontrée au salon",
  stage: "premier-contact",
  nextFollowUp: null,
  lastContactedAt: null,
};

type Action = (state: ContactFormState, formData: FormData) => Promise<ContactFormState>;

function valueOf(label: string) {
  const term = screen.getByText(label, { selector: "dt" });
  return term.nextElementSibling?.textContent;
}

describe("ContactCoordinates", () => {
  it("affiche les coordonnées en lecture seule dans une carte « Coordonnées »", () => {
    render(<ContactCoordinates contact={marie} action={vi.fn<Action>()} />);
    expect(screen.getByRole("heading", { name: "Coordonnées" })).toBeDefined();
    expect(valueOf("Entreprise")).toBe("Acme");
    expect(valueOf("Email")).toBe("marie@acme.fr");
    expect(valueOf("Téléphone")).toBe("Non renseigné");
    expect(valueOf("Note")).toBe("Rencontrée au salon");
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("ouvre le formulaire au clic sur « Modifier », et le referme sur « Annuler »", () => {
    render(<ContactCoordinates contact={marie} action={vi.fn<Action>()} />);
    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
    expect((screen.getByLabelText("Entreprise") as HTMLInputElement).value).toBe("Acme");
    expect(screen.queryByRole("button", { name: "Modifier" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(valueOf("Entreprise")).toBe("Acme");
  });

  it("referme le formulaire après un enregistrement réussi", async () => {
    const action = vi.fn<Action>(async () => ({}));
    render(<ContactCoordinates contact={marie} action={action} />);
    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByRole("textbox")).toBeNull());
  });

  it("garde le formulaire ouvert avec l'erreur quand l'enregistrement est refusé", async () => {
    const action = vi.fn<Action>(async () => ({ errors: { email: "L'email n'est pas valide." } }));
    render(<ContactCoordinates contact={marie} action={action} />);
    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    const error = await screen.findByRole("alert");
    expect(error.textContent).toBe("L'email n'est pas valide.");
    expect(screen.getByLabelText("Email")).toBeDefined();
  });
});
