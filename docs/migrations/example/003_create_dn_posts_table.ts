// deno-lint-ignore-file no-explicit-any
import { Kysely } from 'kysely'

/**
 * Creates posts table with foreign key relationship to users
 * 
 * This migration demonstrates:
 * - Creating tables with foreign key relationships
 * - Using references to link to other tables
 * - Adding unique constraints
 * - Composite indexes
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('dn_posts')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.autoIncrement().primaryKey())
    .addColumn('user_id', 'integer', (col) => col.notNull().references('dn_users.id').onDelete('cascade').onUpdate('cascade'))
    .addColumn('title', 'varchar(255)', (col) => col.notNull())
    .addColumn('slug', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('content', 'text', (col) => col.notNull())
    .addColumn('published_at', 'timestamp', (col) => col.defaultTo(null))
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(new Date()))
    .addColumn('updated_at', 'timestamp', (col) => col.notNull().defaultTo(new Date()))
    .execute();

  // Create index for user lookups
  await db.schema
    .createIndex('idx_dn_posts_user_id')
    .ifNotExists()
    .on('dn_posts')
    .column('user_id')
    .execute();

  // Create index for slug lookups
  await db.schema
    .createIndex('idx_dn_posts_slug')
    .ifNotExists()
    .on('dn_posts')
    .column('slug')
    .execute();

  // Create composite index for published posts
  await db.schema
    .createIndex('idx_dn_posts_published_user')
    .ifNotExists()
    .on('dn_posts')
    .columns(['published_at', 'user_id'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop indexes
  await db.schema
    .dropIndex('idx_dn_posts_user_id')
    .ifExists()
    .execute();

  await db.schema
    .dropIndex('idx_dn_posts_slug')
    .ifExists()
    .execute();

  await db.schema
    .dropIndex('idx_dn_posts_published_user')
    .ifExists()
    .execute();

  // Drop table
  await db.schema
    .dropTable('dn_posts')
    .ifExists()
    .execute();
}
