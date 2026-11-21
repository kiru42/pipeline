"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <form action={formAction} className="flex w-full flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <Label htmlFor={inputId}>Nouvelle relance</Label>
        <Input
          id={inputId}
          name="nextDate"
          type="date"
          className="w-auto bg-background text-foreground"
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? errorId : undefined}
        />
        <Button type="submit" size="sm" disabled={pending}>
          Fait
        </Button>
      </div>
      {state.error && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
