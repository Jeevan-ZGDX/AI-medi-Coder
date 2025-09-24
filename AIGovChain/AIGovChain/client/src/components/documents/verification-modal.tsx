import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CryptoUtils } from "@/lib/crypto";
import { VerificationResult } from "@/types";
import { CheckCircle, XCircle, Upload, Key, Loader2, FileText, Calendar, Hash, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VerificationModalProps {
  trigger?: React.ReactNode;
  recordId?: string;
  onVerificationComplete?: (result: VerificationResult) => void;
}

export default function VerificationModal({ 
  trigger, 
  recordId: initialRecordId,
  onVerificationComplete 
}: VerificationModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [verificationMethod, setVerificationMethod] = useState<'file' | 'recordId'>('file');
  const [recordId, setRecordId] = useState(initialRecordId || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileHash, setFileHash] = useState<string>('');
  const { toast } = useToast();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!CryptoUtils.isValidFileType(file)) {
      toast({
        title: "Invalid file type",
        description: "Please select a valid document file (PDF, DOC, DOCX, PNG, JPG, TXT)",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    
    try {
      const hash = await CryptoUtils.computeFileHash(file);
      setFileHash(hash);
    } catch (error) {
      console.error('Failed to compute file hash:', error);
      toast({
        title: "Hash computation failed",
        description: "Failed to compute file hash",
        variant: "destructive",
      });
    }
  };

  const handleVerifyByFile = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to verify",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/verify/file', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Verification failed');
      }

      const result: VerificationResult = await response.json();
      setVerificationResult(result);
      onVerificationComplete?.(result);

      if (result.isValid) {
        toast({
          title: "Document verified",
          description: "This document is authentic and registered on the blockchain",
        });
      } else {
        toast({
          title: "Document not found",
          description: result.error || "This document is not registered in our system",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Verification failed:', error);
      toast({
        title: "Verification failed",
        description: error.message || "An error occurred during verification",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyByRecordId = async () => {
    if (!recordId.trim()) {
      toast({
        title: "No record ID provided",
        description: "Please enter a record ID to verify",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recordId }),
      });

      if (!response.ok) {
        throw new Error('Verification failed');
      }

      const result: VerificationResult = await response.json();
      setVerificationResult(result);
      onVerificationComplete?.(result);

      if (result.isValid) {
        toast({
          title: "Document verified",
          description: "This document is authentic and registered on the blockchain",
        });
      } else {
        toast({
          title: "Document not found",
          description: result.error || "This record ID is not registered in our system",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Verification failed:', error);
      toast({
        title: "Verification failed",
        description: error.message || "An error occurred during verification",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const resetVerification = () => {
    setVerificationResult(null);
    setSelectedFile(null);
    setFileHash('');
    setRecordId(initialRecordId || '');
  };

  const handleClose = () => {
    setIsOpen(false);
    resetVerification();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" data-testid="button-open-verification">
            <Search className="w-4 h-4 mr-2" />
            Verify Document
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-red-heading">Verify Document</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Verification Methods */}
          <div>
            <h4 className="font-medium text-foreground mb-4">Choose Verification Method</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                variant={verificationMethod === 'file' ? 'default' : 'outline'}
                onClick={() => setVerificationMethod('file')}
                className="h-auto p-4 flex flex-col items-center space-y-2"
                data-testid="button-method-file"
              >
                <Upload className="w-5 h-5" />
                <span className="text-sm">Upload File</span>
                <span className="text-xs text-muted-foreground">Upload the document to verify its hash</span>
              </Button>
              <Button
                variant={verificationMethod === 'recordId' ? 'default' : 'outline'}
                onClick={() => setVerificationMethod('recordId')}
                className="h-auto p-4 flex flex-col items-center space-y-2"
                data-testid="button-method-record-id"
              >
                <Key className="w-5 h-5" />
                <span className="text-sm">Record ID</span>
                <span className="text-xs text-muted-foreground">Enter the document's record ID</span>
              </Button>
            </div>
          </div>

          {/* File Upload Method */}
          {verificationMethod === 'file' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                {selectedFile ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center space-x-3">
                      <FileText className="w-8 h-8 text-green-500" />
                      <div className="text-left">
                        <p className="font-medium text-foreground" data-testid="selected-file-name">
                          {selectedFile.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {CryptoUtils.formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                    </div>
                    {fileHash && (
                      <div className="bg-muted p-3 rounded">
                        <Label className="text-xs">Hash:</Label>
                        <p className="hash-display text-xs break-all" data-testid="file-hash">
                          {fileHash}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <CheckCircle className="w-10 h-10 text-muted-foreground mx-auto" />
                    <div>
                      <p className="font-medium text-foreground mb-1">Drop document to verify</p>
                      <p className="text-sm text-muted-foreground mb-3">Or click to browse files</p>
                    </div>
                    <Button
                      onClick={() => document.getElementById('verification-file-input')?.click()}
                      data-testid="button-choose-file"
                    >
                      Choose File
                    </Button>
                  </div>
                )}
                <input
                  id="verification-file-input"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
                  data-testid="input-file"
                />
              </div>

              <Button
                onClick={handleVerifyByFile}
                disabled={!selectedFile || isVerifying}
                className="w-full"
                data-testid="button-verify-file"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Verify Document
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Record ID Method */}
          {verificationMethod === 'recordId' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="recordId">Record ID</Label>
                <Input
                  id="recordId"
                  type="text"
                  placeholder="Enter record ID (e.g., REC-2024-001)"
                  value={recordId}
                  onChange={(e) => setRecordId(e.target.value)}
                  data-testid="input-record-id"
                />
              </div>

              <Button
                onClick={handleVerifyByRecordId}
                disabled={!recordId.trim() || isVerifying}
                className="w-full"
                data-testid="button-verify-record-id"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Verify Record
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Verification Result */}
          {verificationResult && (
            <div className="space-y-4">
              <Separator />
              {verificationResult.isValid ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h5 className="font-medium text-green-800 dark:text-green-300" data-testid="verification-success">
                        Document Verified!
                      </h5>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        This document is authentic and registered on the blockchain
                      </p>
                    </div>
                  </div>

                  {verificationResult.document && (
                    <div className="bg-white dark:bg-gray-900 rounded border p-3 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Record ID:</span>
                        <span className="font-mono" data-testid="result-record-id">
                          {verificationResult.document.recordId}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Title:</span>
                        <span className="text-right" data-testid="result-title">
                          {verificationResult.document.title}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type:</span>
                        <span data-testid="result-type">
                          {verificationResult.document.documentType}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Registered:</span>
                        <span data-testid="result-registered">
                          {new Date(verificationResult.document.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-muted-foreground">Hash:</span>
                        <span className="font-mono text-xs break-all max-w-xs text-right" data-testid="result-hash">
                          {CryptoUtils.formatHash(verificationResult.document.fileHash)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3">
                      <XCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h5 className="font-medium text-red-800 dark:text-red-300" data-testid="verification-failure">
                        Document Not Found
                      </h5>
                      <p className="text-sm text-red-600 dark:text-red-400" data-testid="verification-error">
                        {verificationResult.error || "This document is not registered in our system"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <Button
              variant="outline"
              onClick={resetVerification}
              className="flex-1"
              data-testid="button-clear-reset"
            >
              Clear & Reset
            </Button>
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              data-testid="button-close"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
