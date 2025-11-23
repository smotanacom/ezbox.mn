#!/usr/bin/env node

const readline = require('readline');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

function questionPassword(prompt) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;

    stdout.write(prompt);

    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    let password = '';

    stdin.on('data', function onData(char) {
      char = char.toString('utf8');

      switch (char) {
        case '\n':
        case '\r':
        case '\u0004':
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener('data', onData);
          stdout.write('\n');
          resolve(password);
          break;
        case '\u0003':
          // Ctrl+C
          process.exit();
          break;
        case '\u007f':
        case '\b':
          // Backspace
          if (password.length > 0) {
            password = password.slice(0, -1);
            stdout.clearLine(0);
            stdout.cursorTo(0);
            stdout.write(prompt + '*'.repeat(password.length));
          }
          break;
        default:
          password += char;
          stdout.write('*');
          break;
      }
    });
  });
}

async function addAdmin() {
  try {
    console.log('=== Add New Admin ===\n');

    // Get username
    const username = await question('Enter admin username (3-50 alphanumeric characters): ');

    // Validate username
    if (!/^[a-zA-Z0-9_]{3,50}$/.test(username)) {
      console.error('\nError: Username must be 3-50 alphanumeric characters or underscores');
      process.exit(1);
    }

    // Get password
    const password = await questionPassword('Enter admin password: ');

    if (password.length < 6) {
      console.error('\nError: Password must be at least 6 characters');
      process.exit(1);
    }

    // Confirm password
    const confirmPassword = await questionPassword('Confirm admin password: ');

    if (password !== confirmPassword) {
      console.error('\nError: Passwords do not match');
      process.exit(1);
    }

    console.log('\nConnecting to Supabase...');

    // Check if admin already exists
    const { data: existingAdmin, error: checkError } = await supabase
      .from('admins')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (checkError) {
      console.error('\nError checking existing admin:', checkError.message);
      process.exit(1);
    }

    if (existingAdmin) {
      console.error(`\nError: Admin with username "${username}" already exists`);
      process.exit(1);
    }

    // Hash password
    console.log('Creating admin...');
    const password_hash = await bcrypt.hash(password, 10);

    // Insert admin
    const { data: admin, error: insertError } = await supabase
      .from('admins')
      .insert({
        username,
        password_hash,
      })
      .select()
      .single();

    if (insertError) {
      console.error('\nError creating admin:', insertError.message);
      process.exit(1);
    }

    console.log('\nAdmin created successfully!');
    console.log(`ID: ${admin.id}`);
    console.log(`Username: ${admin.username}`);
    console.log(`Created at: ${admin.created_at}`);

  } catch (error) {
    console.error('\nError:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

addAdmin();
