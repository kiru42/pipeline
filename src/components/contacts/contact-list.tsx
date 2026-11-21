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
        <li key={contact.id} className="px-4 py-3 text-sm text-foreground">
          {contact.name}
        </li>
      ))}
    </ul>
  );
}
