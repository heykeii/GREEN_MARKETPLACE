import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/utils/toast';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';

const SellerApplicationForm = () => {
  const [sellerType, setSellerType] = useState('individual');
  const [tin, setTin] = useState('');
  const [govID1, setGovID1] = useState(null);
  const [govID2, setGovID2] = useState(null);
  const [proofOfAddress, setProofOfAddress] = useState(null);
  const [bankProof, setBankProof] = useState(null);
  const [dtiRegistration, setDtiRegistration] = useState(null);
  const [businessPermit, setBusinessPermit] = useState(null);
  const [birRegistration, setBirRegistration] = useState(null);
  const [gcashNumber, setGcashNumber] = useState('');
  const [gcashQR, setGcashQR] = useState(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // loading, verified, pending, rejected, none

  const formatGcash = (val) => {
    let digits = String(val || '').replace(/\D/g, '');
    if (digits.startsWith('63')) digits = digits.slice(2);
    if (digits.startsWith('0')) digits = digits.slice(1);
    const i = digits.indexOf('9');
    if (i !== -1) digits = digits.slice(i + 1);
    else digits = '';
    digits = digits.slice(0, 9);
    return '+639' + digits;
  };

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    if (!storedUser) {
      setStatus('none');
      return;
    }
    
    setUser(storedUser);
    
    // Check seller status
    if (storedUser.sellerStatus === 'verified') {
      setStatus('verified');
    } else if (storedUser.sellerStatus === 'pending') {
      setStatus('pending');
    } else if (storedUser.sellerStatus === 'rejected') {
      setStatus('rejected');
    } else {
      setStatus('none');
    }
  }, []);

  const handleFileChange = (e, setter) => {
    setter(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!govID1 || !govID2) {
      toast.error('Please upload both government IDs.');
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append('sellerType', sellerType);
    formData.append('tin', tin);
    formData.append('govIDs', govID1);
    formData.append('govIDs', govID2);
    if (proofOfAddress) formData.append('proofOfAddress', proofOfAddress);
    if (bankProof) formData.append('bankProof', bankProof);
    formData.append('gcashNumber', gcashNumber);
    if (gcashQR) formData.append('gcashQR', gcashQR);
    if (sellerType === 'business') {
      if (dtiRegistration) formData.append('dtiRegistration', dtiRegistration);
      if (businessPermit) formData.append('businessPermit', businessPermit);
      if (birRegistration) formData.append('birRegistration', birRegistration);
    }

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v1/seller/verify`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      toast.success('Seller application submitted!');
      // Update user status to pending
      const updatedUser = { ...user, sellerStatus: 'pending' };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setStatus('pending');
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to submit application.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Show status messages instead of form
  if (status === 'loading') {
    return (
      <>
        <Navbar/>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </>
    );
  }

  if (status === 'verified') {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="w-full max-w-md text-center">
            <CardContent className="pt-6">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-green-800 mb-2">Already Verified!</h2>
              <p className="text-gray-600 mb-4">
                Congratulations! You are already a verified seller on Green Marketplace.
              </p>
              <Badge className="bg-green-600 text-white px-4 py-2 text-lg">
                ✓ Verified Seller
              </Badge>
              <div className="mt-6">
                <p className="text-sm text-gray-500">
                  You can now start selling your products on our platform.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (status === 'pending') {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="w-full max-w-md text-center">
            <CardContent className="pt-6">
              <div className="flex justify-center mb-4">
                <Clock className="h-16 w-16 text-yellow-500" />
              </div>
              <h2 className="text-2xl font-bold text-yellow-800 mb-2">Application Pending</h2>
              <p className="text-gray-600 mb-4">
                Your seller application is under review. We will notify you once it has been processed.
              </p>
              <Badge className="bg-yellow-500 text-white px-4 py-2 text-lg">
                Pending Review
              </Badge>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (status === 'rejected') {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="w-full max-w-md text-center">
            <CardContent className="pt-6">
              <div className="flex justify-center mb-4">
                <XCircle className="h-16 w-16 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-red-800 mb-2">Application Rejected</h2>
              <p className="text-gray-600 mb-4">
                Sorry, your seller application was rejected. Please review the requirements and try again.
              </p>
              <Badge className="bg-red-600 text-white px-4 py-2 text-lg">
                Rejected
              </Badge>
              <div className="mt-6">
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg shadow"
                  onClick={() => {
                    setStatus('none');
                    setSellerType('individual');
                    setTin('');
                    setGovID1(null);
                    setGovID2(null);
                    setProofOfAddress(null);
                    setBankProof(null);
                    setDtiRegistration(null);
                    setBusinessPermit(null);
                    setBirRegistration(null);
                  }}
                >
                  Submit Another Application
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Show the application form for users with no seller status
  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-green-600" />
              Seller Verification Application
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label>Seller Type</Label>
                <div className="flex gap-4 mt-2">
                  <label>
                    <input
                      type="radio"
                      name="sellerType"
                      value="individual"
                      checked={sellerType === 'individual'}
                      onChange={() => setSellerType('individual')}
                    />{' '}
                    Individual
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="sellerType"
                      value="business"
                      checked={sellerType === 'business'}
                      onChange={() => setSellerType('business')}
                    />{' '}
                    Business
                  </label>
                </div>
              </div>
              <div>
                <Label htmlFor="tin">TIN</Label>
                <Input
                  id="tin"
                  name="tin"
                  value={tin}
                  onChange={e => setTin(e.target.value)}
                  required
                  placeholder="Enter your TIN"
                />
              </div>
              <div>
                <Label htmlFor="govID1">Government ID 1</Label>
                <Input
                  id="govID1"
                  name="govID1"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={e => handleFileChange(e, setGovID1)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="govID2">Government ID 2</Label>
                <Input
                  id="govID2"
                  name="govID2"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={e => handleFileChange(e, setGovID2)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="proofOfAddress">Proof of Address</Label>
                <Input
                  id="proofOfAddress"
                  name="proofOfAddress"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={e => handleFileChange(e, setProofOfAddress)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="bankProof">Bank Proof</Label>
                <Input
                  id="bankProof"
                  name="bankProof"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={e => handleFileChange(e, setBankProof)}
                  required
                />
              </div>
              {/* GCash Information */}
              <div>
                <Label htmlFor="gcashNumber">GCash Number</Label>
                <Input
                  id="gcashNumber"
                  name="gcashNumber"
                  value={gcashNumber}
                  onChange={e => setGcashNumber(formatGcash(e.target.value))}
                  placeholder="+639XXXXXXXXX"
                  inputMode="tel"
                  pattern="^\+639\d{9}$"
                  title="Use +639XXXXXXXXX (e.g., +639123456789)"
                  required
                />
              </div>
              <div>
                <Label htmlFor="gcashQR">GCash QR Code</Label>
                <Input
                  id="gcashQR"
                  name="gcashQR"
                  type="file"
                  accept="image/*"
                  onChange={e => handleFileChange(e, setGcashQR)}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">Upload a screenshot of your GCash QR code</p>
              </div>

              {sellerType === 'business' && (
                <>
                  <div>
                    <Label htmlFor="dtiRegistration">DTI Registration</Label>
                    <Input
                      id="dtiRegistration"
                      name="dtiRegistration"
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={e => handleFileChange(e, setDtiRegistration)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="businessPermit">Business Permit</Label>
                    <Input
                      id="businessPermit"
                      name="businessPermit"
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={e => handleFileChange(e, setBusinessPermit)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="birRegistration">BIR Registration</Label>
                    <Input
                      id="birRegistration"
                      name="birRegistration"
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={e => handleFileChange(e, setBirRegistration)}
                      required
                    />
                  </div>
                </>
              )}
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Application'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default SellerApplicationForm; 