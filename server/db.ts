import mongoose from 'mongoose';
import MongoStore from 'connect-mongo';
import session from 'express-session';

// Create MongoDB connection URL
const getMongoUrl = () => {
  // If we have a direct MongoDB URL, use it
  if (process.env.MONGO_URL) {
    try {
      // For mongodb+srv protocol, we need to ensure there's no port specified as it's not allowed
      if (process.env.MONGO_URL.startsWith('mongodb+srv://')) {
        const url = new URL(process.env.MONGO_URL);
        // Return the URL without any port information
        // We recreate it to ensure standard format
        return `mongodb+srv://${url.username}:${url.password}@${url.hostname}${url.pathname}${url.search}`;
      }
      
      // For regular mongodb:// URLs, return as is
      return process.env.MONGO_URL;
    } catch (error) {
      console.error('[database] Error parsing MongoDB URL:', error);
      
      // If we failed to parse as URL, try a simple port removal for mongodb+srv
      if (process.env.MONGO_URL.startsWith('mongodb+srv://')) {
        const parts = process.env.MONGO_URL.split('@');
        if (parts.length === 2) {
          // Parts[0] is mongodb+srv://user:pass
          // Parts[1] is host:port/db
          const hostDbParts = parts[1].split('/');
          const hostPart = hostDbParts[0].split(':')[0]; // Remove any port
          const dbPart = hostDbParts.slice(1).join('/');
          return `${parts[0]}@${hostPart}/${dbPart}`;
        }
      }
      
      return process.env.MONGO_URL; // Return the original URL as a fallback
    }
  }

  // Default local MongoDB URL for development
  return 'mongodb://localhost:27017/medibook';
};

// Connect to MongoDB
const connectToMongoDB = async () => {
  try {
    const mongoUrl = getMongoUrl();
    
    // Set mongoose options with increased timeout
    const mongooseOptions = {
      serverSelectionTimeoutMS: 30000, // Increased timeout for server selection
      connectTimeoutMS: 60000, // Increased timeout for initial connection
      socketTimeoutMS: 60000, // Increased socket timeout
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };
    
    console.log('[database] Connecting to MongoDB...');
    await mongoose.connect(mongoUrl, mongooseOptions);
    console.log('[database] Connected to MongoDB successfully');
    return true;
  } catch (error) {
    console.error('[database] MongoDB connection error:', error);
    console.log('[database] Falling back to in-memory storage');
    return false;
  }
};

// Initialize MongoDB connection
export const initializeDatabase = async () => {
  return await connectToMongoDB();
};

// Create a MongoDB session store for express-session
export const mongoSessionStore = (options: session.SessionOptions) => {
  try {
    const mongoUrl = getMongoUrl();
    console.log('[database] Creating MongoDB session store...');
    
    return MongoStore.create({
      mongoUrl,
      collectionName: 'sessions',
      ttl: 14 * 24 * 60 * 60, // = 14 days. Default
      autoRemove: 'native', // Default
      touchAfter: 24 * 3600, // Reduce db writes, update only after 24 hours
      crypto: {
        secret: options.secret?.toString() || 'medibook-session-secret'
      },
      // Explicitly remove secret from options to avoid duplication
      ...Object.entries(options).reduce((acc, [key, value]) => {
        if (key !== 'secret') acc[key] = value;
        return acc;
      }, {} as any)
    });
  } catch (error) {
    console.error('[database] Failed to create MongoDB session store:', error);
    throw error; // Let the caller handle this exception
  }
};

// Export the mongoose connection
export const db = mongoose;