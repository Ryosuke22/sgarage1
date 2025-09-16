// server/auth.ts - Authentication setup using blueprint:javascript_auth_all_persistance
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { dbService } from './database';
import { SessionUser, insertUserSchema, loginUserSchema } from "@shared/schema";
import { z } from "zod";
import connectPg from "connect-pg-simple";

declare global {
  namespace Express {
    interface User extends SessionUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) return false;
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Setup session store with PostgreSQL
  const PostgresSessionStore = connectPg(session);
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'samurai-garage-dev-secret',
    resave: false,
    saveUninitialized: false,
    store: new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      createTableIfMissing: true,
      tableName: 'sessions',
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Enable secure cookies in production
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax', // CSRF protection - prevents cross-site request forgery
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await dbService.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: 'ユーザー名またはパスワードが正しくありません' });
        }
        
        // Don't include password in the session user
        const { password: _, ...userWithoutPassword } = user;
        return done(null, userWithoutPassword);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await dbService.getUserById(id);
      if (!user) {
        return done(null, false);
      }
      // Don't include password in the session user
      const { password: _, ...userWithoutPassword } = user;
      done(null, userWithoutPassword);
    } catch (error) {
      done(error);
    }
  });

  // Registration endpoint
  app.post("/api/register", async (req, res, next) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await dbService.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: 'このユーザー名は既に使用されています' });
      }

      // Check if email already exists (if provided)
      if (validatedData.email) {
        const existingEmailUser = await dbService.getUserByEmail(validatedData.email);
        if (existingEmailUser) {
          return res.status(400).json({ message: 'このメールアドレスは既に使用されています' });
        }
      }

      // Create user with hashed password
      const hashedPassword = await hashPassword(validatedData.password);
      const newUser = await dbService.createUser({
        ...validatedData,
        password: hashedPassword,
      });

      // Log the user in immediately after registration
      req.login(newUser, (err) => {
        if (err) return next(err);
        
        // Don't return password in response
        const { password: _, ...userWithoutPassword } = newUser;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'バリデーションエラー', 
          errors: error.errors.map(e => ({ field: e.path[0], message: e.message }))
        });
      }
      console.error('Registration error:', error);
      res.status(500).json({ message: 'アカウントの作成中にエラーが発生しました' });
    }
  });

  // Login endpoint
  app.post("/api/login", (req, res, next) => {
    try {
      const validatedData = loginUserSchema.parse(req.body);
      
      passport.authenticate("local", (err: any, user: any, info: any) => {
        if (err) {
          console.error('Login error:', err);
          return res.status(500).json({ message: 'ログイン中にエラーが発生しました' });
        }
        if (!user) {
          return res.status(401).json({ message: info?.message || 'ユーザー名またはパスワードが正しくありません' });
        }
        
        req.login(user, (loginErr) => {
          if (loginErr) {
            console.error('Login session error:', loginErr);
            return res.status(500).json({ message: 'ログイン中にエラーが発生しました' });
          }
          res.status(200).json(user);
        });
      })(req, res, next);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'バリデーションエラー', 
          errors: error.errors.map(e => ({ field: e.path[0], message: e.message }))
        });
      }
      res.status(500).json({ message: 'ログイン中にエラーが発生しました' });
    }
  });

  // Logout endpoint
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: 'ログアウト中にエラーが発生しました' });
      }
      res.sendStatus(200);
    });
  });

  // Get current user endpoint
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    res.json(req.user);
  });
}