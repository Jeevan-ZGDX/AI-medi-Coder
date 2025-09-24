import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["admin", "registrar", "verifier"]);
export const documentStatusEnum = pgEnum("document_status", ["pending", "registered", "verified", "revoked"]);
export const authMethodEnum = pgEnum("auth_method", ["email", "wallet", "hybrid"]);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").unique(),
  password: text("password"), // nullable for wallet-only users
  walletAddress: text("wallet_address").unique(),
  role: userRoleEnum("role").notNull().default("verifier"),
  authMethod: authMethodEnum("auth_method").notNull().default("email"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Documents table
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recordId: text("record_id").notNull().unique(), // e.g., REC-2024-001
  title: text("title").notNull(),
  documentType: text("document_type").notNull(),
  subject: text("subject").notNull(),
  registrarId: varchar("registrar_id").notNull().references(() => users.id),
  fileHash: text("file_hash").notNull(), // keccak256 hash
  ipfsHash: text("ipfs_hash"), // IPFS CID
  blockchainTxHash: text("blockchain_tx_hash"), // Ethereum transaction hash
  status: documentStatusEnum("status").notNull().default("pending"),
  metadata: jsonb("metadata"), // Additional document metadata
  expiryDate: timestamp("expiry_date"),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Verification logs table
export const verificationLogs = pgTable("verification_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").notNull().references(() => documents.id),
  verifierId: varchar("verifier_id").references(() => users.id), // nullable for anonymous verifications
  verificationMethod: text("verification_method").notNull(), // "file_upload", "record_id", "qr_code"
  isValid: boolean("is_valid").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Audit logs table
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  action: text("action").notNull(), // "document_registered", "document_verified", "user_login", etc.
  entityType: text("entity_type").notNull(), // "document", "user", etc.
  entityId: varchar("entity_id"),
  details: jsonb("details"), // Additional action details
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// QR codes table
export const qrCodes = pgTable("qr_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").notNull().references(() => documents.id),
  qrData: text("qr_data").notNull(), // The QR code data/URL
  accessCount: varchar("access_count").notNull().default("0"),
  expiryDate: timestamp("expiry_date"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  documents: many(documents),
  verificationLogs: many(verificationLogs),
  auditLogs: many(auditLogs),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  registrar: one(users, {
    fields: [documents.registrarId],
    references: [users.id],
  }),
  verificationLogs: many(verificationLogs),
  qrCodes: many(qrCodes),
}));

export const verificationLogsRelations = relations(verificationLogs, ({ one }) => ({
  document: one(documents, {
    fields: [verificationLogs.documentId],
    references: [documents.id],
  }),
  verifier: one(users, {
    fields: [verificationLogs.verifierId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const qrCodesRelations = relations(qrCodes, ({ one }) => ({
  document: one(documents, {
    fields: [qrCodes.documentId],
    references: [documents.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVerificationLogSchema = createInsertSchema(verificationLogs).omit({
  id: true,
  createdAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export const insertQrCodeSchema = createInsertSchema(qrCodes).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type VerificationLog = typeof verificationLogs.$inferSelect;
export type InsertVerificationLog = z.infer<typeof insertVerificationLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type QrCode = typeof qrCodes.$inferSelect;
export type InsertQrCode = z.infer<typeof insertQrCodeSchema>;

// Additional validation schemas
export const loginSchema = z.object({
  email: z.string().email().optional(),
  walletAddress: z.string().optional(),
  password: z.string().min(6).optional(),
  signature: z.string().optional(),
}).refine((data) => 
  (data.email && data.password) || (data.walletAddress && data.signature),
  { message: "Either email/password or wallet/signature is required" }
);

export const documentVerificationSchema = z.object({
  recordId: z.string().optional(),
  fileHash: z.string().optional(),
}).refine((data) => data.recordId || data.fileHash, {
  message: "Either recordId or fileHash is required"
});
