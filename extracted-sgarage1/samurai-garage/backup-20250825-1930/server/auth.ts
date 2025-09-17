import bcrypt from "bcrypt";
import crypto from "crypto";
import { z } from "zod";
import type { Request, Response, NextFunction } from "express";
import { signupSchema, loginSchema } from "@shared/schema";
import { storage } from "./storage";

export function ensureAuth(req: Request, res: Response, next: NextFunction) {
  if ((req as any).user?.id) return next();
  res.status(401).json({ error: "unauthorized" });
}

export class AuthService {
  private saltRounds = 12;

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async signup(data: z.infer<typeof signupSchema>) {
    // Check if user already exists by email
    const existingUserByEmail = await storage.getUserByEmail(data.email);
    if (existingUserByEmail) {
      throw new Error("このメールアドレスは既に登録されています");
    }

    // Check if user ID already exists
    const existingUserByUsername = await storage.getUserByUsername(data.userId);
    if (existingUserByUsername) {
      throw new Error("このユーザーIDは既に使用されています");
    }

    // Hash password
    const passwordHash = await this.hashPassword(data.password);

    // Create user
    const user = await storage.createUser({
      email: data.email,
      username: data.userId, // Use the custom userId as username
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      firstNameKana: data.firstNameKana,
      lastNameKana: data.lastNameKana,
      emailVerified: true, // Skip email verification for now
    });

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
  }

  async login(data: z.infer<typeof loginSchema>) {
    // Find user by email
    const user = await storage.getUserByEmail(data.email);
    if (!user || !user.passwordHash) {
      throw new Error("メールアドレスまたはパスワードが正しくありません");
    }

    // Verify password
    const isValid = await this.verifyPassword(data.password, user.passwordHash);
    if (!isValid) {
      throw new Error("メールアドレスまたはパスワードが正しくありません");
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
  }
}

export const authService = new AuthService();