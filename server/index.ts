import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import mongoose from 'mongoose';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { setupAuth } from "./auth";

// Create Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson: any) {
    capturedJsonResponse = bodyJson;
    return originalResJson.call(res, bodyJson);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// MongoDB connection
const connectToMongoDB = async () => {
  try {
    const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/medibook';
    
    console.log('[database] Connecting to MongoDB...');
    await mongoose.connect(mongoUrl, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 60000,
      socketTimeoutMS: 60000,
    });
    console.log('[database] Connected to MongoDB successfully');
    return true;
  } catch (error) {
    console.error('[database] MongoDB connection error:', error);
    return false;
  }
};

// Initialize and start the application
(async () => {
  try {
    // Connect to MongoDB
    const dbConnected = await connectToMongoDB();
    
    if (!dbConnected) {
      console.error("Failed to connect to MongoDB. Exiting application.");
      process.exit(1);
    }
    
    // Set up session with MongoDB store
    const sessionOptions: session.SessionOptions = {
      secret: process.env.SESSION_SECRET || 'medibook-session-secret',
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: process.env.MONGO_URL || 'mongodb://localhost:27017/medibook',
        collectionName: 'sessions',
      }),
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      }
    };
    
    app.use(session(sessionOptions));
    
    // Set up authentication
    setupAuth(app);
    
    // Register routes
    const server = await registerRoutes(app);

    // Global error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      console.error(err);
    });

    // Set up Vite for development or static files for production
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Start the server
    const port = 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to initialize application:", error);
    process.exit(1);
  }
})();
