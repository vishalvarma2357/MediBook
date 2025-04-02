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

// MongoDB URL sanitization function
const sanitizeMongoUrl = (url: string): string => {
  try {
    // For mongodb+srv protocol, we need to ensure there's no port specified
    if (url.startsWith('mongodb+srv://')) {
      try {
        const parsedUrl = new URL(url);
        // Reconstruct without port
        return `mongodb+srv://${parsedUrl.username}:${parsedUrl.password}@${parsedUrl.hostname}${parsedUrl.pathname}${parsedUrl.search}`;
      } catch (urlError) {
        console.error('[database] Error parsing MongoDB URL with new URL():', urlError);
        
        // Fallback to manual parsing if URL parsing fails
        const parts = url.split('@');
        if (parts.length === 2) {
          const authPart = parts[0]; // mongodb+srv://username:password
          const hostPathParts = parts[1].split('/');
          const hostPart = hostPathParts[0].split(':')[0]; // Remove port if exists
          const pathPart = hostPathParts.slice(1).join('/');
          
          return `${authPart}@${hostPart}${pathPart ? '/' + pathPart : ''}`;
        }
      }
    }
  } catch (error) {
    console.error('[database] Error sanitizing MongoDB URL:', error);
  }
  // Return original URL as fallback
  return url;
};

// MongoDB connection
const connectToMongoDB = async () => {
  try {
    // Get MongoDB URL
    const rawMongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/medibook';
    const mongoUrl = sanitizeMongoUrl(rawMongoUrl);
    
    console.log('[database] Connecting to MongoDB...');
    await mongoose.connect(mongoUrl, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 60000,
      socketTimeoutMS: 60000,
    });
    console.log('[database] Connected to MongoDB successfully');
    return { success: true, mongoUrl };
  } catch (error) {
    console.error('[database] MongoDB connection error:', error);
    return { success: false, mongoUrl: '' };
  }
};

// Initialize and start the application
(async () => {
  try {
    // Connect to MongoDB
    const { success, mongoUrl } = await connectToMongoDB();
    
    if (!success) {
      console.error("Failed to connect to MongoDB. Exiting application.");
      process.exit(1);
    }
    
    // Set up session with MongoDB store
    const sessionOptions: session.SessionOptions = {
      secret: process.env.SESSION_SECRET || 'medibook-session-secret',
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: mongoUrl, // Use the same sanitized URL from the MongoDB connection
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