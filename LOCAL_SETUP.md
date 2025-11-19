# Local Development Setup (Without Supabase)

You have two options to run EzBox.mn locally without Supabase:

## Option 1: Using Local PostgreSQL (Recommended)

### Step 1: Install PostgreSQL

**macOS (using Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download and install from https://www.postgresql.org/download/windows/

### Step 2: Create Database

```bash
# Create database
createdb ezbox

# Or using psql
psql postgres
CREATE DATABASE ezbox;
\q
```

### Step 3: Run Migrations

```bash
# Apply migrations directly to local PostgreSQL
psql ezbox < supabase/migrations/0001_init.sql
psql ezbox < supabase/migrations/0002_seed_data.sql
```

### Step 4: Install PostgreSQL client for Node.js

```bash
npm install pg
```

### Step 5: Update .env

Create `.env` file:
```bash
# Local PostgreSQL connection
DATABASE_URL=postgresql://localhost:5432/ezbox

# For local development, these can be dummy values
NEXT_PUBLIC_SUPABASE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy-key-for-local
```

---

## Option 2: Using Docker (Easiest - No Installation Required)

If you have Docker installed:

### Step 1: Create docker-compose.yml (already created)

### Step 2: Start PostgreSQL container

```bash
docker-compose up -d
```

### Step 3: Run migrations

```bash
# Wait a few seconds for PostgreSQL to start, then:
docker exec -i ezbox-postgres psql -U ezbox -d ezbox < supabase/migrations/0001_init.sql
docker exec -i ezbox-postgres psql -U ezbox -d ezbox < supabase/migrations/0002_seed_data.sql
```

### Step 4: Install PostgreSQL client

```bash
npm install pg
```

### Step 5: Update .env

```bash
DATABASE_URL=postgresql://ezbox:ezbox123@localhost:5432/ezbox
NEXT_PUBLIC_SUPABASE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy-key-for-local
```

---

## Running the Application

After setting up your database:

```bash
# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

Visit http://localhost:3000

---

## Stopping Services

**Local PostgreSQL:**
```bash
brew services stop postgresql@15  # macOS
sudo systemctl stop postgresql     # Linux
```

**Docker:**
```bash
docker-compose down
```

---

## Troubleshooting

### Port 5432 already in use
If PostgreSQL is already running, either use the existing instance or change the port in docker-compose.yml

### Connection refused
Make sure PostgreSQL is running:
```bash
# macOS
brew services list

# Linux
sudo systemctl status postgresql

# Docker
docker ps
```

### Migration errors
If migrations fail, you can manually run SQL in psql:
```bash
psql ezbox
# Then copy/paste SQL from migration files
```
