import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import session from "express-session";
import MongoStore from "connect-mongo";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupAuth } from "./auth";

dotenv.config(); // Load environment variables

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
      if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
      log(logLine);
    }
  });
  next();
});

// MongoDB connection
const connectToMongoDB = async () => {
  try {
    const mongoUrl = process.env.MONGO_URL || "mongodb://localhost:27017/medibook";
    console.log("[database] Connecting to MongoDB...");
    await mongoose.connect(mongoUrl, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 60000,
      socketTimeoutMS: 60000,
    });
    console.log("[database] Connected to MongoDB successfully");
    return true;
  } catch (error) {
    console.error("[database] MongoDB connection error:", error);
    return false;
  }
};

(async () => {
  try {
    if (!(await connectToMongoDB())) {
      console.error("Failed to connect to MongoDB. Exiting application.");
      process.exit(1);
    }

    // Set up session with MongoDB store
    app.use(session({
      secret: process.env.SESSION_SECRET || "medibook-session-secret",
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: process.env.MONGO_URL || "mongodb://localhost:27017/medibook",
        collectionName: "sessions",
      }),
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      },
    }));

    setupAuth(app);
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
      console.error(err);
    });

    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    const port = process.env.PORT || 5000;
    server.listen({
      port: Number(port),
      host: "127.0.0.1", // ✅ Fix for ENOTSUP error
    }, () => log(`Server is running on http://127.0.0.1:${port}`));
  } catch (error) {
    console.error("Failed to initialize application:", error);
    process.exit(1);
  }
})();
