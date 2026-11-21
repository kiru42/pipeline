import { createClient, type Client } from "@libsql/client";

const DEFAULT_URL = "file:.data/pipeline.db";

type DbConfig = { url: string; authToken?: string };

export function createDbClient(config?: DbConfig): Client {
  return createClient({
    url: config?.url ?? process.env.DATABASE_URL ?? DEFAULT_URL,
    authToken: config?.authToken ?? process.env.DATABASE_AUTH_TOKEN,
  });
}

/** Migrations numérotées, appliquées une seule fois et dans l'ordre. Ne jamais modifier une migration déjà livrée. */
const MIGRATIONS: { version: number; statements: string[] }[] = [
  {
    version: 1,
    statements: [
      "CREATE TABLE IF NOT EXISTS contacts (id TEXT PRIMARY KEY, name TEXT NOT NULL)",
    ],
  },
  {
    version: 2,
    statements: [
      "ALTER TABLE contacts ADD COLUMN company TEXT",
      "ALTER TABLE contacts ADD COLUMN email TEXT",
      "ALTER TABLE contacts ADD COLUMN phone TEXT",
      "ALTER TABLE contacts ADD COLUMN note TEXT",
    ],
  },
];

export async function migrate(client: Client): Promise<void> {
  await client.execute(
    "CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY)",
  );
  const applied = await client.execute("SELECT version FROM schema_migrations");
  const done = new Set(applied.rows.map((row) => Number(row.version)));

  for (const migration of MIGRATIONS) {
    if (done.has(migration.version)) continue;
    await client.batch(
      [
        ...migration.statements,
        {
          sql: "INSERT INTO schema_migrations (version) VALUES (?)",
          args: [migration.version],
        },
      ],
      "write",
    );
  }
}

let db: Promise<Client> | undefined;

/** Client partagé par l'application, migré au premier appel. */
export function getDb(): Promise<Client> {
  db ??= (async () => {
    const url = process.env.DATABASE_URL ?? DEFAULT_URL;
    if (url.startsWith("file:")) {
      const { mkdirSync } = await import("node:fs");
      const { dirname } = await import("node:path");
      mkdirSync(dirname(url.slice("file:".length)), { recursive: true });
    }
    const client = createDbClient();
    await migrate(client);
    return client;
  })();
  return db;
}
