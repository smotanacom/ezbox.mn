# Quick Start Guide - EzBox.mn

Get EzBox.mn running locally in under 2 minutes! No Supabase or Vercel account needed.

## Prerequisites

- **Node.js** 18+ installed
- **Docker** installed ([Get Docker](https://docs.docker.com/get-docker/))

That's it! No database installation needed.

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Automated Setup

```bash
npm run setup:local
```

This single command will:
- ✅ Start PostgreSQL in Docker
- ✅ Create database tables
- ✅ Load sample products and data
- ✅ Create `.env` file with local config

### 3. Start the Application

```bash
npm run dev
```

### 4. Open Your Browser

Visit **http://localhost:3000**

🎉 **You're done!** The app is now running with:
- 4 product categories
- 23 sample products
- Full shopping cart functionality
- Product customization options

## What You'll See

### Home Page
- Special offers section
- Products organized by category
- Click any product to configure it

### Products Page
- Select category → Select product
- Configure parameters (color, size, etc.)
- See live price updates
- Add to cart
- View and edit your cart

### Sample Data Included

**Categories:**
- Base Box (10 products)
- Wall Box (5 products)
- Partial (4 products)
- Ready Products (4 products)

**Parameters:**
- Colors: White, Black, Green, Red, +10 more
- Widths: 20cm, 40cm, 50cm, 60cm, 80cm, 90cm, etc.
- Heights: 40cm, 60cm, 72cm, 200cm
- Depths: 30cm, 56cm, 60cm
- And more...

## Useful Commands

```bash
# Start development server
npm run dev

# Start database only
npm run db:start

# Stop database
npm run db:stop

# Access database shell (for manual queries)
npm run db:shell

# View database logs
docker logs ezbox-postgres
```

## Testing Authentication

The app supports both guest and registered users:

**Guest Users:**
- Just start shopping!
- Cart is saved to browser session

**Registered Users:**
- Phone number: Any 8-digit number (e.g., 12345678)
- Password: Any password (no restrictions)
- Try registering a user and logging in

## Database Access

Want to view or modify the database directly?

```bash
npm run db:shell
```

Then run SQL commands:
```sql
-- View all products
SELECT * FROM products;

-- View all categories
SELECT * FROM categories;

-- Check cart items
SELECT * FROM product_in_cart;
```

Type `\q` to exit.

## Stopping Everything

```bash
# Stop the Next.js dev server
# Press Ctrl+C in the terminal running `npm run dev`

# Stop the database
npm run db:stop
```

## Resetting the Database

If you want to start fresh:

```bash
# Stop and remove database
npm run db:stop
docker volume rm ezbox_postgres_data

# Run setup again
npm run setup:local
npm run dev
```

## Troubleshooting

### Port 3000 already in use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or run on different port
PORT=3001 npm run dev
```

### Port 5432 already in use
You already have PostgreSQL running. Either:
1. Stop your existing PostgreSQL
2. Or edit `docker-compose.yml` to use a different port

### Docker not running
```bash
# Start Docker Desktop or Docker service
# macOS: Open Docker Desktop app
# Linux: sudo systemctl start docker
```

### Can't connect to database
```bash
# Restart database
npm run db:stop
npm run db:start

# Wait 5 seconds, then try again
npm run dev
```

## Next Steps

- Explore the code in `app/`, `lib/`, and `types/`
- Customize products in `supabase/migrations/0002_seed_data.sql`
- Add new features!
- Check out [README.md](README.md) for full documentation
- Deploy to production with Supabase + Vercel

## Need Help?

- Check [LOCAL_SETUP.md](LOCAL_SETUP.md) for detailed setup options
- Read [README.md](README.md) for full documentation
- Review the code - it's well-commented!

Happy coding! 🚀
