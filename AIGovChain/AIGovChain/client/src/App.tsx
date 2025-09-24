import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { WalletProvider } from "@/hooks/use-wallet";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import Dashboard from "@/pages/dashboard";
import Register from "@/pages/register";
import Verify from "@/pages/verify";
import Records from "@/pages/records";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/use-auth";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { authState } = useAuth();
  
  if (authState.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    return <Login />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <div className="min-h-screen bg-background">
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/">
          <ProtectedRoute>
            <Navbar />
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/register" component={Register} />
              <Route path="/verify" component={Verify} />
              <Route path="/verify/:recordId" component={Verify} />
              <Route path="/records" component={Records} />
              <Route component={NotFound} />
            </Switch>
            <Footer />
          </ProtectedRoute>
        </Route>
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WalletProvider>
            <Toaster />
            <Router />
          </WalletProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
