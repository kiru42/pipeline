"use client";

import { startTransition, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { STAGES, type Stage } from "@/services/stages";

export type StageSelectorState = { error?: string };

type Props = {
  stage: Stage;
  action: (state: StageSelectorState, stage: string) => Promise<StageSelectorState>;
};

export function StageSelector({ stage, action }: Props) {
  const [state, dispatch, pending] = useActionState(action, {});

  return (
    <section className="flex flex-col gap-2" aria-labelledby="stage-selector-title">
      <h2 id="stage-selector-title" className="text-sm font-medium text-foreground">
        Changer d&apos;étape
      </h2>
      <div className="flex flex-wrap gap-2">
        {STAGES.map((candidate) => {
          const current = candidate.id === stage;
          return (
            <Button
              key={candidate.id}
              type="button"
              size="sm"
              variant={current ? "default" : "outline"}
              aria-pressed={current}
              disabled={pending}
              onClick={() => {
                if (current) return;
                startTransition(() => dispatch(candidate.id));
              }}
            >
              {candidate.label}
            </Button>
          );
        })}
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
    </section>
  );
}
