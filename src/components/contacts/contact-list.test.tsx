// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { Contact } from "@/services/contact.service";
import { ContactList } from "./contact-list";

afterEach(cleanup);

const marie: Contact = {
  id: "1",
  name: "Marie Dupont",
  company: "Acme",
  email: null,
  phone: null,
  note: null,
  stage: "premier-contact",
  nextFollowUp: null,
  lastContactedAt: null,
};

describe("ContactList", () => {
  it("affiche un message quand aucun contact n'existe", () => {
    render(<ContactList contacts={[]} />);
    expect(screen.getByText("Aucun contact pour l'instant.")).toBeDefined();
  });

  it("affiche le nom de chaque contact", () => {
    render(<ContactList contacts={[marie]} />);
    expect(screen.getByText("Marie Dupont")).toBeDefined();
    expect(screen.queryByText("Aucun contact pour l'instant.")).toBeNull();
  });

  it("propose un lien vers la fiche de chaque contact", () => {
    render(<ContactList contacts={[marie]} />);
    const link = screen.getByRole("link", { name: /Marie Dupont/ });
    expect(link.getAttribute("href")).toBe("/contacts/1");
  });

  it("affiche l'entreprise du contact", () => {
    render(<ContactList contacts={[marie]} />);
    expect(screen.getByText("Acme")).toBeDefined();
  });

  it("affiche l'étape de chaque contact", () => {
    render(
      <ContactList
        contacts={[marie, { ...marie, id: "2", name: "Alain Martin", stage: "negociation" }]}
      />,
    );
    expect(screen.getByRole("link", { name: /Marie Dupont/ }).textContent).toContain("Premier contact");
    expect(screen.getByRole("link", { name: /Alain Martin/ }).textContent).toContain(
      "Négociation",
    );
  });

  it("affiche la date de relance des contacts qui en ont une", () => {
    render(
      <ContactList
        contacts={[marie, { ...marie, id: "2", name: "Alain Martin", nextFollowUp: "2026-11-25" }]}
      />,
    );
    expect(screen.getByRole("link", { name: /Alain Martin/ }).textContent).toContain(
      "Relance le 25/11",
    );
    expect(screen.getByRole("link", { name: /Marie Dupont/ }).textContent).not.toContain(
      "Relance",
    );
  });

  it("indique le nombre de contacts dans le titre", () => {
    render(<ContactList contacts={[marie, { ...marie, id: "2", name: "Alain Martin" }]} />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Contacts 2");
  });

  it("présente chaque contact comme une ligne Item, avec le badge coloré de son étape", () => {
    render(<ContactList contacts={[{ ...marie, stage: "negociation" }]} />);
    const link = screen.getByRole("link", { name: /Marie Dupont/ });
    expect(link.getAttribute("data-slot")).toBe("item");
    expect(screen.getByText("Négociation").className).toContain("bg-stage-negociation");
  });
});
