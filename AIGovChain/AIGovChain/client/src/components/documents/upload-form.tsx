import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { CryptoUtils } from "@/lib/crypto";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Upload, FileText, Hash, Loader2, CheckCircle, X, Calendar } from "lucide-react";

const uploadSchema = z.object({
  title: z.string().min(1, "Document title is required").max(255, "Title too long"),
  documentType: z.string().min(1, "Document type is required"),
  subject: z.string().min(1, "Subject/owner is required").max(255, "Subject too long"),
  expiryDate: z.string().optional(),
});

type UploadFormData = z.infer<typeof uploadSchema>;

interface UploadProgress {
  step: 'upload' | 'hash' | 'ipfs' | 'blockchain' | 'complete';
  progress: number;
  message: string;
}

export default function UploadForm() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileHash, setFileHash] = useState<string>("");
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const { authState } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      title: "",
      documentType: "",
      subject: "",
      expiryDate: "",
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: UploadFormData & { file: File }) => {
      const formData = new FormData();
      formData.append('document', data.file);
      formData.append('title', data.title);
      formData.append('documentType', data.documentType);
      formData.append('subject', data.subject);
      if (data.expiryDate) {
        formData.append('expiryDate', data.expiryDate);
      }

      setUploadProgress({
        step: 'upload',
        progress: 10,
        message: 'Uploading document...'
      });

      const response = await apiRequest('POST', '/api/documents/upload', formData);
      return response.json();
    },
    onSuccess: (data) => {
      setUploadProgress({
        step: 'complete',
        progress: 100,
        message: 'Document registered successfully!'
      });

      toast({
        title: "Document registered",
        description: `Your document has been registered with ID: ${data.document.recordId}`,
      });

      // Reset form
      form.reset();
      setSelectedFile(null);
      setFileHash("");
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });

      // Clear progress after a delay
      setTimeout(() => {
        setUploadProgress(null);
      }, 3000);
    },
    onError: (error: any) => {
      console.error('Upload failed:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to register document",
        variant: "destructive",
      });
      setUploadProgress(null);
    },
  });

  const handleFileChange = async (file: File) => {
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
    
    // Auto-fill title if empty
    if (!form.getValues('title')) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      form.setValue('title', nameWithoutExt);
    }

    try {
      setUploadProgress({
        step: 'hash',
        progress: 30,
        message: 'Computing document hash...'
      });

      const hash = await CryptoUtils.computeFileHash(file);
      setFileHash(hash);
      
      setUploadProgress({
        step: 'hash',
        progress: 50,
        message: 'Hash computed successfully'
      });

      setTimeout(() => {
        setUploadProgress(null);
      }, 1000);
    } catch (error) {
      console.error('Failed to compute file hash:', error);
      toast({
        title: "Hash computation failed",
        description: "Failed to compute file hash",
        variant: "destructive",
      });
      setUploadProgress(null);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileChange(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileChange(files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFileHash("");
    form.setValue('title', '');
  };

  const onSubmit = (data: UploadFormData) => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate({ ...data, file: selectedFile });
  };

  const documentTypes = [
    "Certificate",
    "Contract",
    "Identity Document",
    "Academic Transcript",
    "License",
    "Permit",
    "Insurance Document",
    "Legal Document",
    "Financial Document",
    "Other"
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl text-red-heading">Register New Document</CardTitle>
        <p className="text-muted-foreground">
          Upload a document to generate its blockchain registry entry
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? "border-primary bg-primary/5"
              : selectedFile
              ? "border-green-300 bg-green-50 dark:bg-green-900/20"
              : "border-border hover:border-primary"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          data-testid="file-drop-zone"
        >
          {selectedFile ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-green-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground" data-testid="selected-file-name">
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {CryptoUtils.formatFileSize(selectedFile.size)} • {CryptoUtils.getFileTypeDisplayName(selectedFile.type)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  className="text-red-500 hover:text-red-700"
                  data-testid="button-remove-file"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {fileHash && (
                <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border">
                  <div className="flex items-center space-x-2 mb-2">
                    <Hash className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Document Hash (keccak256)</span>
                    <Badge variant="secondary" className="ml-auto">Computed</Badge>
                  </div>
                  <p className="hash-display text-xs bg-muted p-2 rounded break-all" data-testid="computed-hash">
                    {fileHash}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
              <div>
                <p className="text-lg font-medium text-foreground mb-2">
                  Drop files here or click to browse
                </p>
                <p className="text-muted-foreground text-sm">
                  Supports PDF, DOC, DOCX, PNG, JPG (Max 10MB)
                </p>
              </div>
              <Button
                type="button"
                onClick={() => document.getElementById('file-input')?.click()}
                data-testid="button-choose-files"
              >
                Choose Files
              </Button>
            </div>
          )}
          
          <input
            id="file-input"
            type="file"
            className="hidden"
            onChange={handleFileInputChange}
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
            data-testid="input-file"
          />
        </div>

        {/* Progress Indicator */}
        {uploadProgress && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  {uploadProgress.step === 'complete' ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  )}
                  <span className="font-medium">{uploadProgress.message}</span>
                </div>
                <Progress value={uploadProgress.progress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Document Metadata Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Title</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter document title"
                        data-testid="input-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="documentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-document-type">
                          <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {documentTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject/Owner</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Document owner or subject"
                        data-testid="input-subject"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Date (Optional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type="date"
                          className="pl-10"
                          min={new Date().toISOString().split('T')[0]}
                          data-testid="input-expiry-date"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={!selectedFile || uploadMutation.isPending}
                data-testid="button-register-blockchain"
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Registering on Blockchain...
                  </>
                ) : (
                  "Register on Blockchain"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  form.reset();
                  setSelectedFile(null);
                  setFileHash("");
                }}
                disabled={uploadMutation.isPending}
                data-testid="button-save-draft"
              >
                Clear Form
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
