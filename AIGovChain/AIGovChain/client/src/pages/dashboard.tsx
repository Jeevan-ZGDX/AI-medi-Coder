import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { Stats, Document } from "@/types";
import { Upload, CheckCircle, QrCode, TrendingUp, FileText, Users, Activity } from "lucide-react";

export default function Dashboard() {
  const { authState } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ['/api/stats'],
  });

  const { data: recentDocuments, isLoading: documentsLoading } = useQuery<{ documents: Document[] }>({
    queryKey: ['/api/documents'],
    queryFn: async () => {
      const response = await fetch('/api/documents?limit=5', {
        headers: {
          'Authorization': `Bearer ${authState.token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch documents');
      return response.json();
    },
  });

  const canRegister = authState.user?.role === 'registrar' || authState.user?.role === 'admin';

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="gradient-bg text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="text-red-500">Secure</span> Document Registry
              <br />on <span className="text-accent">Blockchain</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
              Store tamper-proof document hashes on Ethereum while keeping originals secure off-chain.
              Verify authenticity instantly with our decentralized registry system.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {canRegister && (
                <Link href="/register">
                  <Button 
                    size="lg" 
                    className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-4 text-lg"
                    data-testid="button-register-document"
                  >
                    Register Document
                  </Button>
                </Link>
              )}
              <Link href="/verify">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-2 border-white text-white hover:bg-white hover:text-primary px-8 py-4 text-lg"
                  data-testid="button-verify-document"
                >
                  Verify Document
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <Card className="bg-white shadow-sm">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-primary mb-2" data-testid="stat-total-documents">
                  {statsLoading ? "..." : stats?.totalDocuments?.toLocaleString() || 0}
                </div>
                <div className="text-muted-foreground">Documents Registered</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-sm">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-accent mb-2" data-testid="stat-total-verifications">
                  {statsLoading ? "..." : stats?.totalVerifications?.toLocaleString() || 0}
                </div>
                <div className="text-muted-foreground">Total Verifications</div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-success-green mb-2" data-testid="stat-today-verifications">
                  {statsLoading ? "..." : stats?.todayVerifications?.toLocaleString() || 0}
                </div>
                <div className="text-muted-foreground">Verifications Today</div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-red-heading mb-2" data-testid="stat-active-users">
                  {statsLoading ? "..." : stats?.activeUsers?.toLocaleString() || 0}
                </div>
                <div className="text-muted-foreground">Active Users</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Main Dashboard */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-red-heading mb-2">Document Dashboard</h2>
          <p className="text-muted-foreground">Manage your registered documents and verify new ones</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Register Card */}
          {canRegister && (
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mr-4">
                    <Upload className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Register Document</h3>
                    <p className="text-sm text-muted-foreground">Upload and secure your documents</p>
                  </div>
                </div>
                <Link href="/register">
                  <Button className="w-full" data-testid="button-start-registration">
                    Start Registration
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Verify Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mr-4">
                  <CheckCircle className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Verify Document</h3>
                  <p className="text-sm text-muted-foreground">Check document authenticity</p>
                </div>
              </div>
              <Link href="/verify">
                <Button className="w-full bg-accent hover:bg-accent/90" data-testid="button-verify-now">
                  Verify Now
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* QR Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mr-4">
                  <QrCode className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">View Records</h3>
                  <p className="text-sm text-muted-foreground">Browse and manage records</p>
                </div>
              </div>
              <Link href="/records">
                <Button className="w-full bg-green-500 hover:bg-green-600 text-white" data-testid="button-view-records">
                  View Records
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Documents */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl text-red-heading">Recent Documents</CardTitle>
                <p className="text-muted-foreground mt-1">Your latest registered documents</p>
              </div>
              <Link href="/records">
                <Button variant="outline" size="sm" data-testid="button-view-all-records">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {documentsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                ))}
              </div>
            ) : recentDocuments?.documents?.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No documents yet</h3>
                <p className="text-muted-foreground mb-4">
                  {canRegister 
                    ? "Start by registering your first document" 
                    : "No documents have been registered yet"
                  }
                </p>
                {canRegister && (
                  <Link href="/register">
                    <Button data-testid="button-register-first-document">Register Document</Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {recentDocuments?.documents?.map((doc) => (
                  <div key={doc.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground" data-testid={`doc-title-${doc.id}`}>
                        {doc.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {doc.documentType} • {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge 
                      className={
                        doc.status === 'registered' ? 'status-verified' :
                        doc.status === 'pending' ? 'status-pending' :
                        'status-revoked'
                      }
                      data-testid={`doc-status-${doc.id}`}
                    >
                      {doc.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
