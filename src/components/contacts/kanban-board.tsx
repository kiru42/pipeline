"use client";

import Link from "next/link";
import { useId, useState, useTransition, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardCode,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
  type KeyboardCoordinateGetter,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { GripVertical, Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty";
import { formatDueIn } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { Pipeline, PipelineCard, PipelineColumn } from "@/services/contact.service";
import { StageBadge } from "./stage-badge";
import type { StageSelectorState } from "./stage-selector";

type Props = {
  pipeline: Pipeline;
  /** Fait passer le contact `id` à l'étape `stage` ; le service décide si c'est permis. */
  move: (id: string, state: StageSelectorState, stage: string) => Promise<StageSelectorState>;
};

const INSTRUCTIONS =
  "Pour déplacer une carte, appuyez sur Espace, choisissez la colonne avec les flèches gauche et droite, puis appuyez de nouveau sur Espace pour la déposer, ou sur Échap pour annuler.";

/** Style de l'échéance : aujourd'hui en évidence, en retard en rouge, plus tard discrète. */
function dueClass(days: number): string {
  if (days === 0) return "bg-highlight text-highlight-foreground";
  if (days < 0) return "bg-destructive/10 text-destructive";
  return "text-muted-foreground";
}

/** Avec la souris, la colonne sous le pointeur ; au clavier (pas de pointeur), celle que la carte recouvre. */
const collisionDetection: CollisionDetection = (args) => {
  const underPointer = pointerWithin(args);
  return underPointer.length > 0 ? underPointer : rectIntersection(args);
};

/** Au clavier, les flèches gauche et droite font sauter la carte d'une colonne à la voisine. */
const jumpToColumn: KeyboardCoordinateGetter = (event, { context }) => {
  const { collisionRect, droppableRects, droppableContainers } = context;
  if (!collisionRect) return undefined;
  const direction =
    event.code === KeyboardCode.Right ? 1 : event.code === KeyboardCode.Left ? -1 : 0;
  if (direction === 0) return undefined;
  event.preventDefault();

  const columns = droppableContainers
    .getEnabled()
    .map((container) => droppableRects.get(container.id))
    .filter((rect) => rect !== undefined)
    .sort((a, b) => a.left - b.left);
  const center = collisionRect.left + collisionRect.width / 2;
  const target =
    direction === 1
      ? columns.find((rect) => rect.left > center)
      : columns.findLast((rect) => rect.left + rect.width < center);
  if (!target) return undefined;
  return {
    x: target.left + (target.width - collisionRect.width) / 2,
    y: target.top + 48,
  };
};

export function KanbanBoard({ pipeline, move }: Props) {
  const dndId = useId();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [dragged, setDragged] = useState<PipelineCard | null>(null);
  const sensors = useSensors(
    // Un léger déplacement avant de saisir la carte : un simple clic ouvre la fiche.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: jumpToColumn }),
  );

  const cards = pipeline.columns.flatMap((column) => column.cards);
  const cardOf = (id: UniqueIdentifier) => cards.find((card) => card.contact.id === id);
  const nameOf = (id: UniqueIdentifier) => cardOf(id)?.contact.name ?? "La carte";
  const labelOf = (id: UniqueIdentifier) =>
    pipeline.columns.find((column) => column.stage.id === id)?.stage.label ?? "";

  const announcements: Announcements = {
    onDragStart: ({ active }) => `${nameOf(active.id)} saisi.`,
    onDragOver: ({ active, over }) =>
      over
        ? `${nameOf(active.id)} au-dessus de la colonne ${labelOf(over.id)}.`
        : `${nameOf(active.id)} hors des colonnes.`,
    onDragEnd: ({ active, over }) =>
      over
        ? `${nameOf(active.id)} déposé dans la colonne ${labelOf(over.id)}.`
        : `${nameOf(active.id)} reposé à sa place.`,
    onDragCancel: ({ active }) => `Déplacement de ${nameOf(active.id)} annulé.`,
  };

  function handleDragStart({ active }: DragStartEvent) {
    setDragged(cardOf(active.id) ?? null);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setDragged(null);
    if (!over) return;
    const id = String(active.id);
    const stage = String(over.id);
    if (cardOf(id)?.contact.stage === stage) return;
    startTransition(async () => {
      const result = await move(id, {}, stage);
      setError(result.error ?? null);
    });
  }

  const inProgress = pipeline.inProgress;

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-foreground">Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            {inProgress} {inProgress > 1 ? "contacts en cours" : "contact en cours"}
          </p>
        </div>
        <Link href="/contacts" className={buttonVariants()}>
          <Plus data-icon="inline-start" />
          Nouveau contact
        </Link>
      </header>

      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <GripVertical className="size-4" aria-hidden />
        Glissez une carte vers l&apos;étape suivante ou vers « Perdu » · cliquez sur un nom pour
        ouvrir la fiche
      </p>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={collisionDetection}
        accessibility={{ announcements, screenReaderInstructions: { draggable: INSTRUCTIONS } }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setDragged(null)}
      >
        <div className="flex gap-4 overflow-x-auto pb-4" aria-busy={pending}>
          {pipeline.columns.map((column) => (
            <KanbanColumn key={column.stage.id} column={column}>
              {column.cards.map((card) => (
                <DraggableCard key={card.contact.id} card={card} />
              ))}
            </KanbanColumn>
          ))}
        </div>
        <DragOverlay>{dragged && <CardContent card={dragged} />}</DragOverlay>
      </DndContext>
    </div>
  );
}

function KanbanColumn({ column, children }: { column: PipelineColumn; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.stage.id });
  const titleId = useId();

  return (
    <section
      ref={setNodeRef}
      aria-label={column.stage.label}
      className={cn(
        "flex min-h-80 w-64 shrink-0 flex-col gap-2 rounded-xl bg-muted p-2 ring-ring/50 transition-shadow",
        isOver && "ring-3",
      )}
    >
      <div className="flex items-center justify-between gap-2 px-1.5 pt-1.5 pb-1">
        <h2 id={titleId} className="text-sm font-semibold">
          <StageBadge stage={column.stage.id} />
        </h2>
        <span className="font-mono text-xs text-muted-foreground tabular-nums">
          <span aria-hidden="true">{column.count}</span>
          <span className="sr-only">
            {column.count} {column.count > 1 ? "contacts" : "contact"}
          </span>
        </span>
      </div>
      {column.cards.length === 0 ? (
        <Empty className="flex-none border border-dashed border-border p-4">
          <EmptyHeader>
            <EmptyDescription>Aucun contact · déposez-en un ici</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="flex flex-col gap-2" aria-labelledby={titleId}>
          {children}
        </ul>
      )}
    </section>
  );
}

