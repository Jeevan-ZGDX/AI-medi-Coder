import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { Document } from "@/types";
import DocumentTable from "@/components/documents/document-table";
import { Search, Filter, Download } from "lucide-react";

export default function Records() {
  const { authState } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  const { data: documentsData, isLoading, refetch } = useQuery<{ documents: Document[] }>({
    queryKey: ['/api/documents', searchQuery, statusFilter, typeFilter, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: ((currentPage - 1) * pageSize).toString(),
      });

      if (searchQuery.trim()) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/documents?${params}`, {
        headers: {
          'Authorization': `Bearer ${authState.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      return response.json();
    },
  });

  const filteredDocuments = documentsData?.documents?.filter((doc) => {
    if (statusFilter !== "all" && doc.status !== statusFilter) return false;
    if (typeFilter !== "all" && doc.documentType !== typeFilter) return false;
    return true;
  }) || [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    refetch();
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setTypeFilter("all");
    setCurrentPage(1);
    refetch();
  };

  const exportDocuments = () => {
    // In a real implementation, this would generate and download a CSV/Excel file
    console.log('Exporting documents...');
  };

  // Extract unique document types for filter
  const documentTypes = Array.from(
    new Set(documentsData?.documents?.map(doc => doc.documentType) || [])
  );

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-red-heading mb-2">Document Records</h1>
              <p className="text-muted-foreground">
                Browse and manage all registered documents
              </p>
            </div>
            <Button
              variant="outline"
              onClick={exportDocuments}
              className="hidden sm:flex"
              data-testid="button-export"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg text-red-heading">Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search Input */}
                <div className="md:col-span-2">
                  <Input
                    type="text"
                    placeholder="Search by title, subject, or record ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                    data-testid="input-search"
                  />
                </div>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger data-testid="select-status-filter">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="registered">Registered</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="revoked">Revoked</SelectItem>
                  </SelectContent>
                </Select>

                {/* Type Filter */}
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger data-testid="select-type-filter">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {documentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-4">
                <Button type="submit" data-testid="button-search">
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearFilters}
                  data-testid="button-clear-filters"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
                <div className="text-sm text-muted-foreground">
                  {filteredDocuments.length > 0 && (
                    <span data-testid="results-count">
                      Showing {filteredDocuments.length} results
                    </span>
                  )}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Documents Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl text-red-heading">Documents</CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  data-testid="button-refresh"
                >
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <DocumentTable
              documents={filteredDocuments}
              isLoading={isLoading}
              showRegistrar={authState.user?.role === 'admin'}
            />
          </CardContent>
        </Card>

        {/* Pagination */}
        {filteredDocuments.length > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredDocuments.length)} of {filteredDocuments.length} results
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                data-testid="button-previous-page"
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground px-3">
                Page {currentPage}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={filteredDocuments.length < pageSize}
                data-testid="button-next-page"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
