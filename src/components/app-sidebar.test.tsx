// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";

const navigation = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => navigation.pathname }));

beforeAll(() => {
  // jsdom n'implémente pas matchMedia, utilisé par la barre latérale pour détecter le mobile.
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
});

afterEach(cleanup);

function renderAt(pathname: string) {
  navigation.pathname = pathname;
  render(
    <SidebarProvider>
      <AppSidebar />
    </SidebarProvider>,
  );
}

function current() {
  return screen
    .getAllByRole("link")
    .filter((link) => link.getAttribute("aria-current") === "page")
    .map((link) => link.textContent);
}

describe("AppSidebar", () => {
  it("donne accès à Aujourd'hui, Contacts et Pipeline", () => {
    renderAt("/");
    expect(
      ["Aujourd'hui", "Contacts", "Pipeline"].map((name) =>
        screen.getByRole("link", { name }).getAttribute("href"),
      ),
    ).toEqual(["/", "/contacts", "/pipeline"]);
  });

  it.each([
    ["/", "Aujourd'hui"],
    ["/contacts", "Contacts"],
    ["/contacts/42", "Contacts"],
    ["/pipeline", "Pipeline"],
  ])("met en évidence l'entrée de la page courante (%s)", (pathname, label) => {
    renderAt(pathname);
    expect(current()).toEqual([label]);
  });
});
