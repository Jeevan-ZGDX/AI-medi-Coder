import { ethers } from "ethers";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export class Web3Service {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;

  async detectProvider(): Promise<boolean> {
    if (typeof window !== 'undefined' && window.ethereum) {
      return true;
    }
    return false;
  }

  async connectWallet(): Promise<{ address: string; chainId: number }> {
    if (!window.ethereum) {
      throw new Error('MetaMask not detected. Please install MetaMask.');
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please connect to MetaMask.');
      }

      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();

      const address = accounts[0];
      const network = await this.provider.getNetwork();
      
      return {
        address,
        chainId: Number(network.chainId)
      };
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error('Connection rejected by user');
      }
      throw new Error(`Failed to connect wallet: ${error.message}`);
    }
  }

  async getAccount(): Promise<string | null> {
    if (!window.ethereum) return null;

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_accounts',
      });
      return accounts.length > 0 ? accounts[0] : null;
    } catch (error) {
      console.error('Failed to get account:', error);
      return null;
    }
  }

  async signMessage(message: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    try {
      return await this.signer.signMessage(message);
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error('Signature rejected by user');
      }
      throw new Error(`Failed to sign message: ${error.message}`);
    }
  }

  async getNetwork(): Promise<{ chainId: number; name: string }> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    const network = await this.provider.getNetwork();
    return {
      chainId: Number(network.chainId),
      name: network.name
    };
  }

  async switchNetwork(chainId: number): Promise<void> {
    if (!window.ethereum) {
      throw new Error('MetaMask not detected');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        throw new Error('Network not added to MetaMask');
      }
      throw new Error(`Failed to switch network: ${switchError.message}`);
    }
  }

  onAccountsChanged(callback: (accounts: string[]) => void): void {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', callback);
    }
  }

  onChainChanged(callback: (chainId: string) => void): void {
    if (window.ethereum) {
      window.ethereum.on('chainChanged', callback);
    }
  }

  removeAllListeners(): void {
    if (window.ethereum) {
      window.ethereum.removeAllListeners('accountsChanged');
      window.ethereum.removeAllListeners('chainChanged');
    }
  }

  disconnect(): void {
    this.provider = null;
    this.signer = null;
  }

  isConnected(): boolean {
    return this.signer !== null;
  }

  getProvider(): ethers.BrowserProvider | null {
    return this.provider;
  }

  getSigner(): ethers.JsonRpcSigner | null {
    return this.signer;
  }
}

export const web3Service = new Web3Service();
