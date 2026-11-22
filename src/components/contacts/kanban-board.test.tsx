// @vitest-environment jsdom
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, within } from "@testing-library/react";
import type { DragEndEvent } from "@dnd-kit/core";
import type { Contact, Pipeline } from "@/services/contact.service";
import { STAGES, type Stage } from "@/services/stages";
import { KanbanBoard } from "./kanban-board";
import type { StageSelectorState } from "./stage-selector";

// Le glisser-déposer réel dépend de positions que jsdom ne calcule pas : on garde le vrai
// DndContext, mais on capture son gestionnaire de dépôt pour le déclencher directement.
const dnd = vi.hoisted(() => ({ onDragEnd: undefined as ((event: DragEndEvent) => void) | undefined }));

vi.mock("@dnd-kit/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@dnd-kit/core")>();
  function DndContext(props: ComponentProps<typeof actual.DndContext>) {
    dnd.onDragEnd = props.onDragEnd;
    return <actual.DndContext {...props} />;
  }
  return { ...actual, DndContext };
});

afterEach(cleanup);

type Move = (id: string, state: StageSelectorState, stage: string) => Promise<StageSelectorState>;

function contact(id: string, name: string, stage: Stage, company: string | null = null): Contact {
  return {
    id,
    name,
    company,
    email: null,
    phone: null,
    note: null,
    stage,
    nextFollowUp: null,
    lastContactedAt: null,
  };
}

function pipeline(cards: { contact: Contact; followUpInDays?: number | null }[]): Pipeline {
  const columns = STAGES.map((stage) => {
    const inColumn = cards
      .filter((card) => card.contact.stage === stage.id)
      .map((card) => ({ contact: card.contact, followUpInDays: card.followUpInDays ?? null }));
    return { stage, cards: inColumn, count: inColumn.length };
  });
  const inProgress = cards.filter((card) => !["signe", "perdu"].includes(card.contact.stage)).length;
  return { columns, inProgress };
}

const sam = contact("2", "Sam Durand", "echange", "Durand & Fils");
const john = contact("3", "John", "proposition", "ATOS");
const mike = contact("4", "Mike", "signe");

function column(label: string) {
  return screen.getByRole("region", { name: label });
}

function drop(contactId: string, stage: string | null) {
  act(() => {
    dnd.onDragEnd!({
      active: { id: contactId },
      over: stage === null ? null : { id: stage },
    } as unknown as DragEndEvent);
  });
}

