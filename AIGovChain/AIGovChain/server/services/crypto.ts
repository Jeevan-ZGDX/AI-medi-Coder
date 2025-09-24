import { createHash } from "crypto";
import { ethers } from "ethers";

export class CryptoService {
  /**
   * Compute keccak256 hash of a file buffer
   */
  static computeFileHash(fileBuffer: Buffer): string {
    return ethers.keccak256(fileBuffer);
  }

  /**
   * Compute SHA256 hash (alternative/backup hashing)
   */
  static computeSHA256(data: Buffer | string): string {
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate a unique record ID
   */
  static generateRecordId(prefix = 'REC'): string {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `${prefix}-${year}-${timestamp}-${random}`;
  }

  /**
   * Verify Ethereum signature
   */
  static verifySignature(message: string, signature: string, expectedAddress: string): boolean {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
    } catch (error) {
      console.error("Signature verification failed:", error);
      return false;
    }
  }

  /**
   * Generate a nonce for wallet authentication
   */
  static generateNonce(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Create a message for wallet signing
   */
  static createSignMessage(walletAddress: string, nonce: string): string {
    return `Welcome to BlockRegistry!\n\nClick to sign in and accept the Terms of Service.\n\nWallet address:\n${walletAddress}\n\nNonce:\n${nonce}`;
  }

  /**
   * Validate Ethereum address format
   */
  static isValidEthereumAddress(address: string): boolean {
    try {
      return ethers.isAddress(address);
    } catch {
      return false;
    }
  }

  /**
   * Generate a deterministic record ID from document data
   */
  static generateDeterministicRecordId(title: string, subject: string, timestamp: Date): string {
    const data = `${title}-${subject}-${timestamp.toISOString()}`;
    const hash = createHash('sha256').update(data).digest('hex');
    const shortHash = hash.substring(0, 8);
    const year = timestamp.getFullYear();
    
    return `REC-${year}-${shortHash.toUpperCase()}`;
  }

  /**
   * Validate file hash format
   */
  static isValidHash(hash: string, type: 'keccak256' | 'sha256' = 'keccak256'): boolean {
    if (type === 'keccak256') {
      return /^0x[a-fA-F0-9]{64}$/.test(hash);
    } else if (type === 'sha256') {
      return /^[a-fA-F0-9]{64}$/.test(hash);
    }
    return false;
  }

  /**
   * Generate QR code data for document verification
   */
  static generateQRData(baseUrl: string, recordId: string): string {
    return `${baseUrl}/verify/${recordId}`;
  }
}
