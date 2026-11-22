"use client";

import { startTransition, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { getStage, type Stage } from "@/services/stages";

export type StageSelectorState = { error?: string };

type Props = {
  stage: Stage;
  /** Étapes permises par le service pour ce contact (vide pour un contact clos). */
  allowed: readonly Stage[];
  action: (state: StageSelectorState, stage: string) => Promise<StageSelectorState>;
};

export function StageSelector({ stage, allowed, action }: Props) {
  const [state, dispatch, pending] = useActionState(action, {});

  return (
    <section className="flex flex-col gap-2" aria-labelledby="stage-selector-title">
      <h2 id="stage-selector-title" className="text-sm font-medium text-foreground">
        Changer d&apos;étape
      </h2>
      <p className="text-sm text-muted-foreground">Étape actuelle : {getStage(stage).label}</p>
      {allowed.length === 0 ? (
        <p className="text-sm text-muted-foreground">Cette étape est définitive.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {allowed.map((candidate) => (
            <Button
              key={candidate}
              type="button"
              size="sm"
              variant={candidate === "perdu" ? "outline" : "default"}
              disabled={pending}
              onClick={() => startTransition(() => dispatch(candidate))}
            >
              {getStage(candidate).label}
            </Button>
          ))}
        </div>
      )}
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
    </section>
  );
}
