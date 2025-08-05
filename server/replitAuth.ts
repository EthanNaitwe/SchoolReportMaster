import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import { storage } from "./storage.js";
import { User as SelectUser } from "@shared/types";

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
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'dev-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    // Using default memory store for now
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
        console.log(`Attempting authentication for username: ${username}`);
        
        const user = await storage.getUserByUsername(username);
        const users = await storage.getAllUsers();

        console.log("User: =>", user);
        console.log("At: =>", new Date());
        console.log("Users: =>", users);
        console.log("process.env.GOOGLE_SHEETS_SPREADSHEET_ID: =>", process.env.GOOGLE_SHEETS_SPREADSHEET_ID);
        console.log("process.env.GOOGLE_SHEETS_CLIENT_EMAIL: =>", process.env.GOOGLE_SHEETS_CLIENT_EMAIL);
        console.log("process.env.GOOGLE_SHEETS_PRIVATE_KEY: =>", process.env.GOOGLE_SHEETS_PRIVATE_KEY);
        
        // Check if user exists and is active
        if (!user || !user.isActive) {
          console.log(`Authentication failed: User not found or inactive for username: ${username}`);
          return done(null, false, { message: "Invalid username or account is inactive" });
        }
        
        console.log(`User found, checking password for: ${username}`);
        
        // Check password
        const isValidPassword = await comparePasswords(password, user.password);
        if (!isValidPassword) {
          console.log(`Authentication failed: Invalid password for username: ${username}`);
          return done(null, false, { message: "Invalid password" });
        }
        
        console.log(`Authentication successful for username: ${username}`);
        return done(null, user);
      } catch (error) {
        console.error('Authentication error:', error);
        // Don't expose internal errors to the client
        return done(null, false, { message: "Authentication service unavailable" });
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
      console.error('User deserialization error:', error);
      done(null, false);
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

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  console.log('Authentication setup completed');
}

export function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Authentication required" });
}