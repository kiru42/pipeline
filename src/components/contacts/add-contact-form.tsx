"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export type AddContactState = { error?: string };

type Props = {
  action: (state: AddContactState, formData: FormData) => Promise<AddContactState>;
};

export function AddContactForm({ action }: Props) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Field data-invalid={state.error ? true : undefined}>
        <FieldLabel htmlFor="contact-name">Nom</FieldLabel>
        <Input
          id="contact-name"
          name="name"
          autoComplete="off"
          placeholder="Prénom Nom"
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "contact-name-error" : undefined}
        />
        {state.error && <FieldError id="contact-name-error">{state.error}</FieldError>}
      </Field>
      <Button type="submit" disabled={pending} className="w-full">
        Ajouter
      </Button>
    </form>
  );
}
