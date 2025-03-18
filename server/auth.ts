import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as UserType, UserRole, DoctorStatus } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends UserType {
      doctorProfile?: {
        id: number;
        status: DoctorStatus;
      }
    }
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "medibook-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        }
        
        // For doctor users, check their status
        if (user.role === UserRole.DOCTOR) {
          const doctorProfile = await storage.getDoctorProfileByUserId(user.id);
          if (doctorProfile && doctorProfile.status === DoctorStatus.REJECTED) {
            return done(null, false);
          }
          
          // Add doctor profile data to user object
          return done(null, {
            ...user,
            doctorProfile: {
              id: doctorProfile?.id,
              status: doctorProfile?.status
            }
          });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      
      // For doctor users, add profile data
      if (user.role === UserRole.DOCTOR) {
        const doctorProfile = await storage.getDoctorProfileByUserId(user.id);
        if (doctorProfile) {
          return done(null, {
            ...user,
            doctorProfile: {
              id: doctorProfile.id,
              status: doctorProfile.status
            }
          });
        }
      }
      
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Register patient
  app.post("/api/register/patient", async (req, res, next) => {
    try {
      const { confirmPassword, ...userData } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // Create user with hashed password
      const user = await storage.createUser({
        ...userData,
        role: UserRole.PATIENT,
        password: await hashPassword(userData.password)
      });
      
      // Login user
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({ ...user, password: undefined });
      });
    } catch (error) {
      next(error);
    }
  });

  // Register doctor
  app.post("/api/register/doctor", async (req, res, next) => {
    try {
      const { user: userData, profile: profileData } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // Create user with hashed password
      const user = await storage.createUser({
        ...userData,
        role: UserRole.DOCTOR,
        password: await hashPassword(userData.password)
      });
      
      // Create doctor profile
      const doctorProfile = await storage.createDoctorProfile({
        ...profileData,
        userId: user.id,
        status: DoctorStatus.PENDING
      });
      
      // Login user
      req.login({
        ...user,
        doctorProfile: {
          id: doctorProfile.id,
          status: doctorProfile.status
        }
      }, (err) => {
        if (err) return next(err);
        res.status(201).json({ 
          user: { ...user, password: undefined },
          profile: doctorProfile
        });
      });
    } catch (error) {
      next(error);
    }
  });

  // Login route
  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    const user = { ...req.user };
    // Remove password from response
    delete user.password;
    res.status(200).json(user);
  });

  // Logout route
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((err) => {
        if (err) return next(err);
        res.clearCookie('connect.sid');
        res.sendStatus(200);
      });
    });
  });

  // Current user route
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = { ...req.user };
    // Remove password from response
    delete user.password;
    res.json(user);
  });

  // Auth middleware for routes
  function requireAuth(req: Request, res: Response, next: NextFunction) {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  }

  function requireRole(role: UserRole) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      if (req.user.role !== role && req.user.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: "Access denied" });
      }
      next();
    };
  }

  function requireApprovedDoctor(req: Request, res: Response, next: NextFunction) {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    if (req.user.role !== UserRole.DOCTOR) {
      return res.status(403).json({ message: "Doctor access required" });
    }
    if (req.user.doctorProfile?.status !== DoctorStatus.APPROVED) {
      return res.status(403).json({ message: "Your doctor account is not approved yet" });
    }
    next();
  }

  return { requireAuth, requireRole, requireApprovedDoctor };
}
