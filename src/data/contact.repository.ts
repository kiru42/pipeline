import type { Client } from "@libsql/client";

export type Contact = { id: string; name: string };

export interface ContactRepository {
  list(): Promise<Contact[]>;
  create(contact: Contact): Promise<void>;
}

export function createLibsqlContactRepository(client: Client): ContactRepository {
  return {
    async list() {
      const result = await client.execute(
        "SELECT id, name FROM contacts ORDER BY rowid",
      );
      return result.rows.map((row) => ({
        id: String(row.id),
        name: String(row.name),
      }));
    },
    async create(contact) {
      await client.execute({
        sql: "INSERT INTO contacts (id, name) VALUES (?, ?)",
        args: [contact.id, contact.name],
      });
    },
  };
}
