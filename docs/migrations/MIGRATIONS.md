# Database Migrations Guide

This guide explains how to manage database migrations for the ERP system.

## Overview

The ERP system uses a custom Kysely-based migration system that:
- Creates timestamp-based migration files
- Tracks executed migrations in a `dn_migrations` table
- Supports both forward migrations and rollbacks
- Works with your external MySQL database
- **All new tables must be prefixed with `dn_` to avoid conflicts with legacy Laravel tables**

## Creating Migrations

### Create a New Migration File

```bash
deno task create:migration <migration-name>
```

Example:
```bash
deno task create:migration create_users_table
```

This creates a file like:
```
src/shared/infrastructure/persistence/migrations/20250111200000_create_users_table.ts
```

### Migration File Structure

```typescript
import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  // Apply migration (e.g., create tables, add columns)
  // IMPORTANT: All new tables must be prefixed with 'dn_'
  await db.schema
    .createTable('dn_users')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.autoIncrement().primaryKey())
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Revert migration (e.g., drop tables, remove columns)
  await db.schema
    .dropTable('dn_users')
    .ifExists()
    .execute();
}
```

**Important Note:** Since this system migrated from a Laravel backend, all new tables must be prefixed with `dn_` to avoid conflicts with existing legacy tables.

## Running Migrations

### Development

Run migrations manually during development:

```bash
deno task db:migrate
```

Dry-run mode (preview without executing):
```bash
deno task db:migrate --dry-run
```

### Production

Migrations run automatically during deployment via Docker Compose using the latest Docker Compose conventions with `depends_on` conditions.

#### Option 1: Run Migrations Separately

Run migrations before starting the app:

```bash
# Run migrations one-time
docker-compose -f docker-compose.migrations.yml run --rm migrations

# Start the application
docker-compose up -d app
```

#### Option 2: Start App with Automatic Migrations

Start the app (migrations run automatically first):

```bash
docker-compose up -d app
```

The app waits for migrations to complete successfully before starting, thanks to the `service_completed_successfully` condition in the `depends_on` configuration.

## Rolling Back Migrations

### Development

Rollback the last migration:

```bash
deno task db:rollback
```

You'll be prompted for confirmation.

Rollback with dry-run:
```bash
deno task db:rollback --dry-run
```

### Production

Rollbacks should be done manually and carefully:

```bash
# Preview rollback
docker-compose -f docker-compose.migrations.yml run --rm migrations deno task db:rollback --dry-run

# Execute rollback (after confirmation)
docker-compose -f docker-compose.migrations.yml run --rm migrations deno task db:rollback
```

**Warning**: Rollbacks in production require careful planning and testing.

## Migration Best Practices

### 1. Always Write Both `up` and `down` Functions

Every migration must be reversible:

```typescript
export async function up(db: Kysely<any>): Promise<void> {
  // Create table
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop table
}
```

### 2. Test Migrations in Development

Always test both `up` and `down`:

```bash
# Apply migration
deno task db:migrate

# Test the changes
# Verify data, API endpoints, etc.

# Rollback if needed
deno task db:rollback
```

### 3. Use `dn_` Prefix for All Tables

Since this system migrated from Laravel, all new tables must use the `dn_` prefix:

```typescript
// Good - new tables with dn_ prefix
await db.schema
  .createTable('dn_users')
  .ifNotExists()
  .execute();

await db.schema
  .createTable('dn_contacts')
  .ifNotExists()
  .execute();

// Bad - conflicts with legacy Laravel tables
await db.schema
  .createTable('users')
  .ifNotExists()
  .execute();
```

This prevents conflicts with existing Laravel database tables.

### 4. One Change Per Migration

Keep migrations focused and atomic:

```bash
# Good - separate migrations
deno task create:migration create_dn_users_table
deno task create:migration add_email_to_dn_users
deno task create:migration add_password_to_dn_users

# Bad - too much in one migration
deno task create:migration create_dn_users_with_email_password_and_indexes
```

Remember to use the `dn_` prefix for all table names!

### 5. Non-Breaking Changes First

When possible, make changes that don't break existing functionality:

```bash
# First (non-breaking)
deno task create:migration add_status_column_to_dn_users

# Second (breaking - after you've updated the code)
deno task create:migration remove_username_from_dn_users
```

### 6. Generate Types After Migrations

After running migrations, regenerate TypeScript types:

```bash
deno task db:generate
```

This updates `src/shared/infrastructure/persistence/database.d.ts` with the latest schema.

## Troubleshooting

### Migration Already Executed

If you see "No pending migrations to run", the migration was already executed.

Check executed migrations:

```sql
SELECT * FROM dn_migrations ORDER BY executed_at DESC;
```

### Migration Failed

If a migration fails:

1. Check the error message
2. Fix the migration file
3. Manually rollback if needed:
   ```bash
   deno task db:rollback
   ```
4. Re-run the migration:
   ```bash
   deno task db:migrate
   ```

### Database Connection Errors

Ensure `.env.production` contains the correct `DATABASE_URL`:

```env
DATABASE_URL=mysql://username:password@localhost:3306/database_name
```

### External MySQL Access

If migrations can't connect to external MySQL:

1. Verify MySQL is running and accessible
2. Check that `network_mode: host` is set in docker-compose.yml
3. Test the connection:
   ```bash
   mysql -h localhost -u username -p database_name
   ```

## Migrations Table

The system automatically creates a `dn_migrations` table to track execution:

```sql
CREATE TABLE dn_migrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

This table is also prefixed with `dn_` to avoid conflicts with the legacy Laravel migrations table.

## Environment Variables

Required for migrations:

```env
DATABASE_URL=mysql://username:password@host:port/database
```

For development, use the `.env` file.
For production, use the `.env.production` file.

## CI/CD Integration

### Example GitHub Actions

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Migrations
        run: |
          docker-compose -f docker-compose.migrations.yml run --rm migrations
      
      - name: Start Application
        run: |
          docker-compose up -d app
```

### Example Manual Deployment

```bash
# Pull latest code
git pull origin main

# Build Docker image
docker build -t erp-app .

# Run migrations
docker-compose -f docker-compose.migrations.yml run --rm migrations

# Start application
docker-compose up -d app
```

## Additional Resources

- [Deno Migration Script](scripts/migrate.ts)
- [Deno Rollback Script](scripts/rollback.ts)
- [Deno Migration Generator](scripts/create-migration.ts)
- [Docker Compose Migrations](docker-compose.migrations.yml)
- [Kysely Documentation](https://kysely.dev)
