import { connection } from "next/server";
import { Suspense } from "react";
import { KanbanBoard } from "@/components/contacts/kanban-board";
import { getContactService } from "@/services/container";
import { changeStageAction } from "../actions";

async function Board() {
  // Les étapes et les échéances changent à chaque déplacement : lecture à la requête, jamais au build.
  await connection();
  const service = await getContactService();
  const pipeline = await service.getPipeline();
  return <KanbanBoard pipeline={pipeline} move={changeStageAction} />;
}

export default function PipelinePage() {
  return (
    <div className="flex w-full min-w-0 flex-col px-4 py-8 md:px-8">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement…</p>}>
        <Board />
      </Suspense>
    </div>
  );
}
