"use server";

import { refresh } from "next/cache";
import type { AddContactState } from "@/components/contacts/add-contact-form";
import { getContactService } from "@/services/container";

export async function addContactAction(
  _state: AddContactState,
  formData: FormData,
): Promise<AddContactState> {
  const name = formData.get("name");
  const service = await getContactService();
  const result = await service.addContact(typeof name === "string" ? name : "");
  if (!result.ok) {
    return { error: result.error };
  }
  refresh();
  return {};
}
