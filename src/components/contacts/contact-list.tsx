import Link from "next/link";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
} from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
import { formatDay } from "@/lib/dates";
import type { Contact } from "@/services/contact.service";
import { getStage } from "@/services/stages";

export function ContactList({ contacts }: { contacts: Contact[] }) {
  if (contacts.length === 0) {
    return (
      <Empty className="border border-border">
        <EmptyHeader>
          <EmptyDescription>Aucun contact pour l&apos;instant.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-xl border border-border">
      {contacts.map((contact) => (
        <li key={contact.id}>
          <Link
            href={`/contacts/${contact.id}`}
            className="flex items-center justify-between gap-4 px-4 py-3 text-sm outline-none transition-colors hover:bg-muted focus-visible:bg-muted"
          >
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="font-medium text-foreground">{contact.name}</span>
              {contact.company && (
                <span className="text-muted-foreground">{contact.company}</span>
              )}
            </span>
            <span className="flex shrink-0 items-center gap-3">
              {contact.nextFollowUp && (
                <span className="text-muted-foreground">
                  Relance le {formatDay(contact.nextFollowUp)}
                </span>
              )}
              <Badge variant={getStage(contact.stage).closed ? "secondary" : "outline"}>
                {getStage(contact.stage).label}
              </Badge>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
