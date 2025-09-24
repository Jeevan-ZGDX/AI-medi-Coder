import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallet } from "@/hooks/use-wallet";
import { useAuth } from "@/hooks/use-auth";
import { CryptoUtils } from "@/lib/crypto";
import { Wallet, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WalletConnectProps {
  onSuccess?: () => void;
}

export default function WalletConnect({ onSuccess }: WalletConnectProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { walletState, connectWallet, signMessage } = useWallet();
  const { loginWithWallet } = useAuth();
  const { toast } = useToast();

  const handleConnectAndAuth = async () => {
    try {
      setIsAuthenticating(true);

      // First connect the wallet if not already connected
      if (!walletState.isConnected) {
        await connectWallet();
        return; // The useEffect will handle the rest when wallet connects
      }

      // Get nonce from server
      const nonceResponse = await fetch('/api/auth/nonce');
      const { nonce } = await nonceResponse.json();

      // Create sign message
      const message = CryptoUtils.createSignMessage(walletState.address!, nonce);
      
      // Sign the message
      const signature = await signMessage(message);

      // Authenticate with the signed message
      const success = await loginWithWallet(walletState.address!, signature, nonce);
      
      if (success && onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Wallet authentication failed:', error);
      toast({
        title: "Authentication failed",
        description: error.message || "Failed to authenticate with wallet",
        variant: "destructive",
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Auto-authenticate when wallet connects
  React.useEffect(() => {
    if (walletState.isConnected && !isAuthenticating) {
      handleConnectAndAuth();
    }
  }, [walletState.isConnected]);

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Wallet className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="text-xl">Connect Your Wallet</CardTitle>
        <CardDescription>
          Use your Web3 wallet to securely access BlockRegistry
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {walletState.error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{walletState.error}</p>
          </div>
        )}

        {walletState.isConnected ? (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse-green"></div>
                <span className="text-sm font-medium">Wallet Connected</span>
              </div>
              <p className="text-sm text-muted-foreground hash-display">
                {walletState.address}
              </p>
            </div>

            <Button
              onClick={handleConnectAndAuth}
              disabled={isAuthenticating}
              className="w-full"
              data-testid="button-authenticate-wallet"
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4 mr-2" />
                  Sign & Authenticate
                </>
              )}
            </Button>
          </div>
        ) : (
          <Button
            onClick={connectWallet}
            disabled={walletState.isLoading}
            className="w-full"
            size="lg"
            data-testid="button-connect-wallet"
          >
            {walletState.isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4 mr-2" />
                Connect MetaMask
              </>
            )}
          </Button>
        )}

        <div className="text-center text-sm text-muted-foreground">
          <p>Secure Web3 authentication</p>
          <p>No passwords required</p>
        </div>
      </CardContent>
    </Card>
  );
}
