import { MigrationRunner } from "../src/utils/migrationRunner";
import { db } from "../src/configs/db";

async function main() {
  const runner = new MigrationRunner(db);
  try {
    await runner.run();
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

main();
