#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration(migrationFile) {
  try {
    console.log(`Applying migration: ${migrationFile}`);

    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migrationFile);

    if (!fs.existsSync(migrationPath)) {
      console.error(`Error: Migration file not found: ${migrationPath}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Executing migration...');
    const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });

    if (error) {
      throw error;
    }

    console.log('Migration applied successfully!');
  } catch (error) {
    console.error('Error applying migration:', error.message);
    console.log('\nTrying alternative method...');

    // Alternative: Run SQL statements one by one
    try {
      const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migrationFile);
      const sql = fs.readFileSync(migrationPath, 'utf8');

      console.log('\nPlease run this SQL manually in the Supabase SQL Editor:');
      console.log('---');
      console.log(sql);
      console.log('---');
      console.log('\nGo to: https://app.supabase.com/project/_/sql');
    } catch (e) {
      console.error('Could not read migration file:', e.message);
    }

    process.exit(1);
  }
}

const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('Usage: node apply-migration-supabase.js <migration-file.sql>');
  console.error('Example: node apply-migration-supabase.js 0008_add_product_status.sql');
  process.exit(1);
}

applyMigration(migrationFile);
