import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Shield, ChevronDown, Wallet, LogOut, Settings, User } from "lucide-react";
import { CryptoUtils } from "@/lib/crypto";

export default function Navbar() {
  const [location] = useLocation();
  const { authState, logout } = useAuth();
  const { walletState, connectWallet, disconnectWallet } = useWallet();

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/register", label: "Register", roles: ['registrar', 'admin'] },
    { href: "/verify", label: "Verify" },
    { href: "/records", label: "Records" },
  ];

  const filteredNavItems = navItems.filter(item => 
    !item.roles || item.roles.includes(authState.user?.role || '')
  );

  const getInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and brand */}
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-red-heading">BlockRegistry</span>
            </Link>
            
            {/* Navigation links */}
            <div className="hidden md:flex items-center space-x-6 ml-8">
              {filteredNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`transition-colors font-medium ${
                    location === item.href
                      ? "text-primary"
                      : "text-foreground hover:text-primary"
                  }`}
                  data-testid={`nav-link-${item.label.toLowerCase()}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          
          {/* Right side - Wallet and user menu */}
          <div className="flex items-center space-x-4">
            {/* Wallet connection status */}
            {walletState.isConnected ? (
              <Badge className="wallet-connected" data-testid="wallet-connected">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse-green mr-2"></div>
                {CryptoUtils.formatAddress(walletState.address || '')}
              </Badge>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={connectWallet}
                disabled={walletState.isLoading}
                className="hidden sm:flex"
                data-testid="button-connect-wallet"
              >
                <Wallet className="w-4 h-4 mr-2" />
                {walletState.isLoading ? "Connecting..." : "Connect Wallet"}
              </Button>
            )}
            
            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2" data-testid="button-user-menu">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {authState.user ? getInitials(authState.user.username) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center space-x-2 p-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {authState.user ? getInitials(authState.user.username) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium" data-testid="text-username">
                      {authState.user?.username}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {authState.user?.role}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem data-testid="menu-item-profile">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="menu-item-settings">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                {walletState.isConnected && (
                  <DropdownMenuItem onClick={disconnectWallet} data-testid="menu-item-disconnect-wallet">
                    <Wallet className="w-4 h-4 mr-2" />
                    Disconnect Wallet
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive" data-testid="menu-item-logout">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
