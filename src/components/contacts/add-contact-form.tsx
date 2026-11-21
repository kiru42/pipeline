"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type AddContactState = { error?: string };

type Props = {
  action: (state: AddContactState, formData: FormData) => Promise<AddContactState>;
};

export function AddContactForm({ action }: Props) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <Label htmlFor="contact-name">Nom</Label>
      <div className="flex gap-2">
        <Input
          id="contact-name"
          name="name"
          autoComplete="off"
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "contact-name-error" : undefined}
        />
        <Button type="submit" disabled={pending}>
          Ajouter
        </Button>
      </div>
      {state.error && (
        <p id="contact-name-error" role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
