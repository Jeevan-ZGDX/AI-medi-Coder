export interface IPFSUploadResult {
  hash: string;
  size: number;
  url: string;
}

export class IPFSService {
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    // Use environment variables for IPFS configuration
    this.apiUrl = process.env.IPFS_API_URL || "https://api.pinata.cloud/pinning/pinFileToIPFS";
    this.apiKey = process.env.PINATA_API_KEY || process.env.IPFS_API_KEY || "";
  }

  async uploadFile(fileBuffer: Buffer, filename: string, metadata?: Record<string, any>): Promise<IPFSUploadResult> {
    if (!this.apiKey) {
      // Simulate IPFS upload for development
      return this.simulateIPFSUpload(fileBuffer, filename);
    }

    try {
      const formData = new FormData();
      const blob = new Blob([fileBuffer]);
      formData.append('file', blob, filename);
      
      if (metadata) {
        formData.append('pinataMetadata', JSON.stringify({
          name: filename,
          keyvalues: metadata
        }));
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`IPFS upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        hash: result.IpfsHash,
        size: result.PinSize,
        url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`
      };
    } catch (error) {
      console.error("IPFS upload failed:", error);
      throw new Error("Failed to upload file to IPFS");
    }
  }

  async retrieveFile(ipfsHash: string): Promise<ArrayBuffer> {
    const gatewayUrl = process.env.IPFS_GATEWAY_URL || "https://gateway.pinata.cloud/ipfs";
    
    try {
      const response = await fetch(`${gatewayUrl}/${ipfsHash}`);
      
      if (!response.ok) {
        throw new Error(`IPFS retrieval failed: ${response.statusText}`);
      }

      return await response.arrayBuffer();
    } catch (error) {
      console.error("IPFS retrieval failed:", error);
      throw new Error("Failed to retrieve file from IPFS");
    }
  }

  async pinFile(ipfsHash: string): Promise<boolean> {
    if (!this.apiKey) {
      // Simulate pinning for development
      return true;
    }

    try {
      const response = await fetch("https://api.pinata.cloud/pinning/pinByHash", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          hashToPin: ipfsHash,
          pinataMetadata: {
            name: `Pinned-${ipfsHash}`,
          }
        })
      });

      return response.ok;
    } catch (error) {
      console.error("IPFS pinning failed:", error);
      return false;
    }
  }

  async unpinFile(ipfsHash: string): Promise<boolean> {
    if (!this.apiKey) {
      return true;
    }

    try {
      const response = await fetch(`https://api.pinata.cloud/pinning/unpin/${ipfsHash}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error("IPFS unpinning failed:", error);
      return false;
    }
  }

  getGatewayUrl(ipfsHash: string): string {
    const gatewayUrl = process.env.IPFS_GATEWAY_URL || "https://gateway.pinata.cloud/ipfs";
    return `${gatewayUrl}/${ipfsHash}`;
  }

  // Simulation method for development
  private async simulateIPFSUpload(fileBuffer: Buffer, filename: string): Promise<IPFSUploadResult> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate a realistic-looking IPFS hash
    const hash = `Qm${Buffer.from(`${filename}-${Date.now()}`).toString('hex').substring(0, 44)}`;
    
    return {
      hash,
      size: fileBuffer.length,
      url: `https://gateway.pinata.cloud/ipfs/${hash}`
    };
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

export const ipfsService = new IPFSService();
