"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Contact, ContactDetailsInput } from "@/services/contact.service";

export type ContactFormState = {
  error?: string;
  errors?: { email?: string };
  values?: ContactDetailsInput;
};

type Props = {
  contact: Contact;
  action: (state: ContactFormState, formData: FormData) => Promise<ContactFormState>;
};

export function ContactForm({ contact, action }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const value = (key: keyof ContactDetailsInput) =>
    state.values?.[key] ?? contact[key] ?? "";
  const emailError = state.errors?.email;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="contact-company">Entreprise</Label>
        <Input id="contact-company" name="company" defaultValue={value("company")} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="contact-email">Email</Label>
        <Input
          id="contact-email"
          name="email"
          type="text"
          inputMode="email"
          autoComplete="off"
          defaultValue={value("email")}
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? "contact-email-error" : undefined}
        />
        {emailError && (
          <p id="contact-email-error" role="alert" className="text-sm text-destructive">
            {emailError}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="contact-phone">Téléphone</Label>
        <Input
          id="contact-phone"
          name="phone"
          type="tel"
          autoComplete="off"
          defaultValue={value("phone")}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="contact-note">Note</Label>
        <Textarea id="contact-note" name="note" defaultValue={value("note")} />
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div>
        <Button type="submit" disabled={pending}>
          Enregistrer
        </Button>
      </div>
    </form>
  );
}
