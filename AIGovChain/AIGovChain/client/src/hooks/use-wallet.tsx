import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { WalletState } from "@/types";
import { web3Service } from "@/lib/web3";
import { useToast } from "@/hooks/use-toast";

interface WalletContextType {
  walletState: WalletState;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  signMessage: (message: string) => Promise<string>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    isLoading: false,
    error: null,
  });

  const { toast } = useToast();

  // Initialize wallet state
  useEffect(() => {
    const initializeWallet = async () => {
      try {
        const hasProvider = await web3Service.detectProvider();
        if (!hasProvider) {
          return;
        }

        const account = await web3Service.getAccount();
        if (account) {
          setWalletState({
            isConnected: true,
            address: account,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error('Failed to initialize wallet:', error);
      }
    };

    initializeWallet();
  }, []);

  // Set up event listeners
  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        setWalletState(prev => ({
          ...prev,
          address: accounts[0],
          isConnected: true,
        }));
      }
    };

    const handleChainChanged = (chainId: string) => {
      console.log('Chain changed to:', parseInt(chainId, 16));
      // Optionally handle chain changes
    };

    web3Service.onAccountsChanged(handleAccountsChanged);
    web3Service.onChainChanged(handleChainChanged);

    return () => {
      web3Service.removeAllListeners();
    };
  }, []);

  const connectWallet = async () => {
    try {
      setWalletState(prev => ({ ...prev, isLoading: true, error: null }));

      const hasProvider = await web3Service.detectProvider();
      if (!hasProvider) {
        throw new Error('MetaMask not detected. Please install MetaMask extension.');
      }

      const { address, chainId } = await web3Service.connectWallet();

      setWalletState({
        isConnected: true,
        address,
        isLoading: false,
        error: null,
      });

      toast({
        title: "Wallet connected",
        description: `Connected to ${address.substring(0, 6)}...${address.substring(address.length - 4)}`,
      });

      // Check if we're on the correct network
      if (chainId !== 1 && chainId !== 137 && chainId !== 31337) { // Mainnet, Polygon, or local
        toast({
          title: "Network notice",
          description: `Connected to chain ${chainId}. For full functionality, consider switching to Ethereum or Polygon.`,
          variant: "destructive",
        });
      }

    } catch (error: any) {
      console.error('Wallet connection failed:', error);
      
      setWalletState({
        isConnected: false,
        address: null,
        isLoading: false,
        error: error.message,
      });

      toast({
        title: "Wallet connection failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const disconnectWallet = () => {
    web3Service.disconnect();
    
    setWalletState({
      isConnected: false,
      address: null,
      isLoading: false,
      error: null,
    });

    toast({
      title: "Wallet disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  const signMessage = async (message: string): Promise<string> => {
    try {
      if (!walletState.isConnected) {
        throw new Error('Wallet not connected');
      }

      return await web3Service.signMessage(message);
    } catch (error: any) {
      console.error('Message signing failed:', error);
      toast({
        title: "Signing failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <WalletContext.Provider value={{
      walletState,
      connectWallet,
      disconnectWallet,
      signMessage,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
