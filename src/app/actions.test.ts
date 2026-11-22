import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Contact, ContactService } from "@/services/contact.service";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  service: {
    changeStage: vi.fn(),
    scheduleFollowUp: vi.fn(),
    clearFollowUp: vi.fn(),
    completeFollowUp: vi.fn(),
  },
}));

vi.mock("next/cache", () => ({ refresh: mocks.refresh }));
vi.mock("@/services/container", () => ({
  getContactService: async () => mocks.service as unknown as ContactService,
}));

import {
  changeStageAction,
  clearFollowUpAction,
  completeFollowUpAction,
  scheduleFollowUpAction,
} from "./actions";

const contact = { id: "c1" } as Contact;
const success = { ok: true, contact } as const;
const failure = { ok: false, error: "Erreur du service." } as const;

function form(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    data.set(key, value);
  }
  return data;
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("changeStageAction", () => {
  it("transmet l'id et l'étape choisie au service", async () => {
    mocks.service.changeStage.mockResolvedValue(success);
    await changeStageAction("c1", {}, "meeting");
    expect(mocks.service.changeStage).toHaveBeenCalledWith("c1", "meeting");
  });

  it("rafraîchit la page en cas de succès", async () => {
    mocks.service.changeStage.mockResolvedValue(success);
    expect(await changeStageAction("c1", {}, "meeting")).toEqual({});
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
  });

  it("renvoie l'erreur du service sans rafraîchir", async () => {
    mocks.service.changeStage.mockResolvedValue(failure);
    expect(await changeStageAction("c1", {}, "archive")).toEqual({ error: "Erreur du service." });
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});

describe("scheduleFollowUpAction", () => {
  it("transmet l'id et la date saisie au service", async () => {
    mocks.service.scheduleFollowUp.mockResolvedValue(success);
    await scheduleFollowUpAction("c1", {}, form({ date: "2026-12-01" }));
    expect(mocks.service.scheduleFollowUp).toHaveBeenCalledWith("c1", "2026-12-01");
  });

  it("transmet une date vide quand le champ est absent", async () => {
    mocks.service.scheduleFollowUp.mockResolvedValue(failure);
    await scheduleFollowUpAction("c1", {}, form({}));
    expect(mocks.service.scheduleFollowUp).toHaveBeenCalledWith("c1", "");
  });

  it("rafraîchit la page en cas de succès", async () => {
    mocks.service.scheduleFollowUp.mockResolvedValue(success);
    expect(await scheduleFollowUpAction("c1", {}, form({ date: "2026-12-01" }))).toEqual({});
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
  });

  it("renvoie l'erreur du service sans rafraîchir", async () => {
    mocks.service.scheduleFollowUp.mockResolvedValue(failure);
    expect(await scheduleFollowUpAction("c1", {}, form({ date: "2020-01-01" }))).toEqual({
      error: "Erreur du service.",
    });
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});

describe("clearFollowUpAction", () => {
  it("transmet l'id au service", async () => {
    mocks.service.clearFollowUp.mockResolvedValue(success);
    await clearFollowUpAction("c1");
    expect(mocks.service.clearFollowUp).toHaveBeenCalledWith("c1");
  });

  it("rafraîchit la page en cas de succès", async () => {
    mocks.service.clearFollowUp.mockResolvedValue(success);
    expect(await clearFollowUpAction("c1")).toEqual({});
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
  });

  it("renvoie l'erreur du service sans rafraîchir", async () => {
    mocks.service.clearFollowUp.mockResolvedValue(failure);
    expect(await clearFollowUpAction("inconnu")).toEqual({ error: "Erreur du service." });
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});

describe("completeFollowUpAction", () => {
  it("transmet l'id et la nouvelle date saisie au service", async () => {
    mocks.service.completeFollowUp.mockResolvedValue(success);
    await completeFollowUpAction("c1", {}, form({ nextDate: "2026-12-15" }));
    expect(mocks.service.completeFollowUp).toHaveBeenCalledWith("c1", "2026-12-15");
  });

  it("rafraîchit la page en cas de succès", async () => {
    mocks.service.completeFollowUp.mockResolvedValue(success);
    expect(await completeFollowUpAction("c1", {}, form({ nextDate: "2026-12-15" }))).toEqual({});
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
  });

  it("renvoie l'erreur du service sans rafraîchir", async () => {
    mocks.service.completeFollowUp.mockResolvedValue(failure);
    expect(await completeFollowUpAction("c1", {}, form({ nextDate: "2020-01-01" }))).toEqual({
      error: "Erreur du service.",
    });
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});
