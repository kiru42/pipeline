import type { Client, Row } from "@libsql/client";

/** Étapes du pipeline, telles que stockées en base. */
export type Stage =
  | "nouveau"
  | "contacte"
  | "rendez-vous"
  | "proposition"
  | "gagne"
  | "perdu";

export type Contact = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  note: string | null;
  stage: Stage;
};

export interface ContactRepository {
  list(): Promise<Contact[]>;
  findById(id: string): Promise<Contact | null>;
  create(contact: Contact): Promise<void>;
  update(contact: Contact): Promise<void>;
}

const COLUMNS = "id, name, company, email, phone, note, stage";

function nullableText(value: Row[string]): string | null {
  return value === null || value === undefined ? null : String(value);
}

function toContact(row: Row): Contact {
  return {
    id: String(row.id),
    name: String(row.name),
    company: nullableText(row.company),
    email: nullableText(row.email),
    phone: nullableText(row.phone),
    note: nullableText(row.note),
    stage: String(row.stage) as Stage,
  };
}

export function createLibsqlContactRepository(client: Client): ContactRepository {
  return {
    async list() {
      const result = await client.execute(
        `SELECT ${COLUMNS} FROM contacts ORDER BY rowid`,
      );
      return result.rows.map(toContact);
    },

    async findById(id) {
      const result = await client.execute({
        sql: `SELECT ${COLUMNS} FROM contacts WHERE id = ?`,
        args: [id],
      });
      const row = result.rows[0];
      return row ? toContact(row) : null;
    },

    async create(contact) {
      await client.execute({
        sql: `INSERT INTO contacts (${COLUMNS}) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          contact.id,
          contact.name,
          contact.company,
          contact.email,
          contact.phone,
          contact.note,
          contact.stage,
        ],
      });
    },

    async update(contact) {
      await client.execute({
        sql: "UPDATE contacts SET name = ?, company = ?, email = ?, phone = ?, note = ?, stage = ? WHERE id = ?",
        args: [
          contact.name,
          contact.company,
          contact.email,
          contact.phone,
          contact.note,
          contact.stage,
          contact.id,
        ],
      });
    },
  };
}
