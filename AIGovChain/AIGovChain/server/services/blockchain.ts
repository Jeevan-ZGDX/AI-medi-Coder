import { ethers } from "ethers";

export interface BlockchainRecord {
  recordId: string;
  recordHash: string;
  subject: string;
  registrar: string;
  timestamp: number;
  ipfsCid?: string;
}

export class BlockchainService {
  private provider: ethers.Provider | null = null;
  private contract: ethers.Contract | null = null;
  private signer: ethers.Wallet | null = null;

  constructor() {
    this.initializeProvider();
  }

  private initializeProvider() {
    try {
      // Use environment variables for blockchain connection
      const rpcUrl = process.env.ETHEREUM_RPC_URL || process.env.POLYGON_RPC_URL || "http://localhost:8545";
      const privateKey = process.env.ETHEREUM_PRIVATE_KEY || process.env.WALLET_PRIVATE_KEY;
      
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      
      if (privateKey) {
        this.signer = new ethers.Wallet(privateKey, this.provider);
      }

      // Smart contract ABI (simplified for demo)
      const contractABI = [
        "function registerRecord(string recordId, string recordHash, string subject, string ipfsCid) external returns (uint256)",
        "function getRecord(string recordId) external view returns (string, string, string, address, uint256, string)",
        "function revokeRecord(string recordId) external",
        "function isRecordValid(string recordId) external view returns (bool)",
        "event RecordRegistered(string indexed recordId, string recordHash, string subject, address registrar, uint256 timestamp)",
        "event RecordRevoked(string indexed recordId, address revoker, uint256 timestamp)"
      ];

      const contractAddress = process.env.REGISTRY_CONTRACT_ADDRESS;
      if (contractAddress && this.signer) {
        this.contract = new ethers.Contract(contractAddress, contractABI, this.signer);
      }
    } catch (error) {
      console.error("Failed to initialize blockchain provider:", error);
    }
  }

  async registerDocument(record: Omit<BlockchainRecord, 'timestamp'>): Promise<{ txHash: string; blockNumber: number }> {
    if (!this.contract || !this.signer) {
      // Simulate blockchain registration for development
      return this.simulateBlockchainRegistration(record);
    }

    try {
      const tx = await this.contract.registerRecord(
        record.recordId,
        record.recordHash,
        record.subject,
        record.ipfsCid || ""
      );

      const receipt = await tx.wait();
      
      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error("Blockchain registration failed:", error);
      throw new Error("Failed to register document on blockchain");
    }
  }

  async getRecord(recordId: string): Promise<BlockchainRecord | null> {
    if (!this.contract) {
      // Simulate blockchain lookup for development
      return this.simulateBlockchainLookup(recordId);
    }

    try {
      const [recordHash, subject, registrar, timestamp, ipfsCid] = await this.contract.getRecord(recordId);
      
      if (!recordHash) {
        return null;
      }

      return {
        recordId,
        recordHash,
        subject,
        registrar,
        timestamp: Number(timestamp),
        ipfsCid: ipfsCid || undefined
      };
    } catch (error) {
      console.error("Blockchain lookup failed:", error);
      return null;
    }
  }

  async isRecordValid(recordId: string): Promise<boolean> {
    if (!this.contract) {
      // Simulate validation for development
      return this.simulateRecordValidation(recordId);
    }

    try {
      return await this.contract.isRecordValid(recordId);
    } catch (error) {
      console.error("Record validation failed:", error);
      return false;
    }
  }

  async revokeRecord(recordId: string): Promise<{ txHash: string; blockNumber: number }> {
    if (!this.contract || !this.signer) {
      throw new Error("Blockchain connection not available");
    }

    try {
      const tx = await this.contract.revokeRecord(recordId);
      const receipt = await tx.wait();
      
      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error("Record revocation failed:", error);
      throw new Error("Failed to revoke record on blockchain");
    }
  }

  // Simulation methods for development
  private async simulateBlockchainRegistration(record: Omit<BlockchainRecord, 'timestamp'>): Promise<{ txHash: string; blockNumber: number }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      txHash: `0x${Buffer.from(Date.now().toString()).toString('hex').padStart(64, '0')}`,
      blockNumber: Math.floor(Math.random() * 1000000) + 18000000
    };
  }

  private async simulateBlockchainLookup(recordId: string): Promise<BlockchainRecord | null> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For simulation, return a record if recordId follows expected pattern
    if (recordId.match(/^REC-\d{4}-\d{3}$/)) {
      return {
        recordId,
        recordHash: `0x${Buffer.from(recordId).toString('hex').padStart(64, '0')}`,
        subject: "Simulated Document",
        registrar: "0x1234567890123456789012345678901234567890",
        timestamp: Date.now() - Math.floor(Math.random() * 86400000), // Random time in last 24h
        ipfsCid: `Qm${Buffer.from(recordId).toString('hex').substring(0, 44)}`
      };
    }
    
    return null;
  }

  private async simulateRecordValidation(recordId: string): Promise<boolean> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // For simulation, validate records that follow expected pattern
    return recordId.match(/^REC-\d{4}-\d{3}$/) !== null;
  }

  getContractAddress(): string | null {
    return process.env.REGISTRY_CONTRACT_ADDRESS || null;
  }

  getNetworkName(): string {
    if (process.env.ETHEREUM_RPC_URL?.includes('mainnet')) return 'Ethereum Mainnet';
    if (process.env.POLYGON_RPC_URL?.includes('polygon')) return 'Polygon';
    if (process.env.ETHEREUM_RPC_URL?.includes('sepolia')) return 'Sepolia Testnet';
    return 'Local Development';
  }
}

export const blockchainService = new BlockchainService();
