import { users, documents, verificationLogs, auditLogs, qrCodes, type User, type InsertUser, type Document, type InsertDocument, type VerificationLog, type InsertVerificationLog, type AuditLog, type InsertAuditLog, type QrCode, type InsertQrCode } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, ilike, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByWalletAddress(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;

  // Document methods
  getDocument(id: string): Promise<Document | undefined>;
  getDocumentByRecordId(recordId: string): Promise<Document | undefined>;
  getDocumentByHash(fileHash: string): Promise<Document | undefined>;
  getDocumentsByRegistrar(registrarId: string, limit?: number): Promise<Document[]>;
  getAllDocuments(limit?: number, offset?: number): Promise<Document[]>;
  searchDocuments(query: string): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: string, updates: Partial<InsertDocument>): Promise<Document>;

  // Verification log methods
  createVerificationLog(log: InsertVerificationLog): Promise<VerificationLog>;
  getVerificationLogsByDocument(documentId: string): Promise<VerificationLog[]>;
  getRecentVerifications(limit?: number): Promise<VerificationLog[]>;

  // Audit log methods
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(limit?: number): Promise<AuditLog[]>;

  // QR code methods
  getQrCode(id: string): Promise<QrCode | undefined>;
  getQrCodeByDocument(documentId: string): Promise<QrCode | undefined>;
  createQrCode(qrCode: InsertQrCode): Promise<QrCode>;
  updateQrCode(id: string, updates: Partial<InsertQrCode>): Promise<QrCode>;

  // Stats methods
  getStats(): Promise<{
    totalDocuments: number;
    totalVerifications: number;
    todayVerifications: number;
    activeUsers: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.walletAddress, walletAddress));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document || undefined;
  }

  async getDocumentByRecordId(recordId: string): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.recordId, recordId));
    return document || undefined;
  }

  async getDocumentByHash(fileHash: string): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.fileHash, fileHash));
    return document || undefined;
  }

  async getDocumentsByRegistrar(registrarId: string, limit = 50): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.registrarId, registrarId))
      .orderBy(desc(documents.createdAt))
      .limit(limit);
  }

  async getAllDocuments(limit = 50, offset = 0): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .orderBy(desc(documents.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async searchDocuments(query: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(
        or(
          ilike(documents.title, `%${query}%`),
          ilike(documents.subject, `%${query}%`),
          ilike(documents.recordId, `%${query}%`)
        )
      )
      .orderBy(desc(documents.createdAt));
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const [document] = await db
      .insert(documents)
      .values(insertDocument)
      .returning();
    return document;
  }

  async updateDocument(id: string, updates: Partial<InsertDocument>): Promise<Document> {
    const [document] = await db
      .update(documents)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
    return document;
  }

  async createVerificationLog(insertLog: InsertVerificationLog): Promise<VerificationLog> {
    const [log] = await db
      .insert(verificationLogs)
      .values(insertLog)
      .returning();
    return log;
  }

  async getVerificationLogsByDocument(documentId: string): Promise<VerificationLog[]> {
    return await db
      .select()
      .from(verificationLogs)
      .where(eq(verificationLogs.documentId, documentId))
      .orderBy(desc(verificationLogs.createdAt));
  }

  async getRecentVerifications(limit = 100): Promise<VerificationLog[]> {
    return await db
      .select()
      .from(verificationLogs)
      .orderBy(desc(verificationLogs.createdAt))
      .limit(limit);
  }

  async createAuditLog(insertLog: InsertAuditLog): Promise<AuditLog> {
    const [log] = await db
      .insert(auditLogs)
      .values(insertLog)
      .returning();
    return log;
  }

  async getAuditLogs(limit = 100): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }

  async getQrCode(id: string): Promise<QrCode | undefined> {
    const [qrCode] = await db.select().from(qrCodes).where(eq(qrCodes.id, id));
    return qrCode || undefined;
  }

  async getQrCodeByDocument(documentId: string): Promise<QrCode | undefined> {
    const [qrCode] = await db
      .select()
      .from(qrCodes)
      .where(and(eq(qrCodes.documentId, documentId), eq(qrCodes.isActive, true)));
    return qrCode || undefined;
  }

  async createQrCode(insertQrCode: InsertQrCode): Promise<QrCode> {
    const [qrCode] = await db
      .insert(qrCodes)
      .values(insertQrCode)
      .returning();
    return qrCode;
  }

  async updateQrCode(id: string, updates: Partial<InsertQrCode>): Promise<QrCode> {
    const [qrCode] = await db
      .update(qrCodes)
      .set(updates)
      .where(eq(qrCodes.id, id))
      .returning();
    return qrCode;
  }

  async getStats(): Promise<{
    totalDocuments: number;
    totalVerifications: number;
    todayVerifications: number;
    activeUsers: number;
  }> {
    const [documentsCount] = await db
      .select({ count: sql`COUNT(*)::int` })
      .from(documents);

    const [verificationsCount] = await db
      .select({ count: sql`COUNT(*)::int` })
      .from(verificationLogs);

    const [todayVerificationsCount] = await db
      .select({ count: sql`COUNT(*)::int` })
      .from(verificationLogs)
      .where(sql`DATE(created_at) = CURRENT_DATE`);

    const [activeUsersCount] = await db
      .select({ count: sql`COUNT(*)::int` })
      .from(users)
      .where(eq(users.isActive, true));

    return {
      totalDocuments: documentsCount?.count || 0,
      totalVerifications: verificationsCount?.count || 0,
      todayVerifications: todayVerificationsCount?.count || 0,
      activeUsers: activeUsersCount?.count || 0,
    };
  }
}

export const storage = new DatabaseStorage();
