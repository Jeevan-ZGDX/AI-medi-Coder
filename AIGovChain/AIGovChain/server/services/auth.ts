import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { CryptoService } from "./crypto";
import { storage } from "../storage";
import type { User } from "@shared/schema";

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

export interface WalletAuthData {
  walletAddress: string;
  signature: string;
  nonce: string;
}

export interface EmailAuthData {
  email: string;
  password: string;
}

export class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
  private static readonly JWT_EXPIRES_IN = "7d";
  private static readonly SALT_ROUNDS = 12;

  static async authenticateWithEmail(authData: EmailAuthData): Promise<AuthResult> {
    try {
      const user = await storage.getUserByEmail(authData.email);
      if (!user) {
        return { success: false, error: "User not found" };
      }

      if (!user.password) {
        return { success: false, error: "Email authentication not available for this account" };
      }

      const isValidPassword = await bcrypt.compare(authData.password, user.password);
      if (!isValidPassword) {
        return { success: false, error: "Invalid password" };
      }

      const token = this.generateJWT(user);
      
      // Log authentication
      await storage.createAuditLog({
        userId: user.id,
        action: "user_login_email",
        entityType: "user",
        entityId: user.id,
        details: { method: "email" }
      });

      return { success: true, user, token };
    } catch (error) {
      console.error("Email authentication failed:", error);
      return { success: false, error: "Authentication failed" };
    }
  }

  static async authenticateWithWallet(authData: WalletAuthData): Promise<AuthResult> {
    try {
      if (!CryptoService.isValidEthereumAddress(authData.walletAddress)) {
        return { success: false, error: "Invalid wallet address" };
      }

      const message = CryptoService.createSignMessage(authData.walletAddress, authData.nonce);
      const isValidSignature = CryptoService.verifySignature(message, authData.signature, authData.walletAddress);

      if (!isValidSignature) {
        return { success: false, error: "Invalid signature" };
      }

      let user = await storage.getUserByWalletAddress(authData.walletAddress);
      
      if (!user) {
        // Create new user for wallet authentication
        user = await storage.createUser({
          username: `wallet_${authData.walletAddress.slice(0, 8)}`,
          walletAddress: authData.walletAddress,
          authMethod: "wallet",
          role: "verifier"
        });
      }

      const token = this.generateJWT(user);
      
      // Log authentication
      await storage.createAuditLog({
        userId: user.id,
        action: "user_login_wallet",
        entityType: "user",
        entityId: user.id,
        details: { method: "wallet", walletAddress: authData.walletAddress }
      });

      return { success: true, user, token };
    } catch (error) {
      console.error("Wallet authentication failed:", error);
      return { success: false, error: "Authentication failed" };
    }
  }

  static async registerWithEmail(email: string, password: string, username: string): Promise<AuthResult> {
    try {
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return { success: false, error: "User already exists" };
      }

      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return { success: false, error: "Username already taken" };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

      // Create user
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        authMethod: "email",
        role: "verifier"
      });

      const token = this.generateJWT(user);
      
      // Log registration
      await storage.createAuditLog({
        userId: user.id,
        action: "user_registered_email",
        entityType: "user",
        entityId: user.id,
        details: { method: "email" }
      });

      return { success: true, user, token };
    } catch (error) {
      console.error("Email registration failed:", error);
      return { success: false, error: "Registration failed" };
    }
  }

  static generateJWT(user: User): string {
    return jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
        walletAddress: user.walletAddress
      },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );
  }

  static verifyJWT(token: string): { userId: string; username: string; role: string; walletAddress?: string } | null {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;
      return {
        userId: decoded.userId,
        username: decoded.username,
        role: decoded.role,
        walletAddress: decoded.walletAddress
      };
    } catch (error) {
      console.error("JWT verification failed:", error);
      return null;
    }
  }

  static generateNonce(): string {
    return CryptoService.generateNonce();
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await storage.getUser(userId);
      if (!user || !user.password) {
        return { success: false, error: "User not found or password authentication not available" };
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return { success: false, error: "Current password is incorrect" };
      }

      const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);
      await storage.updateUser(userId, { password: hashedPassword });

      // Log password change
      await storage.createAuditLog({
        userId: user.id,
        action: "password_changed",
        entityType: "user",
        entityId: user.id,
        details: {}
      });

      return { success: true };
    } catch (error) {
      console.error("Password change failed:", error);
      return { success: false, error: "Failed to change password" };
    }
  }
}
