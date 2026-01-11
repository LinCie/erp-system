# Migration System Summary

## Quick Reference

This document provides a quick overview of ERP system's migration setup.

## Key Points

### Table Prefix Convention
- **All new tables MUST be prefixed with `dn_`**
- This prevents conflicts with legacy Laravel tables
- Examples: `dn_users`, `dn_contacts`, `dn_inventories`

### Migration Table
- System uses `dn_migrations` table to track execution
- Also prefixed to avoid conflicts with Laravel's migrations table

## Common Commands

```bash
# Create new migration
deno task create:migration <migration-name>

# Run migrations (development)
deno task db:migrate

# Dry-run (preview)
deno task db:migrate --dry-run

# Rollback last migration
deno task db:rollback

# Rollback with dry-run
deno task db:rollback --dry-run

# Regenerate types after migrations
deno task db:generate
```

## Production Deployment

```bash
# Option 1: Run migrations separately
docker-compose -f docker-compose.migrations.yml run --rm migrations
docker-compose up -d app

# Option 2: Automatic migrations
docker-compose up -d app
# App waits for migrations to complete successfully
```

## Example Migration

```typescript
import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  // Remember: Always use dn_ prefix!
  await db.schema
    .createTable('dn_users')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.autoIncrement().primaryKey())
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .dropTable('dn_users')
    .ifExists()
    .execute();
}
```

## Files

- `scripts/create-migration.ts` - Migration generator
- `scripts/migrate.ts` - Migration runner
- `scripts/rollback.ts` - Rollback tool
- `docker-compose.migrations.yml` - Standalone migrations
- `docker-compose.yml` - App with migrations dependency
- `MIGRATIONS.md` - Full documentation

## Important Notes

1. **Never use table names without `dn_` prefix**
2. **Always test migrations in development first**
3. **Use `ifNotExists()` and `ifExists()` for safety**
4. **Generate types after running migrations with `deno task db:generate`**
