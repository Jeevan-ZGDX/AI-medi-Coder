import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { QrCode, Copy, Download, Share, ExternalLink, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import QRCodeCanvas from "qrcode";

interface QRGeneratorProps {
  documentId: string;
  recordId: string;
  trigger?: React.ReactNode;
}

interface QrCodeData {
  id: string;
  documentId: string;
  qrData: string;
  accessCount: string;
  expiryDate?: string;
  isActive: boolean;
  createdAt: string;
}

export default function QRGenerator({ documentId, recordId, trigger }: QRGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const { authState } = useAuth();
  const { toast } = useToast();

  const { data: qrCodeData, isLoading } = useQuery<{ qrCode: QrCodeData }>({
    queryKey: ['/api/qr', documentId],
    queryFn: async () => {
      const response = await fetch(`/api/qr/${documentId}`, {
        headers: {
          'Authorization': `Bearer ${authState.token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch QR code');
      return response.json();
    },
    enabled: isOpen,
  });

  // Generate QR code canvas when data is available
  React.useEffect(() => {
    if (qrCodeData?.qrCode?.qrData) {
      generateQRCodeImage(qrCodeData.qrCode.qrData);
    }
  }, [qrCodeData]);

  const generateQRCodeImage = async (data: string) => {
    try {
      const canvas = document.createElement('canvas');
      await QRCodeCanvas.toCanvas(canvas, data, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeDataUrl(canvas.toDataURL());
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      toast({
        title: "QR Code generation failed",
        description: "Failed to generate QR code image",
        variant: "destructive",
      });
    }
  };

  const copyQRData = async () => {
    if (qrCodeData?.qrCode?.qrData) {
      try {
        await navigator.clipboard.writeText(qrCodeData.qrCode.qrData);
        toast({
          title: "Copied to clipboard",
          description: "QR code URL copied to clipboard",
        });
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        toast({
          title: "Copy failed",
          description: "Failed to copy to clipboard",
          variant: "destructive",
        });
      }
    }
  };

  const downloadQRCode = () => {
    if (qrCodeDataUrl) {
      const link = document.createElement('a');
      link.download = `qr-code-${recordId}.png`;
      link.href = qrCodeDataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "QR code downloaded",
        description: "QR code image has been downloaded",
      });
    }
  };

  const shareQRCode = async () => {
    if (qrCodeData?.qrCode?.qrData && navigator.share) {
      try {
        await navigator.share({
          title: `Verify Document: ${recordId}`,
          text: `Verify this document on BlockRegistry`,
          url: qrCodeData.qrCode.qrData,
        });
      } catch (error) {
        console.error('Share failed:', error);
        // Fallback to copying URL
        copyQRData();
      }
    } else {
      copyQRData();
    }
  };

  const openInNewTab = () => {
    if (qrCodeData?.qrCode?.qrData) {
      window.open(qrCodeData.qrCode.qrData, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" data-testid="button-generate-qr">
            <QrCode className="w-4 h-4 mr-2" />
            Generate QR
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-red-heading">QR Code Generator</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Document Info */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <QrCode className="w-4 h-4 text-primary" />
              <span className="font-medium">Document Verification QR</span>
            </div>
            <p className="text-sm text-muted-foreground">Record ID: {recordId}</p>
          </div>

          {/* QR Code Display */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : qrCodeDataUrl ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <img
                      src={qrCodeDataUrl}
                      alt={`QR Code for ${recordId}`}
                      className="border rounded-lg"
                      data-testid="qr-code-image"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Badge variant="outline" className="text-xs">
                      Scans: {qrCodeData?.qrCode?.accessCount || '0'}
                    </Badge>
                    {qrCodeData?.qrCode?.expiryDate && (
                      <p className="text-xs text-muted-foreground">
                        Expires: {new Date(qrCodeData.qrCode.expiryDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Failed to generate QR code</p>
            </div>
          )}

          {/* QR Data URL */}
          {qrCodeData?.qrCode?.qrData && (
            <div className="space-y-2">
              <Label htmlFor="qr-url" className="text-sm font-medium">
                Verification URL
              </Label>
              <div className="flex space-x-2">
                <Input
                  id="qr-url"
                  value={qrCodeData.qrCode.qrData}
                  readOnly
                  className="text-xs"
                  data-testid="qr-url-input"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyQRData}
                  data-testid="button-copy-url"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {qrCodeDataUrl && (
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={downloadQRCode}
                className="flex items-center justify-center space-x-2"
                data-testid="button-download-qr"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={shareQRCode}
                className="flex items-center justify-center space-x-2"
                data-testid="button-share-qr"
              >
                <Share className="w-4 h-4" />
                <span>Share</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={openInNewTab}
                className="flex items-center justify-center space-x-2 col-span-2"
                data-testid="button-open-verification"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open Verification Page</span>
              </Button>
            </div>
          )}

          {/* Usage Instructions */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium">How to use this QR code:</p>
            <ul className="list-disc list-inside space-y-0.5 ml-2">
              <li>Share with document recipients</li>
              <li>Scan to instantly verify document authenticity</li>
              <li>No login required for verification</li>
              <li>Works with any QR code scanner</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
