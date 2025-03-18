import mongoose from 'mongoose';
import MongoStore from 'connect-mongo';
import session from 'express-session';

// Create MongoDB connection URL
const getMongoUrl = () => {
  // If we have a direct MongoDB URL, use it
  if (process.env.MONGO_URL) {
    return process.env.MONGO_URL;
  }

  // Default local MongoDB URL for development
  return 'mongodb://localhost:27017/healthcarebooking';
};

// MongoDB connection - allow manual connection at a later time
// We won't connect automatically so you can set it up manually in your system
console.log('[database] MongoDB connection needs to be set up manually');

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