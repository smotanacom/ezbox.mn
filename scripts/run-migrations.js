#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Load environment variables
require('dotenv').config();

function getDatabaseUrl() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePassword = process.env.SUPABASE_PASSWORD;

  if (!supabaseUrl) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL not found in environment');
    console.error('Please add it to your .env file');
    process.exit(1);
  }

  if (!supabasePassword) {
    console.error('Error: SUPABASE_PASSWORD not found in environment');
    console.error('Please add it to your .env file');
    console.error('Get it from: Supabase Dashboard → Project Settings → Database → Database Password');
    process.exit(1);
  }

  // Extract project reference from Supabase URL
  // e.g., https://abcdefgh.supabase.co -> abcdefgh
  const match = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
  if (!match) {
    console.error('Error: Invalid NEXT_PUBLIC_SUPABASE_URL format');
    console.error('Expected format: https://[project-ref].supabase.co');
    process.exit(1);
  }

  const projectRef = match[1];

  // Supabase direct connection format
  // Format: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
  const databaseUrl = `postgresql://postgres.${projectRef}:${supabasePassword}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`;

  return databaseUrl;
}

async function getClient() {
  const databaseUrl = getDatabaseUrl();
  const client = new Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('supabase.co') ? { rejectUnauthorized: false } : false,
  });
  await client.connect();
  return client;
}

async function getAppliedMigrations(client) {
  try {
    const result = await client.query(
      'SELECT version FROM schema_migrations ORDER BY applied_at'
    );
    return result.rows.map(row => row.version);
  } catch (error) {
    // Table might not exist yet
    if (error.code === '42P01') {
      return [];
    }
    throw error;
  }
}

async function getPendingMigrations(client) {
  const migrationsDir = path.join(__dirname, '../supabase/migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  const applied = await getAppliedMigrations(client);
  const pending = [];

  for (const file of files) {
    const version = path.basename(file, '.sql');
    if (!applied.includes(version)) {
      pending.push({
        file,
        version,
        path: path.join(migrationsDir, file),
      });
    }
  }

  return pending;
}

async function runMigration(client, migration) {
  console.log(`\nApplying migration: ${migration.version}`);

  const sql = fs.readFileSync(migration.path, 'utf8');

  try {
    // Execute the SQL
    await client.query(sql);
    console.log(`✓ Successfully applied ${migration.version}`);
  } catch (error) {
    console.error(`Failed to apply migration ${migration.version}:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('Checking for pending migrations...\n');

  let client;

  try {
    client = await getClient();
    console.log('✓ Connected to database\n');

    const pending = await getPendingMigrations(client);

    if (pending.length === 0) {
      console.log('✓ No pending migrations. Database is up to date!');
      return;
    }

    console.log(`Found ${pending.length} pending migration(s):\n`);
    pending.forEach(m => console.log(`  - ${m.version}`));
    console.log('');

    // Ask for confirmation
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise(resolve => {
      readline.question('Do you want to apply these migrations? (yes/no): ', resolve);
    });
    readline.close();

    if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
      console.log('\nMigration cancelled.');
      return;
    }

    console.log('');

    // Apply migrations
    for (const migration of pending) {
      await runMigration(client, migration);
    }

    console.log('\n✓ All migrations applied successfully!');

  } catch (error) {
    console.error('\n✗ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
    }
  }
}

main();
