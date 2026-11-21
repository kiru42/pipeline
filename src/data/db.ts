import { createClient, type Client } from "@libsql/client";

const DEFAULT_URL = "file:.data/pipeline.db";

type DbConfig = { url: string; authToken?: string };

export function createDbClient(config?: DbConfig): Client {
  return createClient({
    url: config?.url ?? process.env.DATABASE_URL ?? DEFAULT_URL,
    authToken: config?.authToken ?? process.env.DATABASE_AUTH_TOKEN,
  });
}

export async function migrate(client: Client): Promise<void> {
  await client.execute(
    "CREATE TABLE IF NOT EXISTS contacts (id TEXT PRIMARY KEY, name TEXT NOT NULL)",
  );
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
