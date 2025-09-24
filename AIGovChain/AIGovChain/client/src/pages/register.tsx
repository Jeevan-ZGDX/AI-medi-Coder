import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import UploadForm from "@/components/documents/upload-form";
import { useLocation } from "wouter";

export default function Register() {
  const { authState } = useAuth();
  const [, setLocation] = useLocation();

  // Check if user has permission to register documents
  const canRegister = authState.user?.role === 'registrar' || authState.user?.role === 'admin';

  React.useEffect(() => {
    if (!canRegister) {
      setLocation("/dashboard");
    }
  }, [canRegister, setLocation]);

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-red-heading mb-2">Register New Document</h1>
          <p className="text-muted-foreground">
            Upload a document to generate its blockchain registry entry with tamper-proof verification
          </p>
        </div>

        {/* Registration Form */}
        <UploadForm />

        {/* Information Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-red-heading">How it Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">1</div>
                <div>
                  <p className="font-medium">Upload Document</p>
                  <p className="text-muted-foreground">Select and upload your document file</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">2</div>
                <div>
                  <p className="font-medium">Generate Hash</p>
                  <p className="text-muted-foreground">Compute keccak256 hash of your document</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">3</div>
                <div>
                  <p className="font-medium">Store on IPFS</p>
                  <p className="text-muted-foreground">Upload original file to decentralized storage</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">4</div>
                <div>
                  <p className="font-medium">Register on Blockchain</p>
                  <p className="text-muted-foreground">Record hash and metadata on Ethereum</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-red-heading">Security Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Tamper-proof document verification</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Immutable blockchain records</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Decentralized file storage</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Cryptographic hash verification</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Public verification portal</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>QR code generation for easy access</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
