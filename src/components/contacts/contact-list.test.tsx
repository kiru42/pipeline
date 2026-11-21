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
});