function DraggableCard({ card }: { card: PipelineCard }) {
  const { contact } = card;
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({
    id: contact.id,
    attributes: { roleDescription: "carte déplaçable" },
  });

  return (
    <li ref={setNodeRef} {...listeners} className={cn(isDragging && "opacity-40")}>
      <CardContent
        card={card}
        handle={
          <Button
            ref={setActivatorNodeRef}
            {...attributes}
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={`Déplacer ${contact.name}`}
            className="cursor-grab text-muted-foreground"
          >
            <GripVertical />
          </Button>
        }
      />
    </li>
  );
}

function CardContent({ card, handle }: { card: PipelineCard; handle?: ReactNode }) {
  const { contact, followUpInDays } = card;
  return (
    <Card className="flex cursor-grab flex-col gap-1.5 p-3 shadow-xs active:cursor-grabbing">
      <div className="flex items-start gap-2">
        <div className="flex min-w-0 flex-1 flex-col">
          <Link
            href={`/contacts/${contact.id}`}
            className="truncate text-sm font-medium text-foreground underline-offset-4 hover:underline"
          >
            {contact.name}
          </Link>
          {contact.company && (
            <span className="truncate text-[0.8125rem] text-muted-foreground">
              {contact.company}
            </span>
          )}
        </div>
        {handle}
      </div>
      {followUpInDays !== null && (
        <span
          className={cn(
            "w-fit rounded-sm px-1.5 py-0.5 font-mono text-xs tabular-nums",
            dueClass(followUpInDays),
          )}
        >
          {formatDueIn(followUpInDays)}
        </span>
      )}
    </Card>
  );
}
