export interface User {
  id: string;
  username: string;
  email?: string;
  walletAddress?: string;
  role: 'admin' | 'registrar' | 'verifier';
  authMethod: 'email' | 'wallet' | 'hybrid';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  recordId: string;
  title: string;
  documentType: string;
  subject: string;
  registrarId: string;
  fileHash: string;
  ipfsHash?: string;
  blockchainTxHash?: string;
  status: 'pending' | 'registered' | 'verified' | 'revoked';
  metadata?: Record<string, any>;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationResult {
  isValid: boolean;
  document?: {
    recordId: string;
    title: string;
    documentType: string;
    subject: string;
    status: string;
    createdAt: string;
    fileHash: string;
    blockchainTxHash?: string;
  };
  error?: string;
}

export interface QrCode {
  id: string;
  documentId: string;
  qrData: string;
  accessCount: string;
  expiryDate?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Stats {
  totalDocuments: number;
  totalVerifications: number;
  todayVerifications: number;
  activeUsers: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface BlockchainInfo {
  networkName: string;
  contractAddress: string | null;
  ipfsConfigured: boolean;
}
