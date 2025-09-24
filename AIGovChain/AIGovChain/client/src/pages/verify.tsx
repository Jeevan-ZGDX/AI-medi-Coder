import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CryptoUtils } from "@/lib/crypto";
import { VerificationResult } from "@/types";
import { CheckCircle, XCircle, Upload, Key, Loader2, FileText, Calendar, Hash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Verify() {
  const [, params] = useRoute("/verify/:recordId");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [verificationMethod, setVerificationMethod] = useState<'file' | 'recordId'>('file');
  const [recordId, setRecordId] = useState(params?.recordId || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileHash, setFileHash] = useState<string>('');
  const { toast } = useToast();

  // Auto-verify if recordId is provided in URL
  useEffect(() => {
    if (params?.recordId) {
      setRecordId(params.recordId);
      setVerificationMethod('recordId');
      handleVerifyByRecordId(params.recordId);
    }
  }, [params?.recordId]);

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

  const handleVerifyByRecordId = async (id?: string) => {
    const idToVerify = id || recordId;
    if (!idToVerify.trim()) {
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
        body: JSON.stringify({ recordId: idToVerify }),
      });

      if (!response.ok) {
        throw new Error('Verification failed');
      }

      const result: VerificationResult = await response.json();
      setVerificationResult(result);

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
    setRecordId('');
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-red-heading mb-2">Verify Document</h1>
          <p className="text-muted-foreground">
            Verify the authenticity of any document registered on BlockRegistry
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Verification Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-red-heading">Choose Verification Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Method Selection */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant={verificationMethod === 'file' ? 'default' : 'outline'}
                  onClick={() => setVerificationMethod('file')}
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                  data-testid="button-method-file"
                >
                  <Upload className="w-5 h-5" />
                  <span className="text-sm">Upload File</span>
                </Button>
                <Button
                  variant={verificationMethod === 'recordId' ? 'default' : 'outline'}
                  onClick={() => setVerificationMethod('recordId')}
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                  data-testid="button-method-record-id"
                >
                  <Key className="w-5 h-5" />
                  <span className="text-sm">Record ID</span>
                </Button>
              </div>

              {/* File Upload Method */}
              {verificationMethod === 'file' && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                    <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="font-medium text-foreground mb-1">Drop document to verify</p>
                    <p className="text-sm text-muted-foreground mb-3">Or click to browse files</p>
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('file-input')?.click()}
                      data-testid="button-choose-file"
                    >
                      Choose File
                    </Button>
                    <input
                      id="file-input"
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
                      data-testid="input-file"
                    />
                  </div>

                  {selectedFile && (
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center space-x-3 mb-2">
                        <FileText className="w-5 h-5 text-primary" />
                        <div className="flex-1">
                          <p className="font-medium text-sm" data-testid="file-name">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {CryptoUtils.formatFileSize(selectedFile.size)} • {CryptoUtils.getFileTypeDisplayName(selectedFile.type)}
                          </p>
                        </div>
                      </div>
                      {fileHash && (
                        <div className="mt-2">
                          <Label className="text-xs">Document Hash:</Label>
                          <p className="hash-display text-xs bg-white p-2 rounded border break-all" data-testid="file-hash">
                            {fileHash}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

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
                    onClick={() => handleVerifyByRecordId()}
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

              {verificationResult && (
                <div className="pt-4">
                  <Button
                    variant="outline"
                    onClick={resetVerification}
                    className="w-full"
                    data-testid="button-clear-reset"
                  >
                    Clear & Reset
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Verification Result */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-red-heading">Verification Result</CardTitle>
            </CardHeader>
            <CardContent>
              {!verificationResult ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">
                    Select a verification method and upload a document or enter a record ID to verify
                  </p>
                </div>
              ) : verificationResult.isValid ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-green-800 dark:text-green-300" data-testid="verification-success-title">
                        Document Verified!
                      </h3>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        This document is authentic and registered on the blockchain
                      </p>
                    </div>
                  </div>

                  {verificationResult.document && (
                    <div className="space-y-4">
                      <Separator />
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <Label className="text-muted-foreground">Record ID</Label>
                            <p className="font-mono font-medium" data-testid="result-record-id">
                              {verificationResult.document.recordId}
                            </p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">Status</Label>
                            <Badge className="status-verified" data-testid="result-status">
                              {verificationResult.document.status}
                            </Badge>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">Type</Label>
                            <p className="font-medium" data-testid="result-document-type">
                              {verificationResult.document.documentType}
                            </p>
                          </div>
                        </div>

                        <div>
                          <Label className="text-muted-foreground">Document Title</Label>
                          <p className="font-medium" data-testid="result-title">
                            {verificationResult.document.title}
                          </p>
                        </div>

                        <div>
                          <Label className="text-muted-foreground">Subject/Owner</Label>
                          <p className="font-medium" data-testid="result-subject">
                            {verificationResult.document.subject}
                          </p>
                        </div>

                        <div>
                          <Label className="text-muted-foreground">Registered On</Label>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <p className="font-medium" data-testid="result-created-at">
                              {new Date(verificationResult.document.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div>
                          <Label className="text-muted-foreground">Document Hash</Label>
                          <div className="flex items-start space-x-2">
                            <Hash className="w-4 h-4 text-muted-foreground mt-1" />
                            <p className="hash-display text-xs bg-muted p-2 rounded break-all flex-1" data-testid="result-file-hash">
                              {verificationResult.document.fileHash}
                            </p>
                          </div>
                        </div>

                        {verificationResult.document.blockchainTxHash && (
                          <div>
                            <Label className="text-muted-foreground">Blockchain Transaction</Label>
                            <p className="hash-display text-xs font-mono bg-muted p-2 rounded break-all" data-testid="result-blockchain-tx">
                              {verificationResult.document.blockchainTxHash}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                      <XCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-red-800 dark:text-red-300" data-testid="verification-failure-title">
                        Document Not Found
                      </h3>
                      <p className="text-sm text-red-600 dark:text-red-400" data-testid="verification-error">
                        {verificationResult.error || "This document is not registered in our system"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Information Section */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-red-heading">About Document Verification</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-medium mb-2">How Verification Works</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Documents are identified by their cryptographic hash</li>
                  <li>• Hash is computed using keccak256 algorithm</li>
                  <li>• Registry records are stored on Ethereum blockchain</li>
                  <li>• Verification is instant and tamper-proof</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Security Features</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Immutable blockchain records</li>
                  <li>• Cryptographic document fingerprinting</li>
                  <li>• Decentralized verification system</li>
                  <li>• Public audit trail</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
