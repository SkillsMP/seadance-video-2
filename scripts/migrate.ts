import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import postgres from "postgres";
import fs from "fs";
import path from "path";

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  console.log("Connecting to PostgreSQL...");
  const sql = postgres(databaseUrl, { prepare: false });

  const migrationPath = path.join(
    process.cwd(),
    "src",
    "db",
    "migrations",
    "0000_concerned_daredevil.sql"
  );

  const migrationSql = fs.readFileSync(migrationPath, "utf-8");

  console.log("Creating schema and tables if they don't exist...");
  // Split statements by statement-breakpoint or semicolon
  const statements = migrationSql
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    try {
      await sql.unsafe(stmt);
      console.log("Executed statement successfully.");
    } catch (err: any) {
      console.log(`Statement notice/error: ${err.message}`);
    }
  }

  console.log("Migration finished successfully.");
  await sql.end();
  process.exit(0);
}

runMigration().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
