import React, { useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-toastify';

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
  const [loading, setLoading] = useState(false);

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
    if (sellerType === 'business') {
      if (dtiRegistration) formData.append('dtiRegistration', dtiRegistration);
      if (businessPermit) formData.append('businessPermit', businessPermit);
      if (birRegistration) formData.append('birRegistration', birRegistration);
    }

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/seller/verify`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      toast.success('Seller application submitted!');
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Seller Verification Application</CardTitle>
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
  );
};

export default SellerApplicationForm; 