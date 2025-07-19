import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  // If password is not hashed (plain text from seeding), hash it first
  if (!stored.startsWith('$2')) {
    return supplied === stored;
  }
  return bcrypt.compare(supplied, stored);
}

export async function setupAuth(app: Express) {
  // Get the storage instance and its session store
  const storageInstance = await (storage as any).getStorage();
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'dev-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    store: storageInstance?.sessionStore,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        
        // Check if user exists and is active
        if (!user || !user.isActive) {
          return done(null, false, { message: "Invalid username or account is inactive" });
        }
        
        // Check password
        const isValidPassword = await comparePasswords(password, user.password);
        if (!isValidPassword) {
          return done(null, false, { message: "Invalid password" });
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
      
      // Check if user is still active
      if (!user || !user.isActive) {
        return done(null, false);
      }
      
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Registration disabled - users are seeded by admin
  app.post("/api/register", async (req, res) => {
    res.status(403).json({ message: "Registration is disabled. Contact administrator for account access." });
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    const user = req.user!;
    res.status(200).json({ 
      id: user.id, 
      username: user.username, 
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    });
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user!;
    res.json({ 
      id: user.id, 
      username: user.username, 
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    });
  });
}

export function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}