describe("KanbanBoard", () => {
  it("affiche les six colonnes dans l'ordre du pipeline, avec leur nombre de contacts", () => {
    render(<KanbanBoard pipeline={pipeline([{ contact: sam }, { contact: john }, { contact: mike }])} move={vi.fn<Move>()} />);
    expect(screen.getAllByRole("region").map((region) => region.getAttribute("aria-label"))).toEqual([
      "Premier contact",
      "Échange",
      "Proposition",
      "Négociation",
      "Signé",
      "Perdu",
    ]);
    expect(within(column("Échange")).getByText("1 contact")).toBeDefined();
    expect(within(column("Négociation")).getByText("0 contact")).toBeDefined();
  });

  it("range chaque contact dans la colonne de son étape", () => {
    render(<KanbanBoard pipeline={pipeline([{ contact: sam }, { contact: john }])} move={vi.fn<Move>()} />);
    expect(within(column("Échange")).getByText("Sam Durand")).toBeDefined();
    expect(within(column("Échange")).getByText("Durand & Fils")).toBeDefined();
    expect(within(column("Proposition")).getByText("John")).toBeDefined();
  });

  it("indique dans l'en-tête le nombre de contacts en cours", () => {
    render(<KanbanBoard pipeline={pipeline([{ contact: sam }, { contact: john }, { contact: mike }])} move={vi.fn<Move>()} />);
    expect(screen.getByText("2 contacts en cours")).toBeDefined();
  });

  it("accorde le nombre de contacts en cours au singulier", () => {
    render(<KanbanBoard pipeline={pipeline([{ contact: sam }])} move={vi.fn<Move>()} />);
    expect(screen.getByText("1 contact en cours")).toBeDefined();
  });

  it("propose un lien « Nouveau contact » vers le formulaire d'ajout", () => {
    render(<KanbanBoard pipeline={pipeline([])} move={vi.fn<Move>()} />);
    expect(screen.getByRole("link", { name: /Nouveau contact/ }).getAttribute("href")).toBe("/contacts");
  });

  it("affiche un message dans une colonne vide", () => {
    render(<KanbanBoard pipeline={pipeline([{ contact: sam }])} move={vi.fn<Move>()} />);
    const empty = within(column("Premier contact")).getByText("Aucun contact · déposez-en un ici");
    expect(empty.closest("[data-slot=empty]")).not.toBeNull();
    expect(within(column("Échange")).queryByText("Aucun contact · déposez-en un ici")).toBeNull();
  });

  it("ouvre la fiche du contact au clic sur sa carte", () => {
    render(<KanbanBoard pipeline={pipeline([{ contact: sam }])} move={vi.fn<Move>()} />);
    expect(screen.getByRole("link", { name: "Sam Durand" }).getAttribute("href")).toBe("/contacts/2");
  });

  it("affiche l'échéance de la relance sur la carte", () => {
    render(
      <KanbanBoard
        pipeline={pipeline([{ contact: sam, followUpInDays: 1 }, { contact: john, followUpInDays: 7 }, { contact: mike }])}
        move={vi.fn<Move>()}
      />,
    );
    expect(within(column("Échange")).getByText("demain")).toBeDefined();
    expect(within(column("Proposition")).getByText("dans 7 j")).toBeDefined();
    expect(within(column("Signé")).queryByText(/demain|dans|retard|aujourd'hui/)).toBeNull();
  });

  it("transmet le contact et la colonne de dépôt à l'action", async () => {
    const move = vi.fn<Move>(async () => ({}));
    render(<KanbanBoard pipeline={pipeline([{ contact: sam }])} move={move} />);
    drop("2", "proposition");
    await vi.waitFor(() => expect(move).toHaveBeenCalledTimes(1));
    expect(move.mock.calls[0][0]).toBe("2");
    expect(move.mock.calls[0][2]).toBe("proposition");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("laisse la carte dans sa colonne et affiche le message quand le déplacement est refusé", async () => {
    const error = "Un contact ne peut passer qu'à l'étape suivante ou à « Perdu ».";
    const move = vi.fn<Move>(async () => ({ error }));
    render(<KanbanBoard pipeline={pipeline([{ contact: sam }])} move={move} />);
    drop("2", "negociation");
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe(error);
    expect(alert.getAttribute("data-slot")).toBe("alert");
    expect(within(column("Échange")).getByText("Sam Durand")).toBeDefined();
    expect(within(column("Négociation")).queryByText("Sam Durand")).toBeNull();
  });

  it("n'appelle pas l'action quand la carte est déposée dans sa propre colonne ou hors des colonnes", () => {
    const move = vi.fn<Move>(async () => ({}));
    render(<KanbanBoard pipeline={pipeline([{ contact: sam }])} move={move} />);
    drop("2", "echange");
    drop("2", null);
    expect(move).not.toHaveBeenCalled();
  });

  it("rend chaque carte déplaçable au clavier, avec des instructions en français", () => {
    render(<KanbanBoard pipeline={pipeline([{ contact: sam }, { contact: john }])} move={vi.fn<Move>()} />);
    const cards = screen.getAllByRole("button", { name: /Déplacer/ });
    expect(cards.map((card) => card.getAttribute("aria-label"))).toEqual([
      "Déplacer Sam Durand",
      "Déplacer John",
    ]);
    for (const card of cards) {
      expect(card.getAttribute("tabindex")).toBe("0");
      const instructions = document.getElementById(card.getAttribute("aria-describedby")!);
      expect(instructions?.textContent).toMatch(/Espace/);
    }
  });

  it("affiche en tête de colonne le badge coloré de l'étape", () => {
    render(<KanbanBoard pipeline={pipeline([])} move={vi.fn<Move>()} />);
    expect(within(column("Négociation")).getByText("Négociation").className).toContain(
      "bg-stage-negociation",
    );
  });

  it("distingue une échéance aujourd'hui, en retard ou plus tard", () => {
    const today = contact("5", "Aujourd'hui", "echange");
    const late = contact("6", "En retard", "echange");
    const later = contact("7", "Plus tard", "echange");
    render(
      <KanbanBoard
        pipeline={pipeline([
          { contact: today, followUpInDays: 0 },
          { contact: late, followUpInDays: -2 },
          { contact: later, followUpInDays: 3 },
        ])}
        move={vi.fn<Move>()}
      />,
    );
    expect(screen.getByText("aujourd'hui").className).toContain("bg-highlight");
    expect(screen.getByText("en retard de 2 j").className).toContain("text-destructive");
    expect(screen.getByText("dans 3 j").className).toContain("text-muted-foreground");
    expect(screen.getByText("dans 3 j").className).not.toContain("bg-highlight");
  });
});
