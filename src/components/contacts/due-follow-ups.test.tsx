// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { Contact } from "@/services/contact.service";
import type { CompleteFollowUpState } from "./complete-follow-up-form";
import { DueFollowUps as DueFollowUpsView } from "./due-follow-ups";

afterEach(cleanup);

function contact(id: string, name: string, nextFollowUp: string): Contact {
  return {
    id,
    name,
    company: null,
    email: null,
    phone: null,
    note: null,
    stage: "echange",
    nextFollowUp,
    lastContactedAt: null,
  };
}

const marie = contact("1", "Marie Dupont", "2026-11-21");
const alain = contact("2", "Alain Martin", "2026-11-20");

type Complete = (
  id: string,
  state: CompleteFollowUpState,
  formData: FormData,
) => Promise<CompleteFollowUpState>;

const noop = vi.fn<Complete>(async () => ({}));

function DueFollowUps(props: Omit<Parameters<typeof DueFollowUpsView>[0], "complete">) {
  return <DueFollowUpsView complete={noop} {...props} />;
}

function item(name: string) {
  return screen.getByText(name).closest("li") as HTMLElement;
}

describe("DueFollowUps", () => {
  it("affiche la section « Relances du jour » avec chaque contact dû", () => {
    render(
      <DueFollowUps
        followUps={[
          { contact: marie, overdue: false },
          { contact: alain, overdue: true },
        ]}
      />,
    );
    expect(screen.getByRole("heading", { name: "Relances du jour" })).toBeDefined();
    const items = screen.getAllByRole("listitem");
    expect(items.map((li) => within(li).getByRole("link").textContent)).toEqual([
      "Marie Dupont",
      "Alain Martin",
    ]);
  });

  it("met chaque relance en évidence avec le token highlight", () => {
    render(<DueFollowUps followUps={[{ contact: marie, overdue: false }]} />);
    expect(item("Marie Dupont").className).toContain("bg-highlight");
    expect(item("Marie Dupont").className).toContain("text-highlight-foreground");
  });

  it("marque « en retard » une relance dépassée, et seulement elle", () => {
    render(
      <DueFollowUps
        followUps={[
          { contact: marie, overdue: false },
          { contact: alain, overdue: true },
        ]}
      />,
    );
    expect(within(item("Alain Martin")).getByText("en retard")).toBeDefined();
    expect(within(item("Alain Martin")).getByText("prévue le 20/11")).toBeDefined();
    expect(within(item("Marie Dupont")).queryByText("en retard")).toBeNull();
  });

  it("propose un lien vers la fiche du contact", () => {
    render(<DueFollowUps followUps={[{ contact: marie, overdue: false }]} />);
    expect(screen.getByRole("link", { name: "Marie Dupont" }).getAttribute("href")).toBe(
      "/contacts/1",
    );
  });

  it("indique qu'il n'y a rien à faire quand aucune relance n'est due", () => {
    render(<DueFollowUps followUps={[]} />);
    expect(screen.getByText("Rien à faire aujourd'hui.")).toBeDefined();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  it("marque une relance comme faite avec une nouvelle date", async () => {
    const complete = vi.fn<Complete>(async () => ({}));
    render(
      <DueFollowUpsView
        followUps={[
          { contact: marie, overdue: false },
          { contact: alain, overdue: true },
        ]}
        complete={complete}
      />,
    );
    const row = item("Alain Martin");
    fireEvent.change(within(row).getByLabelText("Nouvelle relance"), {
      target: { value: "2026-11-28" },
    });
    fireEvent.click(within(row).getByRole("button", { name: "Fait" }));
    await waitFor(() => expect(complete).toHaveBeenCalledTimes(1));
    const [id, , formData] = complete.mock.calls[0];
    expect(id).toBe("2");
    expect(formData.get("nextDate")).toBe("2026-11-28");
  });

  it("marque une relance comme faite sans nouvelle date", async () => {
    const complete = vi.fn<Complete>(async () => ({}));
    render(<DueFollowUpsView followUps={[{ contact: marie, overdue: false }]} complete={complete} />);
    fireEvent.click(screen.getByRole("button", { name: "Fait" }));
    await waitFor(() => expect(complete).toHaveBeenCalledTimes(1));
    expect(complete.mock.calls[0][2].get("nextDate")).toBe("");
  });

  it("affiche le refus renvoyé par l'action", async () => {
    const complete = vi.fn<Complete>(async () => ({
      error: "La nouvelle relance doit être postérieure à aujourd'hui.",
    }));
    render(<DueFollowUpsView followUps={[{ contact: marie, overdue: false }]} complete={complete} />);
    fireEvent.click(screen.getByRole("button", { name: "Fait" }));
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe("La nouvelle relance doit être postérieure à aujourd'hui.");
  });
});
