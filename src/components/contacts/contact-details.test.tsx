// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { Contact } from "@/services/contact.service";
import { ContactDetails } from "./contact-details";

afterEach(cleanup);

const marie: Contact = {
  id: "1",
  name: "Marie Dupont",
  company: "Acme",
  email: "marie@acme.fr",
  phone: "06 12 34 56 78",
  note: "Rencontrée au salon",
  stage: "premier-contact",
  nextFollowUp: null,
  lastContactedAt: null,
};

describe("ContactDetails (en-tête de la fiche)", () => {
  it("affiche les initiales, le nom et l'entreprise du contact", () => {
    render(<ContactDetails contact={marie} />);
    expect(screen.getByRole("heading", { level: 1, name: "Marie Dupont" })).toBeDefined();
    expect(screen.getByText("MD")).toBeDefined();
    expect(screen.getByText("Acme")).toBeDefined();
  });

  it("affiche l'étape du contact avec son badge coloré", () => {
    render(<ContactDetails contact={{ ...marie, stage: "negociation" }} />);
    expect(screen.getByText("Négociation").className).toContain("bg-stage-negociation");
    expect(screen.queryByText("Clos")).toBeNull();
  });

  it.each([
    ["signe", "Signé"],
    ["perdu", "Perdu"],
  ] as const)("présente un contact « %s » comme clos", (stage, label) => {
    render(<ContactDetails contact={{ ...marie, stage }} />);
    expect(screen.getByText(label)).toBeDefined();
    expect(screen.getByText("Clos")).toBeDefined();
  });

  it("indique la date de la prochaine relance", () => {
    render(<ContactDetails contact={{ ...marie, nextFollowUp: "2026-11-25" }} />);
    expect(screen.getByText("Relance le 25/11")).toBeDefined();
  });

  it("n'affiche aucune date de relance quand il n'y en a pas", () => {
    render(<ContactDetails contact={marie} />);
    expect(screen.queryByText(/Relance le/)).toBeNull();
    expect(screen.getByText("Aucune relance planifiée")).toBeDefined();
  });

  it("affiche la date du dernier contact", () => {
    render(<ContactDetails contact={{ ...marie, lastContactedAt: "2026-11-21" }} />);
    expect(screen.getByText("Dernier contact le 21/11")).toBeDefined();
  });

  it("n'affiche pas de dernier contact quand aucune relance n'a été traitée", () => {
    render(<ContactDetails contact={marie} />);
    expect(screen.queryByText(/Dernier contact/)).toBeNull();
  });
});
