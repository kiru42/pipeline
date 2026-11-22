"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Contact } from "@/services/contact.service";
import { ContactForm, type ContactFormState } from "./contact-form";

const FIELDS = [
  ["Entreprise", "company"],
  ["Email", "email"],
  ["Téléphone", "phone"],
  ["Note", "note"],
] as const;

type Props = {
  contact: Contact;
  action: (state: ContactFormState, formData: FormData) => Promise<ContactFormState>;
};

/** Coordonnées du contact en lecture ; « Modifier » ouvre le formulaire à la place. */
export function ContactCoordinates({ contact, action }: Props) {
  const [editing, setEditing] = useState(false);

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <CardTitle>
          <h2 className="text-base font-semibold">Coordonnées</h2>
        </CardTitle>
        {!editing && (
          <CardAction>
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              Modifier
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {editing ? (
          <ContactForm
            contact={contact}
            action={action}
            onSaved={() => setEditing(false)}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <dl className="grid grid-cols-[minmax(0,8.75rem)_minmax(0,1fr)] text-sm">
            {FIELDS.map(([label, key]) => (
              <div key={key} className="contents [&:not(:first-child)>*]:border-t [&>*]:border-border">
                <dt className="py-2.5 text-muted-foreground">{label}</dt>
                <dd
                  className={
                    contact[key]
                      ? "py-2.5 whitespace-pre-line text-foreground"
                      : "py-2.5 text-muted-foreground italic"
                  }
                >
                  {contact[key] ?? "Non renseigné"}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
