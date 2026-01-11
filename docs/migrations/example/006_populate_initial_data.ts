// deno-lint-ignore-file no-explicit-any
import { Kysely, sql } from 'kysely'

/**
 * Populates tables with initial seed data
 * 
 * This migration demonstrates:
 * - Inserting data into existing tables
 * - Using raw SQL for complex operations
 * - Handling data transformations
 * - Working with multiple tables in one migration
 */
export async function up(db: Kysely<any>): Promise<void> {
  // Insert default user roles or status values
  await db
    .insertInto('dn_users')
    .values([
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: '$2b$10$HashedPasswordHere...', // Should be properly hashed
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Test User',
        email: 'test@example.com',
        password: '$2b$10$HashedPasswordHere...', // Should be properly hashed
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ])
    .execute();

  // Insert sample posts using raw SQL for more control
  await sql`
    INSERT INTO dn_posts (user_id, title, slug, content, published_at, created_at, updated_at)
    VALUES 
      (1, 'Welcome to ERP System', 'welcome-to-erp-system', 'This is the first post in our new system.', NOW(), NOW(), NOW()),
      (1, 'Getting Started', 'getting-started', 'Learn how to get started with our platform.', NOW(), NOW(), NOW())
  `.execute(db);

  // Insert sample tags
  await db
    .insertInto('dn_tags')
    .values([
      { name: 'Tutorial', slug: 'tutorial', created_at: new Date() },
      { name: 'News', slug: 'news', created_at: new Date() },
      { name: 'Update', slug: 'update', created_at: new Date() },
    ])
    .execute();

  // Associate tags with posts
  await sql`
    INSERT INTO dn_post_tags (post_id, tag_id, created_at)
    VALUES 
      (1, 1, NOW()),
      (2, 1, NOW()),
      (2, 2, NOW())
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Remove seed data - delete in reverse order of dependencies
  
  // Remove post-tag associations first
  await db
    .deleteFrom('dn_post_tags')
    .execute();

  // Remove tags
  await db
    .deleteFrom('dn_tags')
    .execute();

  // Remove posts
  await db
    .deleteFrom('dn_posts')
    .execute();

  // Remove users
  await db
    .deleteFrom('dn_users')
    .execute();
}
