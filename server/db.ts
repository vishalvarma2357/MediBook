import mongoose from 'mongoose';
import MongoStore from 'connect-mongo';
import session from 'express-session';

// Create MongoDB connection URL
// We need to create a proper MongoDB connection URL since we're trying to use
// a PostgreSQL connection string with MongoDB which is causing the error
const getMongoUrl = () => {
  // If we have a direct MongoDB URL, use it
  if (process.env.MONGO_URL) {
    return process.env.MONGO_URL;
  }

  // Default local MongoDB URL for development
  return 'mongodb://localhost:27017/healthcarebooking';
};

// MongoDB connection
const connectDB = async () => {
  try {
    const MONGO_URI = getMongoUrl();
    await mongoose.connect(MONGO_URI, {
      ssl: true,
      tls: true,
      tlsAllowInvalidCertificates: true, // Only for development
    });
    console.log('[database] MongoDB connection initialized successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.log('Please ensure you have MongoDB running or set MONGO_URL environment variable');
    process.exit(1);
  }
};

// Connect to MongoDB
connectDB();

// Create a MongoDB session store for express-session
export const mongoSessionStore = (options: session.SessionOptions) => {
  return MongoStore.create({
    mongoUrl: getMongoUrl(),
    collectionName: 'sessions',
    ...options,
    mongoOptions: {
      ssl: true,
      tls: true,
      tlsAllowInvalidCertificates: true, // Only for development
    }
  });
};

// Export the mongoose connection
export const db = mongoose;