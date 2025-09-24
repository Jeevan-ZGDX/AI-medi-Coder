import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Document } from "@/types";
import { CryptoUtils } from "@/lib/crypto";
import QRGenerator from "@/components/documents/qr-generator";
import VerificationModal from "./verification-modal";
import { 
  FileText, 
  Eye, 
  QrCode, 
  MoreVertical, 
  ExternalLink, 
  Copy,
  Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DocumentTableProps {
  documents: Document[];
  isLoading?: boolean;
  showRegistrar?: boolean;
}

export default function DocumentTable({ documents, isLoading, showRegistrar = false }: DocumentTableProps) {
  const [qrModalOpen, setQrModalOpen] = useState<string | null>(null);
  const { toast } = useToast();

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'registered':
      case 'verified':
        return 'status-verified';
      case 'pending':
        return 'status-pending';
      case 'revoked':
        return 'status-revoked';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type.toLowerCase()) {
      case 'certificate':
        return 'type-certificate';
      case 'contract':
        return 'type-contract';
      case 'identity document':
        return 'type-identity';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const copyToClipboard = async (text: string, description: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: `${description} copied to clipboard`,
      });
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse">
            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
            <div className="h-6 bg-gray-200 rounded w-20"></div>
            <div className="h-6 bg-gray-200 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No documents found</h3>
        <p className="text-muted-foreground mb-4">
          No documents match your current search criteria
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Document</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Record ID</TableHead>
            <TableHead>Status</TableHead>
            {showRegistrar && <TableHead>Registrar</TableHead>}
            <TableHead>Registered</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <TableRow key={doc.id} className="hover:bg-muted/50">
              <TableCell>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground" data-testid={`doc-title-${doc.id}`}>
                      {doc.title}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {doc.metadata?.originalFilename || 'Unknown file'}
                    </div>
                  </div>
                </div>
              </TableCell>
              
              <TableCell>
                <Badge className={getTypeBadgeClass(doc.documentType)} data-testid={`doc-type-${doc.id}`}>
                  {doc.documentType}
                </Badge>
              </TableCell>
              
              <TableCell>
                <div className="flex items-center space-x-2">
                  <code className="text-sm font-mono" data-testid={`doc-record-id-${doc.id}`}>
                    {doc.recordId}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(doc.recordId, "Record ID")}
                    className="h-6 w-6 p-0"
                    data-testid={`button-copy-record-id-${doc.id}`}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </TableCell>
              
              <TableCell>
                <Badge className={getStatusBadgeClass(doc.status)} data-testid={`doc-status-${doc.id}`}>
                  <div className={`w-1.5 h-1.5 rounded-full mr-1 ${
                    doc.status === 'registered' || doc.status === 'verified' ? 'bg-green-500' :
                    doc.status === 'pending' ? 'bg-yellow-500 animate-pulse' :
                    'bg-red-500'
                  }`}></div>
                  {doc.status}
                </Badge>
              </TableCell>
              
              {showRegistrar && (
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {CryptoUtils.formatAddress(doc.registrarId)}
                  </span>
                </TableCell>
              )}
              
              <TableCell>
                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span data-testid={`doc-created-${doc.id}`}>
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </TableCell>
              
              <TableCell className="text-right">
                <div className="flex items-center justify-end space-x-2">
                  <VerificationModal
                    recordId={doc.recordId}
                    trigger={
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title="Verify Document"
                        data-testid={`button-verify-${doc.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    }
                  />
                  
                  <QRGenerator
                    documentId={doc.id}
                    recordId={doc.recordId}
                    trigger={
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-accent hover:text-accent/80"
                        title="Generate QR Code"
                        data-testid={`button-qr-${doc.id}`}
                      >
                        <QrCode className="w-4 h-4" />
                      </Button>
                    }
                  />
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        data-testid={`button-more-${doc.id}`}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => copyToClipboard(doc.fileHash, "Document hash")}
                        data-testid={`menu-copy-hash-${doc.id}`}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Hash
                      </DropdownMenuItem>
                      
                      {doc.blockchainTxHash && (
                        <DropdownMenuItem
                          onClick={() => copyToClipboard(doc.blockchainTxHash!, "Transaction hash")}
                          data-testid={`menu-copy-tx-${doc.id}`}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Copy Tx Hash
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem
                        asChild
                        data-testid={`menu-view-details-${doc.id}`}
                      >
                        <Link href={`/verify/${doc.recordId}`}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
