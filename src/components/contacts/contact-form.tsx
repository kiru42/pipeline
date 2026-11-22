"use client";

import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Contact, ContactDetailsInput } from "@/services/contact.service";

export type ContactFormState = {
  error?: string;
  errors?: { email?: string };
  values?: ContactDetailsInput;
};

type Action = (state: ContactFormState, formData: FormData) => Promise<ContactFormState>;

type Props = {
  contact: Contact;
  action: Action;
  /** Appelé après un enregistrement accepté. */
  onSaved?: () => void;
  /** Affiche un bouton « Annuler » qui appelle cette fonction. */
  onCancel?: () => void;
};

export function ContactForm({ contact, action, onSaved, onCancel }: Props) {
  const [state, formAction, pending] = useActionState<ContactFormState, FormData>(
    async (previous, formData) => {
      const result = await action(previous, formData);
      if (!result.error && !result.errors) onSaved?.();
      return result;
    },
    {},
  );
  const value = (key: keyof ContactDetailsInput) =>
    state.values?.[key] ?? contact[key] ?? "";
  const emailError = state.errors?.email;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor="contact-company">Entreprise</FieldLabel>
          <Input id="contact-company" name="company" defaultValue={value("company")} />
        </Field>

        <Field data-invalid={emailError ? true : undefined}>
          <FieldLabel htmlFor="contact-email">Email</FieldLabel>
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
          {emailError && <FieldError id="contact-email-error">{emailError}</FieldError>}
        </Field>

        <Field>
          <FieldLabel htmlFor="contact-phone">Téléphone</FieldLabel>
          <Input
            id="contact-phone"
            name="phone"
            type="tel"
            autoComplete="off"
            defaultValue={value("phone")}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="contact-note">Note</FieldLabel>
          <Textarea id="contact-note" name="note" defaultValue={value("note")} />
        </Field>
      </FieldGroup>

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          Enregistrer
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" disabled={pending} onClick={onCancel}>
            Annuler
          </Button>
        )}
      </div>
    </form>
  );
}
