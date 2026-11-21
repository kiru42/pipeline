"use server";

import { refresh } from "next/cache";
import type { AddContactState } from "@/components/contacts/add-contact-form";
import type { ContactFormState } from "@/components/contacts/contact-form";
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
