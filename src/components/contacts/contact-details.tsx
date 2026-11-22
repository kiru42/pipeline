import { Badge } from "@/components/ui/badge";
import { formatDay } from "@/lib/dates";
import { initials } from "@/lib/initials";
import type { Contact } from "@/services/contact.service";
import { getStage } from "@/services/stages";
import { StageBadge } from "./stage-badge";

/** En-tête de la fiche : initiales, nom, étape, entreprise, relance et dernier contact. */
export function ContactDetails({ contact }: { contact: Contact }) {
  const closed = getStage(contact.stage).closed;
  return (
    <header className="flex items-center gap-4">
      <div
        aria-hidden="true"
        className="grid size-14 shrink-0 place-items-center rounded-lg bg-secondary text-xl font-semibold text-secondary-foreground"
      >
        {initials(contact.name)}
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{contact.name}</h1>
          <StageBadge stage={contact.stage} />
          {closed && <Badge variant="secondary">Clos</Badge>}
        </div>
        <p className="flex flex-wrap gap-x-2 text-sm text-muted-foreground">
          {contact.company && (
            <>
              <span>{contact.company}</span>
              <span aria-hidden="true">·</span>
            </>
          )}
          <span>
            {contact.nextFollowUp
              ? `Relance le ${formatDay(contact.nextFollowUp)}`
              : "Aucune relance planifiée"}
          </span>
          {contact.lastContactedAt && (
            <>
              <span aria-hidden="true">·</span>
              <span>Dernier contact le {formatDay(contact.lastContactedAt)}</span>
            </>
          )}
        </p>
      </div>
    </header>
  );
}
