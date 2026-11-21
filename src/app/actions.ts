"use server";

import { refresh } from "next/cache";
import type { CompleteFollowUpState } from "@/components/contacts/complete-follow-up-form";
import type { AddContactState } from "@/components/contacts/add-contact-form";
import type { ContactFormState } from "@/components/contacts/contact-form";
import type { FollowUpFormState } from "@/components/contacts/follow-up-form";
import type { StageSelectorState } from "@/components/contacts/stage-selector";
import { getContactService } from "@/services/container";

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function addContactAction(
  _state: AddContactState,
  formData: FormData,
): Promise<AddContactState> {
  const service = await getContactService();
  const result = await service.addContact(text(formData, "name"));
  if (!result.ok) {
    return { error: result.error };
  }
  refresh();
  return {};
}

export async function updateContactAction(
  id: string,
  _state: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const values = {
    company: text(formData, "company"),
    email: text(formData, "email"),
    phone: text(formData, "phone"),
    note: text(formData, "note"),
  };
  const service = await getContactService();
  const result = await service.updateContact(id, values);
  if (result.ok) {
    refresh();
    return {};
  }
  if ("errors" in result) {
    return { errors: result.errors, values };
  }
  return { error: result.error, values };
}

export async function changeStageAction(
  id: string,
  _state: StageSelectorState,
  stage: string,
): Promise<StageSelectorState> {
  const service = await getContactService();
  const result = await service.changeStage(id, stage);
  if (!result.ok) {
    return { error: result.error };
  }
  refresh();
  return {};
}

export async function scheduleFollowUpAction(
  id: string,
  _state: FollowUpFormState,
  formData: FormData,
): Promise<FollowUpFormState> {
  const service = await getContactService();
  const result = await service.scheduleFollowUp(id, text(formData, "date"));
  if (!result.ok) {
    return { error: result.error };
  }
  refresh();
  return {};
}

export async function clearFollowUpAction(id: string): Promise<FollowUpFormState> {
  const service = await getContactService();
  const result = await service.clearFollowUp(id);
  if (!result.ok) {
    return { error: result.error };
  }
  refresh();
  return {};
}

export async function completeFollowUpAction(
  id: string,
  _state: CompleteFollowUpState,
  formData: FormData,
): Promise<CompleteFollowUpState> {
  const service = await getContactService();
  const result = await service.completeFollowUp(id, text(formData, "nextDate"));
  if (!result.ok) {
    return { error: result.error };
  }
  refresh();
  return {};
}
