// deno-lint-ignore-file no-explicit-any
import { Kysely } from 'kysely'

/**
 * Renames a column in dn_users table
 * 
 * This migration demonstrates:
 * - Renaming an existing column
 * - Using alterTable to modify columns
 * 
 * NOTE: MySQL doesn't support direct column renaming in Kysely's schema builder.
 * You would typically use raw SQL for this operation.
 */
export async function up(db: Kysely<any>): Promise<void> {
  // Note: Kysely's MySQL dialect doesn't have a direct renameColumn method.
  // For MySQL, you would typically use raw SQL:
  // await db.executeQuery(sql`ALTER TABLE dn_users RENAME COLUMN old_name TO new_name`)
  
  // This is an illustrative example. In practice, you might:
  // 1. Add a new column with the desired name
  // 2. Copy data from old column to new column
  // 3. Drop the old column
  
  // Example approach:
  await db.schema
    .alterTable('dn_users')
    .addColumn('new_field_name', 'varchar(255)', (col) => col.defaultTo(null))
    .execute();
  
  // Copy data (requires raw SQL)
  // UPDATE dn_users SET new_field_name = old_field_name
  
  // Drop old column (requires raw SQL)
  // ALTER TABLE dn_users DROP COLUMN old_field_name
}

export async function down(db: Kysely<any>): Promise<void> {
  // Revert: Rename back to original
  await db.schema
    .alterTable('dn_users')
    .addColumn('old_field_name', 'varchar(255)', (col) => col.defaultTo(null))
    .execute();
}
