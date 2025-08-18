import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { logger } from "../src/utils/logger";

dotenv.config();

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error("❌ Usage: npm run migrate:create <type> <name>");
  console.error("Type must be one of: create | drop | add");
  process.exit(1);
}

const type = args[0]; // create | drop | add
const name = args[1]; // e.g., users_table, phone_to_users
const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, "");
const fileName = `${timestamp}_${type}_${name}.sql`;

const migrationsPath = path.join(__dirname, "../migrations");

// Ensure migrations folder exists
if (!fs.existsSync(migrationsPath)) {
  fs.mkdirSync(migrationsPath, { recursive: true });
}

const filePath = path.join(migrationsPath, fileName);

let template = `-- Migration: ${type} ${name}\n-- Created at ${new Date().toISOString()}\n\n`;

switch (type) {
  case "create":
    template += `CREATE TABLE IF NOT EXISTS ${name} (\n  id INT AUTO_INCREMENT PRIMARY KEY\n);\n`;
    break;
  case "drop":
    template += `DROP TABLE IF EXISTS ${name};\n`;
    break;
  case "add":
    template += `ALTER TABLE ${name} ADD COLUMN new_column VARCHAR(255) NULL;\n`;
    break;
  default:
    console.error("❌ Invalid migration type. Must be create | drop | add");
    process.exit(1);
}

fs.writeFileSync(filePath, template);
logger.info(`✅ Migration file created: ${filePath}`);
