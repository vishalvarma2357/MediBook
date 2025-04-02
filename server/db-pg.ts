import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import ConnectPg from 'connect-pg-simple';
import session from 'express-session';
import * as schema from '@shared/schema';

// Create a PostgreSQL pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create a Drizzle ORM instance
export const db = drizzle(pool, { schema });

// PostgreSQL session store for express-session
export const pgSessionStore = (options: session.SessionOptions) => {
  const PgStore = ConnectPg(session);
  return new PgStore({
    pool,
    createTableIfMissing: true,
    ...options
  });
};

// Connect to PostgreSQL and run migrations
export const connectToPostgreSQL = async () => {
  try {
    console.log('[database] Connecting to PostgreSQL...');
    // Verify connection with a simple query
    await pool.query('SELECT NOW()');
    console.log('[database] Connected to PostgreSQL successfully');

    // Run migrations (this will create tables based on the schema)
    console.log('[database] Running migrations...');
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('[database] Migrations completed');
    
    return true;
  } catch (error) {
    console.error('[database] PostgreSQL connection error:', error);
    console.log('[database] Falling back to in-memory storage');
    return false;
  }
};

// Initialize database connection
export const initializePostgreSQL = async () => {
  return await connectToPostgreSQL();
};