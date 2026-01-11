// deno-lint-ignore-file no-explicit-any
import { Kysely } from 'kysely'

/**
 * Creates the users table for the ERP system
 * 
 * This migration demonstrates creating a basic table with common fields:
 * - Auto-incrementing primary key
 * - String fields with length limits
 * - Default values
 * - Not null constraints
 * - Indexes for performance
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('dn_users')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.autoIncrement().primaryKey())
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('email', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('password', 'varchar(255)', (col) => col.notNull())
    .addColumn('status', 'varchar(50)', (col) => col.notNull().defaultTo('active'))
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(new Date()))
    .addColumn('updated_at', 'timestamp', (col) => col.notNull().defaultTo(new Date()))
    .addColumn('deleted_at', 'timestamp', (col) => col.defaultTo(null))
    .execute();

  // Create index for email lookups
  await db.schema
    .createIndex('idx_dn_users_email')
    .ifNotExists()
    .on('dn_users')
    .column('email')
    .execute();

  // Create index for status filtering
  await db.schema
    .createIndex('idx_dn_users_status')
    .ifNotExists()
    .on('dn_users')
    .column('status')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop indexes first
  await db.schema
    .dropIndex('idx_dn_users_email')
    .ifExists()
    .execute();

  await db.schema
    .dropIndex('idx_dn_users_status')
    .ifExists()
    .execute();

  // Then drop the table
  await db.schema
    .dropTable('dn_users')
    .ifExists()
    .execute();
}
