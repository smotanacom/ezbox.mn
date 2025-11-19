const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Missing Supabase environment variables');
  console.error('Please create a .env file with:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL=your-supabase-url');
  console.error('  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runMigrations() {
  try {
    console.log('Starting migration process...');
    console.log('');
    console.log('NOTE: You need to run these migrations manually in Supabase SQL Editor:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the migration files in order');
    console.log('');

    // Get list of migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`Found ${migrationFiles.length} migration files:\n`);

    // Display each migration file content
    for (const file of migrationFiles) {
      const version = path.basename(file, '.sql');
      const migrationPath = path.join(migrationsDir, file);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

      console.log('='.repeat(80));
      console.log(`Migration: ${version}`);
      console.log(`File: ${migrationPath}`);
      console.log('='.repeat(80));
      console.log(migrationSQL);
      console.log('\n');
    }

    console.log('='.repeat(80));
    console.log('To apply these migrations:');
    console.log('1. Copy each migration above');
    console.log('2. Paste into Supabase SQL Editor');
    console.log('3. Run in order (0001, then 0002, etc.)');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('Error reading migrations:', error);
    process.exit(1);
  }
}

runMigrations();
