import { ethers } from "ethers";

export class CryptoUtils {
  /**
   * Compute keccak256 hash of a file
   */
  static async computeFileHash(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    return ethers.keccak256(uint8Array);
  }

  /**
   * Compute keccak256 hash from ArrayBuffer
   */
  static computeBufferHash(buffer: ArrayBuffer): string {
    const uint8Array = new Uint8Array(buffer);
    return ethers.keccak256(uint8Array);
  }

  /**
   * Verify Ethereum signature
   */
  static verifySignature(message: string, signature: string, expectedAddress: string): boolean {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Create sign message for wallet authentication
   */
  static createSignMessage(walletAddress: string, nonce: string): string {
    return `Welcome to BlockRegistry!

Click to sign in and accept the Terms of Service.

Wallet address:
${walletAddress}

Nonce:
${nonce}`;
  }

  /**
   * Validate Ethereum address
   */
  static isValidEthereumAddress(address: string): boolean {
    try {
      return ethers.isAddress(address);
    } catch {
      return false;
    }
  }

  /**
   * Format hash for display
   */
  static formatHash(hash: string, length = 8): string {
    if (!hash) return '';
    if (hash.length <= length * 2 + 2) return hash;
    return `${hash.substring(0, length + 2)}...${hash.substring(hash.length - length)}`;
  }

  /**
   * Format address for display
   */
  static formatAddress(address: string, length = 6): string {
    if (!address) return '';
    if (address.length <= length * 2 + 2) return address;
    return `${address.substring(0, length + 2)}...${address.substring(address.length - length)}`;
  }

  /**
   * Generate random nonce
   */
  static generateNonce(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Validate file hash format
   */
  static isValidHash(hash: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(hash);
  }

  /**
   * Convert file size to human readable format
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Validate file type for document upload
   */
  static isValidFileType(file: File): boolean {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'text/plain'
    ];
    
    return allowedTypes.includes(file.type);
  }

  /**
   * Get file type display name
   */
  static getFileTypeDisplayName(mimeType: string): string {
    const typeMap: Record<string, string> = {
      'application/pdf': 'PDF Document',
      'application/msword': 'Word Document',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
      'image/png': 'PNG Image',
      'image/jpeg': 'JPEG Image',
      'image/jpg': 'JPG Image',
      'text/plain': 'Text File'
    };
    
    return typeMap[mimeType] || 'Unknown';
  }
}
