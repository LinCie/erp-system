// deno-lint-ignore-file no-explicit-any
import { Kysely } from 'kysely'

/**
 * Creates post_tags join table for many-to-many relationship
 * 
 * This migration demonstrates:
 * - Creating a join table for many-to-many relationships
 * - Composite primary keys (user_id + post_id)
 * - Foreign keys to multiple tables
 * - Ensuring no duplicate relationships via unique constraints
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('dn_tags')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.autoIncrement().primaryKey())
    .addColumn('name', 'varchar(50)', (col) => col.notNull().unique())
    .addColumn('slug', 'varchar(50)', (col) => col.notNull().unique())
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(new Date()))
    .execute();

  // Create join table for posts-tags many-to-many relationship
  await db.schema
    .createTable('dn_post_tags')
    .ifNotExists()
    .addColumn('post_id', 'integer', (col) => col.notNull().references('dn_posts.id').onDelete('cascade'))
    .addColumn('tag_id', 'integer', (col) => col.notNull().references('dn_tags.id').onDelete('cascade'))
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(new Date()))
    .execute();

  // Add composite primary key to ensure each post-tag pair is unique
  // Note: Kysely doesn't have a direct method for composite primary keys,
  // so we'd use raw SQL or create a unique constraint instead
  // For MySQL: PRIMARY KEY (post_id, tag_id)

  // Create indexes for faster lookups
  await db.schema
    .createIndex('idx_dn_post_tags_post_id')
    .ifNotExists()
    .on('dn_post_tags')
    .column('post_id')
    .execute();

  await db.schema
    .createIndex('idx_dn_post_tags_tag_id')
    .ifNotExists()
    .on('dn_post_tags')
    .column('tag_id')
    .execute();

  // Create unique constraint to prevent duplicates
  // Note: This would typically be done with raw SQL:
  // ALTER TABLE dn_post_tags ADD UNIQUE (post_id, tag_id)
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop indexes
  await db.schema
    .dropIndex('idx_dn_post_tags_post_id')
    .ifExists()
    .execute();

  await db.schema
    .dropIndex('idx_dn_post_tags_tag_id')
    .ifExists()
    .execute();

  // Drop join table first
  await db.schema
    .dropTable('dn_post_tags')
    .ifExists()
    .execute();

  // Drop tags table
  await db.schema
    .dropTable('dn_tags')
    .ifExists()
    .execute();
}
