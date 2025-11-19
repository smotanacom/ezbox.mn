#!/bin/bash

set -e

echo "🚀 Setting up EzBox.mn for local development..."
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first:"
    echo "   Visit https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ docker-compose is not available. Please install it:"
    echo "   Visit https://docs.docker.com/compose/install/"
    exit 1
fi

# Start PostgreSQL container
echo "📦 Starting PostgreSQL container..."
docker-compose up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Check if PostgreSQL is ready
until docker exec ezbox-postgres pg_isready -U ezbox > /dev/null 2>&1; do
    echo "   Still waiting for PostgreSQL..."
    sleep 2
done

echo "✅ PostgreSQL is ready!"
echo ""

# Run migrations
echo "🔄 Running database migrations..."
echo "   Applying 0001_init.sql..."
docker exec -i ezbox-postgres psql -U ezbox -d ezbox < supabase/migrations/0001_init.sql > /dev/null 2>&1

echo "   Applying 0002_seed_data.sql..."
docker exec -i ezbox-postgres psql -U ezbox -d ezbox < supabase/migrations/0002_seed_data.sql > /dev/null 2>&1

echo "✅ Migrations applied successfully!"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
DATABASE_URL=postgresql://ezbox:ezbox123@localhost:5432/ezbox
NEXT_PUBLIC_SUPABASE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_ANON_KEY=local-development-key
EOF
    echo "✅ .env file created!"
else
    echo "ℹ️  .env file already exists, skipping..."
fi

echo ""
echo "✨ Setup complete! You can now run:"
echo ""
echo "   npm run dev"
echo ""
echo "To stop the database:"
echo "   docker-compose down"
echo ""
echo "To view database:"
echo "   docker exec -it ezbox-postgres psql -U ezbox -d ezbox"
echo ""
