import { connection } from "next/server";
import { Suspense } from "react";
import { DueFollowUps } from "@/components/contacts/due-follow-ups";
import { getContactService } from "@/services/container";
import { completeFollowUpAction } from "./actions";

async function TodayFollowUps() {
  // Dépend de la date du jour et des relances : lecture à la requête, jamais au build.
  await connection();
  const service = await getContactService();
  const followUps = await service.listDueFollowUps();
  return <DueFollowUps followUps={followUps} complete={completeFollowUpAction} />;
}

export default function TodayPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-4 py-12">
      <h1 className="text-2xl font-semibold text-foreground">Aujourd&apos;hui</h1>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement…</p>}>
        <TodayFollowUps />
      </Suspense>
    </div>
  );
}
