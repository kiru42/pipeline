import type { Contact } from "@/services/contact.service";

const FIELDS = [
  ["Entreprise", "company"],
  ["Email", "email"],
  ["Téléphone", "phone"],
  ["Note", "note"],
] as const;

export function ContactDetails({ contact }: { contact: Contact }) {
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-foreground">{contact.name}</h1>
      <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
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
