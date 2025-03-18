import mongoose from 'mongoose';
import MongoStore from 'connect-mongo';
import session from 'express-session';

// Create MongoDB connection URL
const getMongoUrl = () => {
  // If we have a direct MongoDB URL, use it
  if (process.env.MONGO_URL || process.env.DATABASE_URL) {
    return process.env.MONGO_URL || process.env.DATABASE_URL;
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
      serverSelectionTimeoutMS: 15000, // Timeout for server selection
      connectTimeoutMS: 30000, // Timeout for initial connection
      socketTimeoutMS: 45000, // Socket timeout
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
  return MongoStore.create({
    mongoUrl: getMongoUrl(),
    collectionName: 'sessions',
    ...options
  });
};

// Export the mongoose connection
export const db = mongoose;