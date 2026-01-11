// deno-lint-ignore-file no-explicit-any
import { dirname, fromFileUrl, join } from "@std/path";
import { Kysely } from "kysely";
import { getDatabase } from "../src/shared/infrastructure/persistence/index.ts";

const SCRIPT_DIR = dirname(fromFileUrl(import.meta.url));
const MIGRATIONS_DIR = join(SCRIPT_DIR, "..", "src", "shared", "infrastructure", "persistence", "migrations");

interface MigrationMetadata {
  name: string;
  up: (db: Kysely<any>) => Promise<void>;
  down: (db: Kysely<any>) => Promise<void>;
}

class DenoFileMigrationProvider {
  private migrationsDir: string;

  constructor(migrationsDir: string) {
    this.migrationsDir = migrationsDir;
  }

  async getMigrations(): Promise<MigrationMetadata[]> {
    const migrations: MigrationMetadata[] = [];

    try {
      for await (const entry of Deno.readDir(this.migrationsDir)) {
        if (!entry.isFile || !entry.name.endsWith(".ts")) continue;

        const filepath = join(this.migrationsDir, entry.name);
        const name = entry.name.replace(".ts", "");
        
        try {
          // Dynamically import migration module
          const migrationModule = await import(`file://${filepath}`);
          
          if (typeof migrationModule.up === "function" && typeof migrationModule.down === "function") {
            migrations.push({
              name,
              up: migrationModule.up,
              down: migrationModule.down,
            });
          }
        } catch (error) {
          console.error(`Failed to load migration ${name}:`, error);
        }
      }
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        return [];
      }
      throw error;
    }

    // Sort by timestamp (filename prefix)
    migrations.sort((a, b) => a.name.localeCompare(b.name));

    return migrations;
  }
}

async function createMigrationsTable(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("dn_migrations")
    .ifNotExists()
    .addColumn("id", "integer", (col) => col.autoIncrement().primaryKey())
    .addColumn("name", "varchar(255)", (col) => col.notNull().unique())
    .addColumn("executed_at", "timestamp", (col) => col.notNull().defaultTo(new Date()))
    .execute();
}

async function getMigrator() {
  const db = getDatabase();
  
  // Ensure migrations table exists
  await createMigrationsTable(db);

  const provider = new DenoFileMigrationProvider(MIGRATIONS_DIR);
  
  // Get all available migrations
  const migrations = await provider.getMigrations();
  
  // Get executed migrations from database
  const executedMigrations = await db
    .selectFrom("dn_migrations" as any)
    .selectAll()
    .orderBy("id" as any, "desc")
    .execute();

  return {
    rollbackTo: async (targetName?: string) => {
      if (executedMigrations.length === 0) {
        console.log("No migrations to rollback.");
        return { results: [], error: null };
      }

      const toRollback = targetName
        ? executedMigrations.filter((m: any) => m.name >= targetName)
        : [executedMigrations[0]]; // Only rollback last migration if no target specified

      if (toRollback.length === 0) {
        console.log("No migrations to rollback.");
        return { results: [], error: null };
      }

      console.log(`Rolling back ${toRollback.length} migration(s)...`);
      console.log(`Migrations to rollback:`);
      toRollback.forEach((m: any) => console.log(`  - ${m.name}`));
      
      const results: Array<{ status: string; migrationName: string }> = [];
      
      // Reverse order for rollback (most recent first)
      const sortedToRollback = [...toRollback].reverse();
      
      for (const migrationRecord of sortedToRollback) {
        const migration = migrations.find((m) => m.name === (migrationRecord as any).name);
        
        if (!migration) {
          console.error(`  ✗ Migration file "${(migrationRecord as any).name}" not found`);
          results.push({ status: "Error", migrationName: (migrationRecord as any).name });
          continue;
        }

        try {
          console.log(`  → Rolling back migration "${migration.name}"...`);
          await migration.down(db);
          
          // Remove migration from executed list
          await db
            .deleteFrom("dn_migrations" as any)
            .where("name" as any, "=", migration.name)
            .execute();
          
          console.log(`  ✓ Migration "${migration.name}" was rolled back successfully`);
          results.push({ status: "Success", migrationName: migration.name });
        } catch (error) {
          console.error(`  ✗ Failed to rollback migration "${migration.name}"`);
          console.error(`  Error:`, error);
          results.push({ status: "Error", migrationName: migration.name });
          return { results, error };
        }
      }

      console.log(`\nRollback completed successfully!`);
      return { results, error: null };
    },

    // deno-lint-ignore require-await
    getExecutedMigrations: async () => {
      return executedMigrations;
    },
  };
}

function parseArgs(): { dryRun: boolean; target?: string } {
  const dryRunIndex = Deno.args.indexOf("--dry-run");
  const targetIndex = Deno.args.indexOf("--target");
  
  let target: string | undefined;
  if (targetIndex !== -1 && targetIndex + 1 < Deno.args.length) {
    target = Deno.args[targetIndex + 1];
  }
  
  return { dryRun: dryRunIndex !== -1, target };
}

async function showDryRun(migrator: Awaited<ReturnType<typeof getMigrator>>, target?: string) {
  const executed = await migrator.getExecutedMigrations();
  
  if (executed.length === 0) {
    console.log("Dry-run mode - no migrations to rollback.");
  } else {
    const toRollback = target
      ? executed.filter((m: any) => m.name >= target)
      : [executed[0]];

    if (toRollback.length === 0) {
      console.log("Dry-run mode - no migrations to rollback.");
    } else {
      console.log(`Dry-run mode - would rollback ${toRollback.length} migration(s):`);
      toRollback.forEach((m: any) => console.log(`  ${m.name}`));
    }
  }
}

async function confirm(message: string): Promise<boolean> {
  console.log(`${message} (y/N): `);
  
  const buf = new Uint8Array(1024);
  const n = await Deno.stdin.read(buf);
  if (n === null) return false;
  
  const answer = new TextDecoder().decode(buf.subarray(0, n)).trim().toLowerCase();
  if (answer === 'y' || answer === 'yes') {
    return true;
  }
  
  return false;
}

async function main() {
  const { dryRun, target } = parseArgs();

  if (dryRun) {
    console.log("Dry-run mode - no actual changes will be made\n");
  }

  try {
    const migrator = await getMigrator();

    if (dryRun) {
      await showDryRun(migrator, target);
      return;
    }

    // Ask for confirmation before rollback
    const shouldProceed = await confirm("Are you sure you want to rollback? This will revert database changes.");
    if (!shouldProceed) {
      console.log("Rollback cancelled.");
      return;
    }

    const { error } = await migrator.rollbackTo(target);

    if (error) {
      console.error("\nFailed to rollback");
      Deno.exit(1);
    }
  } catch (error) {
    console.error("Error during rollback:", error);
    Deno.exit(1);
  }
}

main();
