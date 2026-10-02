import { databaseUrl } from "../config/env";
import { seedCatalogue } from "./catalogue";
import { createDb } from "./client";

async function main() {
  const { db, pool } = createDb(databaseUrl());
  const counts = await seedCatalogue(db);
  await pool.end();
  console.log(`Seeded ${counts.tasks} tasks across ${counts.categories} categories`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
