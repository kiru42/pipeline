// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ExampleList } from "./example-list";

afterEach(cleanup);

describe("ExampleList", () => {
  it("affiche un message quand la liste est vide", () => {
    render(<ExampleList items={[]} />);
    expect(screen.getByText("Aucun élément")).toBeDefined();
  });
});
