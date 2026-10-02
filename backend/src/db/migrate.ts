import path from "node:path";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { databaseUrl } from "../config/env";
import { createDb } from "./client";

async function main() {
  const { db, pool } = createDb(databaseUrl());
  await migrate(db, { migrationsFolder: path.join(__dirname, "../../drizzle") });
  await pool.end();
  console.log("Migrations applied");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
