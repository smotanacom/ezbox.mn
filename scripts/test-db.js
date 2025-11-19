const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://ezbox:ezbox123@localhost:5432/ezbox'
});

async function testConnection() {
  try {
    console.log('Testing database connection...');

    const client = await pool.connect();
    console.log('✅ Connected to database successfully!');

    // Test query
    const result = await client.query('SELECT COUNT(*) FROM products');
    console.log(`✅ Found ${result.rows[0].count} products in database`);

    const categories = await client.query('SELECT name FROM categories');
    console.log(`✅ Categories: ${categories.rows.map(r => r.name).join(', ')}`);

    client.release();
    await pool.end();

    console.log('\n✨ Database is ready to use!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('\nMake sure to run: npm run setup:local');
    process.exit(1);
  }
}

testConnection();
