import { Badge } from "@/components/ui/badge";
import { formatDay } from "@/lib/dates";
import type { Contact } from "@/services/contact.service";
import { getStage } from "@/services/stages";

const FIELDS = [
  ["Entreprise", "company"],
  ["Email", "email"],
  ["Téléphone", "phone"],
  ["Note", "note"],
] as const;

export function ContactDetails({ contact }: { contact: Contact }) {
  const stage = getStage(contact.stage);
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-foreground">{contact.name}</h1>
        {stage.closed && <Badge variant="secondary">Clos</Badge>}
      </div>
      <p className="text-sm text-muted-foreground">
        {contact.nextFollowUp
          ? `Relance le ${formatDay(contact.nextFollowUp)}`
          : "Aucune relance planifiée"}
      </p>
      <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Étape</dt>
        <dd className="text-foreground">{stage.label}</dd>
        {FIELDS.map(([label, key]) => (
          <div key={key} className="contents">
            <dt className="text-muted-foreground">{label}</dt>
            <dd
              className={
                contact[key]
                  ? "whitespace-pre-line text-foreground"
                  : "text-muted-foreground italic"
              }
            >
              {contact[key] ?? "Non renseigné"}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
