import Link from "next/link";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
} from "@/components/ui/empty";
import type { Contact } from "@/services/contact.service";

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
            className="flex flex-col gap-0.5 px-4 py-3 text-sm outline-none transition-colors hover:bg-muted focus-visible:bg-muted"
          >
            <span className="font-medium text-foreground">{contact.name}</span>
            {contact.company && (
              <span className="text-muted-foreground">{contact.company}</span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
