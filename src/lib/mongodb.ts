import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectMongoDB() {
  console.log('[MongoDB] Attempting to connect to database...');
  
  if (cached.conn) {
    console.log('[MongoDB] Using existing cached connection');
    return cached.conn;
  }

  if (!cached.promise) {
    console.log('[MongoDB] Creating new connection to:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
    
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('[MongoDB] Successfully connected to database');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log('[MongoDB] Database connection established and cached');
  } catch (e) {
    console.error('[MongoDB] Connection failed:', (e as Error).message);
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectMongoDB;