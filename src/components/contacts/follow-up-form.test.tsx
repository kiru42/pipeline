// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Contact } from "@/services/contact.service";
import { FollowUpForm, type FollowUpFormState } from "./follow-up-form";

afterEach(cleanup);

const marie: Contact = {
  id: "1",
  name: "Marie Dupont",
  company: null,
  email: null,
  phone: null,
  note: null,
  stage: "echange",
  nextFollowUp: null,
  lastContactedAt: null,
};

type Schedule = (state: FollowUpFormState, formData: FormData) => Promise<FollowUpFormState>;
type Clear = (state: FollowUpFormState) => Promise<FollowUpFormState>;

function renderForm(contact: Contact, schedule = vi.fn<Schedule>(async () => ({})), clear = vi.fn<Clear>(async () => ({}))) {
  render(<FollowUpForm contact={contact} schedule={schedule} clear={clear} />);
  return { schedule, clear };
}

function dateInput() {
  return screen.getByLabelText("Date de relance") as HTMLInputElement;
}

describe("FollowUpForm", () => {
  it("transmet la date choisie à l'action de planification", async () => {
    const { schedule } = renderForm(marie);
    fireEvent.change(dateInput(), { target: { value: "2026-11-25" } });
    fireEvent.click(screen.getByRole("button", { name: "Planifier" }));
    await waitFor(() => expect(schedule).toHaveBeenCalledTimes(1));
    expect(schedule.mock.calls[0][1].get("date")).toBe("2026-11-25");
  });

  it("pré-remplit la date de la relance existante et permet de la supprimer", async () => {
    const { clear } = renderForm({ ...marie, nextFollowUp: "2026-11-25" });
    expect(dateInput().value).toBe("2026-11-25");
    fireEvent.click(screen.getByRole("button", { name: "Supprimer la relance" }));
    await waitFor(() => expect(clear).toHaveBeenCalledTimes(1));
  });

  it("ne propose pas de supprimer une relance inexistante", () => {
    renderForm(marie);
    expect(screen.queryByRole("button", { name: "Supprimer la relance" })).toBeNull();
  });

  it("affiche le refus renvoyé par l'action", async () => {
    renderForm(
      marie,
      vi.fn<Schedule>(async () => ({
        error: "La date de relance ne peut pas être dans le passé.",
      })),
    );
    fireEvent.change(dateInput(), { target: { value: "2026-11-01" } });
    fireEvent.click(screen.getByRole("button", { name: "Planifier" }));
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe("La date de relance ne peut pas être dans le passé.");
  });

  it.each(["signe", "perdu"] as const)(
    "indique qu'un contact clos (« %s ») ne peut pas avoir de relance",
    (stage) => {
      renderForm({ ...marie, stage });
      expect(screen.getByText("Un contact clos ne peut pas avoir de relance.")).toBeDefined();
      expect(screen.queryByRole("button", { name: "Planifier" })).toBeNull();
    },
  );
});
