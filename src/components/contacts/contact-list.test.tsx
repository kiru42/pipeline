// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ContactList } from "./contact-list";

afterEach(cleanup);

describe("ContactList", () => {
  it("affiche un message quand aucun contact n'existe", () => {
    render(<ContactList contacts={[]} />);
    expect(screen.getByText("Aucun contact pour l'instant.")).toBeDefined();
  });

  it("affiche le nom de chaque contact", () => {
    render(<ContactList contacts={[{ id: "1", name: "Marie Dupont" }]} />);
    expect(screen.getByText("Marie Dupont")).toBeDefined();
    expect(screen.queryByText("Aucun contact pour l'instant.")).toBeNull();
  });
});
