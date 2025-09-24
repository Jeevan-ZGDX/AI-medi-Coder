import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { blockchainService } from "./services/blockchain";
import { ipfsService } from "./services/ipfs";
import { AuthService } from "./services/auth";
import { CryptoService } from "./services/crypto";
import { z } from "zod";
import { loginSchema, documentVerificationSchema, insertDocumentSchema } from "@shared/schema";
import multer from "multer";
import jwt from "jsonwebtoken";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Middleware to verify JWT token
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const decoded = AuthService.verifyJWT(token);
  if (!decoded) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  req.user = decoded;
  next();
};

// Role-based middleware
const requireRole = (roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth endpoints
  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      
      let result;
      if (data.email && data.password) {
        result = await AuthService.authenticateWithEmail({
          email: data.email,
          password: data.password
        });
      } else if (data.walletAddress && data.signature) {
        result = await AuthService.authenticateWithWallet({
          walletAddress: data.walletAddress,
          signature: data.signature,
          nonce: req.body.nonce
        });
      } else {
        return res.status(400).json({ error: "Invalid authentication data" });
      }

      if (!result.success) {
        return res.status(401).json({ error: result.error });
      }

      res.json({
        success: true,
        user: result.user,
        token: result.token
      });
    } catch (error) {
      res.status(400).json({ error: "Invalid request data" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, username } = req.body;
      
      if (!email || !password || !username) {
        return res.status(400).json({ error: "Email, password, and username are required" });
      }

      const result = await AuthService.registerWithEmail(email, password, username);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({
        success: true,
        user: result.user,
        token: result.token
      });
    } catch (error) {
      res.status(400).json({ error: "Registration failed" });
    }
  });

  app.get("/api/auth/nonce", (req, res) => {
    const nonce = AuthService.generateNonce();
    res.json({ nonce });
  });

  // Document endpoints
  app.post("/api/documents/upload", authenticateToken, requireRole(['registrar', 'admin']), upload.single('document'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { title, documentType, subject, expiryDate } = req.body;
      
      if (!title || !documentType || !subject) {
        return res.status(400).json({ error: "Title, document type, and subject are required" });
      }

      // Compute file hash
      const fileHash = CryptoService.computeFileHash(req.file.buffer);
      
      // Check if document already exists
      const existingDoc = await storage.getDocumentByHash(fileHash);
      if (existingDoc) {
        return res.status(409).json({ error: "Document already registered", recordId: existingDoc.recordId });
      }

      // Upload to IPFS
      let ipfsHash: string | undefined;
      try {
        const ipfsResult = await ipfsService.uploadFile(req.file.buffer, req.file.originalname, {
          title,
          documentType,
          subject
        });
        ipfsHash = ipfsResult.hash;
      } catch (error) {
        console.warn("IPFS upload failed, continuing without:", error);
      }

      // Generate record ID
      const recordId = CryptoService.generateRecordId();

      // Create document record
      const document = await storage.createDocument({
        recordId,
        title,
        documentType,
        subject,
        registrarId: req.user.userId,
        fileHash,
        ipfsHash,
        status: "pending",
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        metadata: {
          originalFilename: req.file.originalname,
          fileSize: req.file.size,
          mimeType: req.file.mimetype
        }
      });

      // Register on blockchain (async)
      blockchainService.registerDocument({
        recordId,
        recordHash: fileHash,
        subject,
        registrar: req.user.userId,
        ipfsCid: ipfsHash
      }).then(async (blockchainResult) => {
        await storage.updateDocument(document.id, {
          blockchainTxHash: blockchainResult.txHash,
          status: "registered"
        });
      }).catch(async (error) => {
        console.error("Blockchain registration failed:", error);
        await storage.updateDocument(document.id, {
          status: "pending"
        });
      });

      // Log the registration
      await storage.createAuditLog({
        userId: req.user.userId,
        action: "document_registered",
        entityType: "document",
        entityId: document.id,
        details: { recordId, title, documentType }
      });

      res.json({
        success: true,
        document,
        fileHash,
        ipfsHash
      });
    } catch (error) {
      console.error("Document upload failed:", error);
      res.status(500).json({ error: "Failed to upload document" });
    }
  });

  app.get("/api/documents", authenticateToken, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const search = req.query.search as string;

      let documents;
      if (search) {
        documents = await storage.searchDocuments(search);
      } else if (req.user.role === 'admin') {
        documents = await storage.getAllDocuments(limit, offset);
      } else {
        documents = await storage.getDocumentsByRegistrar(req.user.userId, limit);
      }

      res.json({ documents });
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  app.get("/api/documents/:id", authenticateToken, async (req, res) => {
    try {
      const document = await storage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      // Check permissions
      if (req.user.role !== 'admin' && document.registrarId !== req.user.userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json({ document });
    } catch (error) {
      console.error("Failed to fetch document:", error);
      res.status(500).json({ error: "Failed to fetch document" });
    }
  });

  // Verification endpoints (public)
  app.post("/api/verify", async (req, res) => {
    try {
      const data = documentVerificationSchema.parse(req.body);
      
      let document;
      if (data.recordId) {
        document = await storage.getDocumentByRecordId(data.recordId);
      } else if (data.fileHash) {
        document = await storage.getDocumentByHash(data.fileHash);
      }

      if (!document) {
        await storage.createVerificationLog({
          documentId: "", // Unknown document
          verificationMethod: data.recordId ? "record_id" : "file_hash",
          isValid: false,
          ipAddress: req.ip,
          userAgent: req.get('user-agent') || ""
        });
        
        return res.json({
          isValid: false,
          error: "Document not found in registry"
        });
      }

      // Verify on blockchain
      const blockchainValid = await blockchainService.isRecordValid(document.recordId);

      const isValid = document.status === 'registered' && blockchainValid;

      // Log verification attempt
      await storage.createVerificationLog({
        documentId: document.id,
        verificationMethod: data.recordId ? "record_id" : "file_hash",
        isValid,
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || ""
      });

      res.json({
        isValid,
        document: isValid ? {
          recordId: document.recordId,
          title: document.title,
          documentType: document.documentType,
          subject: document.subject,
          status: document.status,
          createdAt: document.createdAt,
          fileHash: document.fileHash,
          blockchainTxHash: document.blockchainTxHash
        } : undefined
      });
    } catch (error) {
      console.error("Verification failed:", error);
      res.status(500).json({ error: "Verification failed" });
    }
  });

  app.post("/api/verify/file", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const fileHash = CryptoService.computeFileHash(req.file.buffer);
      
      // Use the regular verification endpoint
      const verificationResult = await fetch(`${req.protocol}://${req.get('host')}/api/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fileHash })
      });

      const result = await verificationResult.json();
      res.json(result);
    } catch (error) {
      console.error("File verification failed:", error);
      res.status(500).json({ error: "File verification failed" });
    }
  });

  // QR Code endpoints
  app.get("/api/qr/:documentId", authenticateToken, async (req, res) => {
    try {
      const document = await storage.getDocument(req.params.documentId);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      // Check permissions
      if (req.user.role !== 'admin' && document.registrarId !== req.user.userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      let qrCode = await storage.getQrCodeByDocument(document.id);
      
      if (!qrCode) {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const qrData = CryptoService.generateQRData(baseUrl, document.recordId);
        
        qrCode = await storage.createQrCode({
          documentId: document.id,
          qrData,
          isActive: true
        });
      }

      res.json({ qrCode });
    } catch (error) {
      console.error("Failed to generate QR code:", error);
      res.status(500).json({ error: "Failed to generate QR code" });
    }
  });

  // Stats endpoint
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Admin endpoints
  app.get("/api/admin/users", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      // Implementation for admin user management
      res.json({ message: "Admin endpoint - users list" });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/audit-logs", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = await storage.getAuditLogs(limit);
      res.json({ logs });
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  // Blockchain info endpoint
  app.get("/api/blockchain/info", (req, res) => {
    res.json({
      networkName: blockchainService.getNetworkName(),
      contractAddress: blockchainService.getContractAddress(),
      ipfsConfigured: ipfsService.isConfigured()
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
