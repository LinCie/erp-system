# Migration Examples

This directory contains example migration files demonstrating various database schema changes using Kysely and the `dn_` prefix convention.

## Example Migrations

### 001_create_dn_users_table.ts
**Demonstrates:**
- Creating a new table with common fields
- Auto-incrementing primary keys
- String fields with length limits
- Unique constraints
- Default values
- Not null constraints
- Indexes for performance
- Timestamps for tracking

**Table created:** `dn_users`

### 002_add_profile_to_dn_users.ts
**Demonstrates:**
- Adding columns to an existing table
- Nullable columns (phone, bio)
- Columns with default values
- Modifying table structure without dropping it

**Table modified:** `dn_users`

### 003_create_dn_posts_table.ts
**Demonstrates:**
- Creating tables with foreign key relationships
- Referencing other tables
- Cascade delete and update behavior
- Unique constraints (slug)
- Composite indexes
- Many-to-one relationships

**Table created:** `dn_posts`
**Relationship:** `dn_posts.user_id → dn_users.id`

### 004_rename_column_in_dn_users.ts
**Demonstrates:**
- Column renaming strategy
- Working around MySQL limitations
- Migration patterns for data transformation
- Using raw SQL when Kysely limitations exist

**Note:** This is an illustrative example showing the concept of renaming columns, which typically requires raw SQL in MySQL.

### 005_create_dn_post_tags_table.ts
**Demonstrates:**
- Many-to-many relationships
- Join tables (pivot tables)
- Foreign keys to multiple tables
- Preventing duplicate relationships
- Cascade deletes for consistency

**Tables created:** `dn_tags`, `dn_post_tags`
**Relationships:** 
- `dn_post_tags.post_id → dn_posts.id`
- `dn_post_tags.tag_id → dn_tags.id`

### 006_populate_initial_data.ts
**Demonstrates:**
- Inserting seed data
- Using both Kysely query builder and raw SQL
- Handling multiple tables in one migration
- Data transformations
- Proper cleanup order (reverse of dependencies)

**Tables modified:** All previous tables

## Common Patterns

### Creating Tables

```typescript
await db.schema
  .createTable('dn_table_name')
  .ifNotExists()
  .addColumn('id', 'integer', (col) => col.autoIncrement().primaryKey())
  .addColumn('name', 'varchar(255)', (col) => col.notNull())
  .execute();
```

### Adding Foreign Keys

```typescript
.addColumn('user_id', 'integer', (col) => col.notNull().references('dn_users.id').onDelete('cascade').onUpdate('cascade'))
```

### Creating Indexes

```typescript
await db.schema
  .createIndex('idx_table_column')
  .ifNotExists()
  .on('dn_table_name')
  .column('column_name')
  .execute();
```

### Composite Indexes

```typescript
await db.schema
  .createIndex('idx_table_columns')
  .ifNotExists()
  .on('dn_table_name')
  .columns(['column1', 'column2'])
  .execute();
```

### Inserting Data

```typescript
await db
  .insertInto('dn_users')
  .values([
    { name: 'John', email: 'john@example.com' },
    { name: 'Jane', email: 'jane@example.com' },
  ])
  .execute();
```

### Using Raw SQL

```typescript
import { sql } from 'kysely'

await sql`
  INSERT INTO dn_posts (title, content)
  VALUES ('My Post', 'Post content')
`.execute(db);
```

## Important Notes

### Prefix Convention
All tables MUST use the `dn_` prefix to avoid conflicts with legacy Laravel tables.

### Reversibility
Every migration must have both `up()` and `down()` functions to enable rollbacks.

### Dependencies
When dropping tables or data, follow reverse dependency order:
1. Drop join tables first
2. Drop child tables (with foreign keys)
3. Drop parent tables (referenced by foreign keys)

### Safety First
- Use `.ifNotExists()` and `.ifExists()` for safety
- Test migrations in development first
- Use dry-run mode to preview changes: `deno task db:migrate --dry-run`

## Running Examples

These are example files for reference only. To run actual migrations:

```bash
# Create a new migration
deno task create:migration your_migration_name

# Run migrations
deno task db:migrate

# Rollback
deno task db:rollback
```

See [MIGRATIONS.md](../MIGRATIONS.md) for complete migration guide.
