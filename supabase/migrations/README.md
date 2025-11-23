# Database Migrations

This directory contains SQL migration files for the EzBox database schema.

## Migration Files

Migrations are numbered sequentially and should never be modified once applied:

- `0001_init.sql` - Initial schema creation
- `0002_seed_data.sql` - Seed data with sample products
- `0003_remove_quantity_parameter_group.sql` - Remove redundant Quantity parameter group
- `0004_add_checkout_fields.sql` - Add name and secondary_phone fields for checkout

## How to Apply Migrations

### 1. Set up your environment

Create a `.env` file with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_PASSWORD=your-database-password
```

Get the `SUPABASE_PASSWORD` from: **Supabase Dashboard → Project Settings → Database → Database Password**

### 2. Run pending migrations

```bash
npm run migrate:run
```

This will:
- Connect to your database
- Check which migrations haven't been applied yet
- Show you the pending migrations
- Ask for confirmation before applying
- Execute the migrations automatically

### 3. That's it!

The script handles everything automatically. No manual SQL copying needed.

## Creating New Migrations

1. Create a new file: `supabase/migrations/000X_description.sql`
2. Write your SQL migration
3. Include a version tracking line at the end:
   ```sql
   INSERT INTO schema_migrations (version) VALUES ('000X_description');
   ```
4. Apply to Supabase:
   ```bash
   npm run migrate:run
   ```

## Migration Tracking

The `schema_migrations` table tracks which migrations have been applied:

```sql
SELECT * FROM schema_migrations ORDER BY applied_at;
```

## Important Rules

1. **Never modify applied migrations** - Create a new migration instead
2. **Migrations are forward-only** - No rollback scripts
3. **Keep migrations atomic** - Each should be a single logical change
4. **Add version tracking** - Always insert into `schema_migrations`

## Applying the Quantity Parameter Group Removal

The migration `0003_remove_quantity_parameter_group.sql` removes the redundant Quantity parameter group.

To apply it:

1. Add `SUPABASE_PASSWORD` to your `.env` file (see above)
2. Run: `npm run migrate:run`
3. Type `yes` when prompted

The script will:
- Automatically construct the database connection from your Supabase URL
- Connect securely with SSL
- Execute the migration
- Track it in the `schema_migrations` table
