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
          // Dynamically import the migration module
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
        console.log("Migrations directory not found, creating it...");
        await Deno.mkdir(this.migrationsDir, { recursive: true });
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
    .orderBy("id" as any, "asc")
    .execute();

  const executedNames = new Set(executedMigrations.map((m: any) => m.name));
  
  // Filter out already executed migrations
  const pendingMigrations = migrations.filter((m) => !executedNames.has(m.name));

  return {
    migrateToLatest: async () => {
      if (pendingMigrations.length === 0) {
        console.log("No pending migrations to run.");
        return { results: [], error: null };
      }

      console.log(`Running ${pendingMigrations.length} migration(s)...`);
      
      const results: Array<{ status: string; migrationName: string }> = [];
      
      for (const migration of pendingMigrations) {
        try {
          console.log(`  → Executing migration "${migration.name}"...`);
          await migration.up(db);
          
          // Record migration as executed
          await db
            .insertInto("dn_migrations" as any)
            .values({ name: migration.name, executed_at: new Date() })
            .execute();
          
          console.log(`  ✓ Migration "${migration.name}" was executed successfully`);
          results.push({ status: "Success", migrationName: migration.name });
        } catch (error) {
          console.error(`  ✗ Failed to execute migration "${migration.name}"`);
          console.error(`  Error:`, error);
          results.push({ status: "Error", migrationName: migration.name });
          return { results, error };
        }
      }

      console.log(`\nAll migrations completed successfully!`);
      return { results, error: null };
    },

    rollbackTo: async (targetName?: string) => {
      const allExecutedMigrations = await db
        .selectFrom("migrations" as any)
        .selectAll()
        .orderBy("id" as any, "desc")
        .execute();

      if (allExecutedMigrations.length === 0) {
        console.log("No migrations to rollback.");
        return { results: [], error: null };
      }

      const toRollback = targetName
        ? allExecutedMigrations.filter((m: any) => m.name >= targetName)
        : [allExecutedMigrations[0]]; // Only rollback last migration if no target specified

      if (toRollback.length === 0) {
        console.log("No migrations to rollback.");
        return { results: [], error: null };
      }

      console.log(`Rolling back ${toRollback.length} migration(s)...`);
      
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
            .deleteFrom("migrations" as any)
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
    getPendingMigrations: async () => {
      return pendingMigrations;
    },
  };
}

function parseArgs(): { dryRun: boolean } {
  const dryRunIndex = Deno.args.indexOf("--dry-run");
  return { dryRun: dryRunIndex !== -1 };
}

async function showDryRun(migrator: Awaited<ReturnType<typeof getMigrator>>) {
  const pending = await migrator.getPendingMigrations();
  
  if (pending.length === 0) {
    console.log("Dry-run mode - no pending migrations to run.");
  } else {
    console.log(`Dry-run mode - would execute ${pending.length} migration(s):`);
    pending.forEach((m) => console.log(`  ${m.name}`));
  }
}

async function main() {
  const { dryRun } = parseArgs();

  if (dryRun) {
    console.log("Dry-run mode - no actual changes will be made\n");
  }

  try {
    const migrator = await getMigrator();

    if (dryRun) {
      await showDryRun(migrator);
      return;
    }

    const { error } = await migrator.migrateToLatest();

    if (error) {
      console.error("\nFailed to migrate");
      Deno.exit(1);
    }
  } catch (error) {
    console.error("Error during migration:", error);
    Deno.exit(1);
  }
}

main();
