import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getStage, type Stage } from "@/services/stages";

/** Classes complètes (lues telles quelles par Tailwind) des tokens `stage-*` de globals.css. */
const STAGE_CLASSES: Record<Stage, string> = {
  "premier-contact": "bg-stage-premier-contact text-stage-premier-contact-foreground",
  echange: "bg-stage-echange text-stage-echange-foreground",
  proposition: "bg-stage-proposition text-stage-proposition-foreground",
  negociation: "bg-stage-negociation text-stage-negociation-foreground",
  signe: "bg-stage-signe text-stage-signe-foreground",
  perdu: "bg-stage-perdu text-stage-perdu-foreground",
};

export function StageBadge({ stage, className }: { stage: Stage; className?: string }) {
  return (
    <Badge variant="outline" className={cn("rounded-md border-transparent", STAGE_CLASSES[stage], className)}>
      {getStage(stage).label}
    </Badge>
  );
}
