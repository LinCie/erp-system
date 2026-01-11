// deno-lint-ignore-file no-explicit-any
import { Kysely } from 'kysely'

/**
 * Adds profile-related columns to dn_users table
 * 
 * This migration demonstrates:
 * - Adding columns to an existing table
 * - Adding nullable columns (phone number)
 * - Adding columns with default values
 * - Modifying an existing table structure
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('dn_users')
    .addColumn('phone', 'varchar(20)', (col) => col.defaultTo(null))
    .addColumn('avatar_url', 'varchar(500)', (col) => col.defaultTo(null))
    .addColumn('bio', 'text', (col) => col.defaultTo(null))
    .addColumn('last_login_at', 'timestamp', (col) => col.defaultTo(null))
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Remove the added columns
  await db.schema
    .alterTable('dn_users')
    .dropColumn('phone')
    .execute();

  await db.schema
    .alterTable('dn_users')
    .dropColumn('avatar_url')
    .execute();

  await db.schema
    .alterTable('dn_users')
    .dropColumn('bio')
    .execute();

  await db.schema
    .alterTable('dn_users')
    .dropColumn('last_login_at')
    .execute();
}
