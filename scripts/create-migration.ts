import { dirname, fromFileUrl, join } from "@std/path";

const SCRIPT_DIR = dirname(fromFileUrl(import.meta.url));
const MIGRATIONS_DIR = join(SCRIPT_DIR, "..", "src", "shared", "infrastructure", "persistence", "migrations");

function getMigrationName(): string {
  const name = Deno.args[0];
  if (!name) {
    console.error("Usage: deno task create:migration <migration-name>");
    console.error("Example: deno task create:migration create_users_table");
    console.error("Example: deno task create:migration add_status_to_users");
    Deno.exit(1);
  }
  return name;
}

function generateTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

function generateMigrationContent(): string {
  return `import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  // Migration code
}

export async function down(db: Kysely<any>): Promise<void> {
  // Migration code
}
`;
}

async function createMigration(name: string) {
  const timestamp = generateTimestamp();
  const filename = `${timestamp}_${name}.ts`;
  const filepath = join(MIGRATIONS_DIR, filename);
  const content = generateMigrationContent();

  // Create migrations directory if it doesn't exist
  try {
    await Deno.mkdir(MIGRATIONS_DIR, { recursive: true });
  } catch (error) {
    if (!(error instanceof Deno.errors.AlreadyExists)) {
      console.error(`Error creating migrations directory:`, error);
      Deno.exit(1);
    }
  }

  // Check if migration file already exists
  try {
    await Deno.stat(filepath);
    console.error(`Error: Migration file '${filename}' already exists!`);
    Deno.exit(1);
  } catch {
    // File doesn't exist, continue
  }

  // Write migration file
  await Deno.writeTextFile(filepath, content);

  console.log(`✓ Migration created: ${filepath}`);
  console.log(`
Next steps:
  1. Edit the migration file and add your migration logic
  2. Run the migration against your database
  3. Run 'deno task db:generate' to update TypeScript types
`);
}

const migrationName = getMigrationName();
await createMigration(migrationName);
