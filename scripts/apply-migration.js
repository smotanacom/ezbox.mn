#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

// Construct PostgreSQL connection string for Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePassword = process.env.SUPABASE_PASSWORD;

if (!supabaseUrl || !supabasePassword) {
  console.error('Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_PASSWORD in .env file');
  process.exit(1);
}

// Extract project reference from URL (e.g., fektlcibbblleeglyjgy from https://fektlcibbblleeglyjgy.supabase.co)
const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');

// Construct PostgreSQL connection string
const connectionString = `postgresql://postgres:${supabasePassword}@db.${projectRef}.supabase.co:5432/postgres`;

async function applyMigration(migrationFile) {
  const client = new Client({ connectionString });

  try {
    console.log(`Connecting to Supabase database...`);
    await client.connect();
    console.log('Connected successfully!');

    console.log(`Applying migration: ${migrationFile}`);

    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migrationFile);

    if (!fs.existsSync(migrationPath)) {
      console.error(`Error: Migration file not found: ${migrationPath}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Executing migration...');
    await client.query(sql);

    console.log('Migration applied successfully!');
  } catch (error) {
    console.error('Error applying migration:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('Usage: node apply-migration.js <migration-file.sql>');
  console.error('Example: node apply-migration.js 0007_create_admins_table.sql');
  process.exit(1);
}

applyMigration(migrationFile);
