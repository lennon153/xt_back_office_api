import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { logger } from "../utils/logger";

dotenv.config();

// Strict type checking for database configuration
interface DatabaseConfig {
  host: string;
  user: string;
  password: string;
  database: string;
  port: number;
  waitForConnections?: boolean;
  connectionLimit?: number;
  queueLimit?: number;
  enableKeepAlive?: boolean;
  keepAliveInitialDelay?: number;
  timezone?: string;
}

function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getDatabaseConfig(): DatabaseConfig {
  return {
    host: getRequiredEnvVar("DB_HOST"),
    user: getRequiredEnvVar("DB_USER"),
    password: getRequiredEnvVar("DB_PASSWORD"),
    database: getRequiredEnvVar("DB_NAME"),
    port: parseInt(getRequiredEnvVar("DB_PORT")),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    timezone: 'Z'
  };
}

// Create connection pool with validated config
export const db = mysql.createPool(getDatabaseConfig());

// Connection test with proper error handling
async function testConnection() {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.ping();
    logger.info("✅ Database connected successfully");
  } catch (err) {
    logger.error("❌ Database connection failed:", err instanceof Error ? err.message : err);
    throw err; // Re-throw to allow application to handle
  } finally {
    if (connection) await connection.release();
  }
}

// Test connection on startup
testConnection().catch(() => {
  // Application can decide whether to exit or retry
  process.exit(1); // Uncomment if you want to exit on failure
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await db.end();
    logger.info("Database pool closed gracefully");
  } catch (err) {
    logger.error("Error closing database pool:", err instanceof Error ? err.message : err);
  } finally {
    process.exit(0);
  }
});