import fs from "fs/promises";
import path from "path";
import { Pool, RowDataPacket } from "mysql2/promise";
import { db } from "../configs/db";
import { log } from "./logger";

interface MigrationRecord extends RowDataPacket {
  id: number;
  name: string;
  run_on: Date;
}

export class MigrationRunner {
  private readonly migrationsPath: string;

  constructor(private db: Pool, migrationsDir?: string) {
    this.migrationsPath = migrationsDir || path.join(__dirname, "../../migrations");
  }

  public async run(): Promise<void> {
    await this.createMigrationsTable();
    const appliedMigrations = await this.getAppliedMigrations();
    await this.executeNewMigrations(appliedMigrations);
    log.info("✅ All migrations applied successfully!");
  }

  private async createMigrationsTable() {
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        run_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  private async getAppliedMigrations(): Promise<string[]> {
    const [rows] = await this.db.query<MigrationRecord[]>("SELECT name FROM migrations");
    return rows.map(r => r.name);
  }

  private async executeNewMigrations(appliedNames: string[]) {
    const files = (await fs.readdir(this.migrationsPath)).filter(f => f.endsWith(".sql")).sort();

    for (const file of files) {
      if (appliedNames.includes(file)) {
        log.info(`⏭ Already applied: ${file}`);
        continue;
      }
      await this.executeMigration(file);
    }
  }

  private async executeMigration(filename: string) {
    const sql = await fs.readFile(path.join(this.migrationsPath, filename), "utf-8");
    const connection = await this.db.getConnection();

    try {
      await connection.beginTransaction();
      await connection.query(sql);
      await connection.query("INSERT INTO migrations (name) VALUES (?)", [filename]);
      await connection.commit();
      log.info(`✅ Applied: ${filename}`);
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
}
