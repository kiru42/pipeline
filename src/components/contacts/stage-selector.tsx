"use client";

import { startTransition, useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { STAGES, type Stage } from "@/services/stages";

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
    <section className="flex flex-col gap-2.5" aria-labelledby="stage-selector-title">
      <h2 id="stage-selector-title" className="text-sm font-medium text-muted-foreground">
        Étape
      </h2>
      <ToggleGroup
        aria-labelledby="stage-selector-title"
        value={[stage]}
        onValueChange={(value) => {
          const next = value[0];
          if (next && next !== stage) startTransition(() => dispatch(next));
        }}
        spacing={1}
        className="grid w-full grid-cols-2 rounded-lg bg-muted p-1 sm:grid-cols-6"
      >
        {STAGES.map((candidate) => (
          <ToggleGroupItem
            key={candidate.id}
            value={candidate.id}
            disabled={pending || !allowed.includes(candidate.id)}
            className="h-9 w-full text-muted-foreground data-pressed:bg-card data-pressed:font-semibold data-pressed:text-foreground data-pressed:opacity-100 data-pressed:shadow-xs"
          >
            {candidate.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <p className="text-sm text-muted-foreground">
        {allowed.length === 0
          ? "Cette étape est définitive."
          : "Signé et Perdu closent le contact : il sort des relances."}
      </p>
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
    </section>
  );
}
