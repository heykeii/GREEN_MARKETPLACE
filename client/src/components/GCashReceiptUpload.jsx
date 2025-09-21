import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  FaUpload, 
  FaSpinner, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaExclamationTriangle,
  FaImage,
  FaEye,
  FaCopy
} from 'react-icons/fa';
import { toast } from '@/utils/toast';
import axios from 'axios';

const GCashReceiptUpload = ({ orderId, order, onReceiptUpdate }) => {
  const [receipt, setReceipt] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Fetch existing receipt on component mount
  useEffect(() => {
    fetchExistingReceipt();
  }, [orderId]);

  const fetchExistingReceipt = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/payment-receipts/order/${orderId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setReceipt(response.data.receipt);
      }
    } catch (error) {
      // Receipt not found is expected for new orders
      if (error.response?.status !== 404) {
        console.error('Failed to fetch receipt:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a receipt image');
      return;
    }

    setUploading(true);
    
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('receipt', selectedFile);
      formData.append('orderId', orderId);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v1/payment-receipts/upload`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        const uploadedReceipt = response.data.receipt;
        setReceipt(uploadedReceipt);
        setSelectedFile(null);
        setPreviewUrl(null);
        
        // Reset file input
        const fileInput = document.getElementById('receipt-file');
        if (fileInput) fileInput.value = '';

        // Show appropriate message based on verification status
        if (uploadedReceipt.verificationStatus === 'verified') {
          toast.success('Receipt verified successfully! Payment confirmed.');
        } else if (uploadedReceipt.verificationStatus === 'rejected') {
          toast.error(`Receipt verification failed: ${uploadedReceipt.rejectionReason}`);
        } else {
          toast.success('Receipt uploaded successfully! Verification in progress...');
        }

        // Notify parent component
        if (onReceiptUpdate) {
          onReceiptUpdate(uploadedReceipt);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload receipt');
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-gray-500', text: 'Pending', icon: FaSpinner },
      processing: { color: 'bg-blue-500', text: 'Processing', icon: FaSpinner },
      verified: { color: 'bg-green-500', text: 'Verified', icon: FaCheckCircle },
      rejected: { color: 'bg-red-500', text: 'Rejected', icon: FaTimesCircle }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} text-white px-3 py-1`}>
        <IconComponent className="mr-1" />
        {config.text}
      </Badge>
    );
  };

  const copyReferenceNumber = () => {
    if (receipt?.extractedData?.referenceNumber) {
      navigator.clipboard.writeText(receipt.extractedData.referenceNumber);
      toast.success('Reference number copied to clipboard!');
    }
  };

  // Only show for GCash orders
  if (order?.paymentMethod !== 'gcash') {
    return null;
  }

  if (loading) {
    return (
      <Card className="shadow-lg">
        <CardContent className="p-6 text-center">
          <FaSpinner className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading receipt information...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FaImage className="text-blue-600" />
          GCash Payment Receipt
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {receipt ? (
          // Show existing receipt
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Receipt Status</h4>
              {getStatusBadge(receipt.verificationStatus)}
            </div>

            {receipt.verificationStatus === 'rejected' && receipt.rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <FaExclamationTriangle className="text-red-500 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-red-800">Verification Failed</h5>
                    <p className="text-sm text-red-700">{receipt.rejectionReason}</p>
                    <p className="text-xs text-red-600 mt-1">
                      Please upload a new receipt with the correct information.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {receipt.verificationStatus === 'verified' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <FaCheckCircle className="text-green-500 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-green-800">Payment Verified</h5>
                    <p className="text-sm text-green-700">
                      Your payment has been successfully verified and confirmed.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Extracted Data Display */}
            {receipt.extractedData && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h5 className="font-medium text-gray-900">Extracted Information</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {receipt.extractedData.referenceNumber && (
                    <div>
                      <span className="font-medium text-gray-700">Reference Number:</span>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="bg-white px-2 py-1 rounded border text-sm">
                          {receipt.extractedData.referenceNumber}
                        </code>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={copyReferenceNumber}
                          className="h-6 w-6 p-0"
                        >
                          <FaCopy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {receipt.extractedData.amount && (
                    <div>
                      <span className="font-medium text-gray-700">Amount:</span>
                      <p className="text-green-600 font-semibold">
                        ₱{receipt.extractedData.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  )}
                  {receipt.extractedData.sender?.name && (
                    <div>
                      <span className="font-medium text-gray-700">Sender:</span>
                      <p>{receipt.extractedData.sender.name}</p>
                    </div>
                  )}
                  {receipt.extractedData.receiver?.name && (
                    <div>
                      <span className="font-medium text-gray-700">Receiver:</span>
                      <p>{receipt.extractedData.receiver.name}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Receipt Image */}
            <div>
              <h5 className="font-medium text-gray-900 mb-2">Receipt Image</h5>
              <div className="border rounded-lg p-2 bg-gray-50">
                <img 
                  src={receipt.originalReceiptImage} 
                  alt="Payment Receipt" 
                  className="max-w-full max-h-64 mx-auto rounded border"
                />
                <div className="mt-2 text-center">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(receipt.originalReceiptImage, '_blank')}
                  >
                    <FaEye className="mr-2" />
                    View Full Size
                  </Button>
                </div>
              </div>
            </div>

            {/* Allow re-upload if rejected */}
            {receipt.verificationStatus === 'rejected' && (
              <div className="border-t pt-4">
                <h5 className="font-medium text-gray-900 mb-3">Upload New Receipt</h5>
                {/* File upload section - same as below */}
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="receipt-file" className="text-sm font-medium text-gray-700">
                      Select Receipt Image
                    </Label>
                    <Input
                      id="receipt-file"
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Supported formats: JPG, PNG, GIF (max 10MB)
                    </p>
                  </div>

                  {previewUrl && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Preview</Label>
                      <div className="mt-1 border rounded-lg p-2 bg-gray-50">
                        <img 
                          src={previewUrl} 
                          alt="Receipt Preview" 
                          className="max-w-full max-h-32 mx-auto rounded"
                        />
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={handleUpload} 
                    disabled={!selectedFile || uploading}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {uploading ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Uploading & Verifying...
                      </>
                    ) : (
                      <>
                        <FaUpload className="mr-2" />
                        Upload New Receipt
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Show upload form for new receipt
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Upload Your GCash Payment Receipt</h4>
              <p className="text-sm text-blue-700">
                Please upload a clear screenshot of your GCash payment receipt to verify your payment.
              </p>
            </div>

            <div>
              <Label htmlFor="receipt-file" className="text-sm font-medium text-gray-700">
                Select Receipt Image *
              </Label>
              <Input
                id="receipt-file"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="mt-1"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: JPG, PNG, GIF (max 10MB)
              </p>
            </div>

            {previewUrl && (
              <div>
                <Label className="text-sm font-medium text-gray-700">Preview</Label>
                <div className="mt-1 border rounded-lg p-2 bg-gray-50">
                  <img 
                    src={previewUrl} 
                    alt="Receipt Preview" 
                    className="max-w-full max-h-32 mx-auto rounded"
                  />
                </div>
              </div>
            )}

            <Button 
              onClick={handleUpload} 
              disabled={!selectedFile || uploading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {uploading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Uploading & Verifying...
                </>
              ) : (
                <>
                  <FaUpload className="mr-2" />
                  Upload Receipt
                </>
              )}
            </Button>

            <div className="text-xs text-gray-500 space-y-1">
              <p>• Make sure the receipt shows the complete transaction details</p>
              <p>• Include reference number, amount, sender, and receiver information</p>
              <p>• Ensure the image is clear and readable</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GCashReceiptUpload;
