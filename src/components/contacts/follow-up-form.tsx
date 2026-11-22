"use client";

import { startTransition, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import type { Contact } from "@/services/contact.service";
import { getStage } from "@/services/stages";

export type FollowUpFormState = { error?: string };

type Props = {
  contact: Contact;
  schedule: (state: FollowUpFormState, formData: FormData) => Promise<FollowUpFormState>;
  clear: (state: FollowUpFormState) => Promise<FollowUpFormState>;
};

export function FollowUpForm({ contact, schedule, clear }: Props) {
  const [scheduleState, scheduleAction, scheduling] = useActionState(schedule, {});
  const [clearState, clearAction, clearing] = useActionState(clear, {});
  const pending = scheduling || clearing;
  const error = scheduleState.error ?? clearState.error;

  return (
    <section className="flex flex-col gap-3" aria-labelledby="follow-up-title">
      <h2 id="follow-up-title" className="text-base font-semibold text-foreground">
        Prochaine relance
      </h2>
      {getStage(contact.stage).closed ? (
        <p className="text-sm text-muted-foreground">
          Un contact clos ne peut pas avoir de relance.
        </p>
      ) : (
        <form action={scheduleAction}>
          <Field data-invalid={error ? true : undefined}>
            <FieldLabel htmlFor="follow-up-date">Date de relance</FieldLabel>
            <div className="flex flex-wrap gap-2">
              <Input
                id="follow-up-date"
                name="date"
                type="date"
                className="w-auto font-mono"
                defaultValue={contact.nextFollowUp ?? ""}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "follow-up-error" : undefined}
              />
              <Button type="submit" disabled={pending}>
                Planifier
              </Button>
              {contact.nextFollowUp && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() => startTransition(() => clearAction())}
                >
                  Supprimer la relance
                </Button>
              )}
            </div>
            {error && <FieldError id="follow-up-error">{error}</FieldError>}
          </Field>
        </form>
      )}
    </section>
  );
}
