"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export type CompleteFollowUpState = { error?: string };

type Props = {
  contactId: string;
  action: (state: CompleteFollowUpState, formData: FormData) => Promise<CompleteFollowUpState>;
};

export function CompleteFollowUpForm({ contactId, action }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const inputId = `complete-follow-up-${contactId}`;
  const errorId = `${inputId}-error`;

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <Field className="w-auto">
          <FieldLabel htmlFor={inputId} className="sr-only">
            Prochaine relance
          </FieldLabel>
          <Input
            id={inputId}
            name="nextDate"
            type="date"
            className="h-7 w-auto bg-card font-mono text-xs text-foreground"
            aria-invalid={state.error ? true : undefined}
            aria-describedby={state.error ? errorId : undefined}
          />
        </Field>
        <Button type="submit" size="sm" disabled={pending}>
          Fait
        </Button>
      </div>
      {state.error && <FieldError id={errorId}>{state.error}</FieldError>}
    </form>
  );
}
