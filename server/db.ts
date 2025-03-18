import mongoose from 'mongoose';
import MongoStore from 'connect-mongo';
import session from 'express-session';

// MongoDB connection
const connectDB = async () => {
  try {
    // Use a MongoDB URL, we'll need to set this up in the environment variables
    const MONGO_URI = process.env.DATABASE_URL || 'mongodb://localhost:27017/healthcarebooking';
    await mongoose.connect(MONGO_URI);
    console.log('[database] MongoDB connection initialized');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Connect to MongoDB
connectDB();

// Create a MongoDB session store for express-session
export const mongoSessionStore = (options: session.SessionOptions) => {
  return MongoStore.create({
    mongoUrl: process.env.DATABASE_URL || 'mongodb://localhost:27017/healthcarebooking',
    collectionName: 'sessions',
    ...options
  });
};

// Export the mongoose connection
export const db = mongoose;