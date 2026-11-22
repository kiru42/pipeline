import Link from "next/link";
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import { formatDay } from "@/lib/dates";
import type { Contact } from "@/services/contact.service";
import { StageBadge } from "./stage-badge";

export function ContactList({ contacts }: { contacts: Contact[] }) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby="contacts-title">
      <h1 id="contacts-title" className="text-2xl font-semibold tracking-tight text-foreground">
        Contacts <span className="font-medium text-muted-foreground">{contacts.length}</span>
      </h1>
      {contacts.length === 0 ? (
        <Empty className="border border-border bg-card">
          <EmptyHeader>
            <EmptyDescription>Aucun contact pour l&apos;instant.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ItemGroup className="gap-0 overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          {contacts.map((contact) => (
            <div key={contact.id} role="listitem" className="border-b border-border last:border-b-0">
              <Item
                render={<Link href={`/contacts/${contact.id}`} />}
                className="rounded-none hover:bg-muted focus-visible:bg-muted"
              >
                <ItemContent className="min-w-0">
                  <ItemTitle>{contact.name}</ItemTitle>
                  {contact.company && <ItemDescription>{contact.company}</ItemDescription>}
                </ItemContent>
                <ItemActions className="gap-3">
                  {contact.nextFollowUp && (
                    <span className="font-mono text-xs text-muted-foreground tabular-nums">
                      Relance le {formatDay(contact.nextFollowUp)}
                    </span>
                  )}
                  <StageBadge stage={contact.stage} />
                </ItemActions>
              </Item>
            </div>
          ))}
        </ItemGroup>
      )}
    </section>
  );
}
