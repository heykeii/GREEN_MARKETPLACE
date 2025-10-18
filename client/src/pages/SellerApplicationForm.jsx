import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/utils/toast';
import { CheckCircle, Clock, XCircle, AlertCircle, Upload, FileText, Building2, User, Smartphone, QrCode } from 'lucide-react';
import Navbar from '@/components/Navbar';

const SellerApplicationForm = () => {
  const [sellerType, setSellerType] = useState('individual');
  const [govID1, setGovID1] = useState(null);
  const [govID2, setGovID2] = useState(null);
  const [proofOfAddress, setProofOfAddress] = useState(null);
  const [bankProof, setBankProof] = useState(null);
  const [businessPermit, setBusinessPermit] = useState(null);
  const [birRegistration, setBirRegistration] = useState(null);
  const [gcashNumber, setGcashNumber] = useState('');
  const [gcashQR, setGcashQR] = useState(null);
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState({
    street: '',
    city: '',
    province: '',
    zipCode: ''
  });
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');
  const [errors, setErrors] = useState({});

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

  const handleFileChange = (e, setter, fieldName) => {
    const file = e.target.files[0];
    setter(file);
    
    // Clear error for this field when a file is selected
    if (file && errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    
    // Validate required fields
    const newErrors = {};
    
    if (!govID1) {
      newErrors.govID1 = 'Please select a file.';
    }
    
    if (!govID2) {
      newErrors.govID2 = 'Please select a file.';
    }
    
    if (!proofOfAddress) {
      newErrors.proofOfAddress = 'Please select a file.';
    }
    
    if (!bankProof) {
      newErrors.bankProof = 'Please select a file.';
    }
    
    if (!gcashQR) {
      newErrors.gcashQR = 'Please select a file.';
    }
    
    if (sellerType === 'business') {
      if (!businessPermit) {
        newErrors.businessPermit = 'Please select a file.';
      }
      if (!birRegistration) {
        newErrors.birRegistration = 'Please select a file.';
      }
      if (!businessName.trim()) {
        newErrors.businessName = 'Business name is required.';
      }
      if (!businessAddress.street.trim()) {
        newErrors.businessAddressStreet = 'Street address is required.';
      }
      if (!businessAddress.city.trim()) {
        newErrors.businessAddressCity = 'City is required.';
      }
      if (!businessAddress.province.trim()) {
        newErrors.businessAddressProvince = 'Province is required.';
      }
      if (!businessAddress.zipCode.trim()) {
        newErrors.businessAddressZipCode = 'ZIP code is required.';
      }
    }
    
    // If there are validation errors, set them and return
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please upload all required documents.');
      return;
    }
    
    setLoading(true);
    const formData = new FormData();
    formData.append('sellerType', sellerType);
    formData.append('govIDs', govID1);
    formData.append('govIDs', govID2);
    if (proofOfAddress) formData.append('proofOfAddress', proofOfAddress);
    if (bankProof) formData.append('bankProof', bankProof);
    formData.append('gcashNumber', gcashNumber);
    if (gcashQR) formData.append('gcashQR', gcashQR);
    if (sellerType === 'business') {
      if (businessPermit) formData.append('businessPermit', businessPermit);
      if (birRegistration) formData.append('birRegistration', birRegistration);
      formData.append('businessName', businessName);
      formData.append('businessAddress[street]', businessAddress.street);
      formData.append('businessAddress[city]', businessAddress.city);
      formData.append('businessAddress[province]', businessAddress.province);
      formData.append('businessAddress[zipCode]', businessAddress.zipCode);
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

  const FileUploadField = ({ id, label, onChange, required, icon: Icon, helpText, file, error }) => (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <Icon className="h-4 w-4 text-green-600" />
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="relative">
        <Input
          id={id}
          name={id}
          type="file"
          accept="image/*,application/pdf"
          onChange={onChange}
          className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 transition-all"
        />
        {file && (
          <div className="mt-2 flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
            <CheckCircle className="h-4 w-4" />
            <span className="font-medium">{file.name}</span>
          </div>
        )}
        {error && (
          <div className="mt-2 flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium">{error}</span>
          </div>
        )}
      </div>
      {helpText && <p className="text-xs text-gray-500 mt-1 ml-1">{helpText}</p>}
    </div>
  );

  if (status === 'loading') {
    return (
      <>
        <Navbar/>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-green-400 animate-ping"></div>
          </div>
        </div>
      </>
    );
  }

  if (status === 'verified') {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4">
          <Card className="w-full max-w-lg text-center shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-12 pb-8 px-8">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-400 rounded-full blur-2xl opacity-40 animate-pulse"></div>
                  <CheckCircle className="relative h-24 w-24 text-green-600" strokeWidth={1.5} />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">Already Verified!</h2>
              <p className="text-gray-600 mb-6 leading-relaxed text-base">
                Congratulations! You are already a verified seller on Green Marketplace.
              </p>
              <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 text-base font-semibold shadow-lg">
                ✓ Verified Seller
              </Badge>
              <div className="mt-8 pt-6 border-t border-gray-200">
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 p-4">
          <Card className="w-full max-w-lg text-center shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-12 pb-8 px-8">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-yellow-400 rounded-full blur-2xl opacity-40 animate-pulse"></div>
                  <Clock className="relative h-24 w-24 text-yellow-600 animate-pulse" strokeWidth={1.5} />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">Application Pending</h2>
              <p className="text-gray-600 mb-6 leading-relaxed text-base">
                Your seller application is under review. We will notify you once it has been processed.
              </p>
              <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-6 py-3 text-base font-semibold shadow-lg">
                <Clock className="inline h-4 w-4 mr-2" />
                Pending Review
              </Badge>
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  This typically takes 1-3 business days.
                </p>
              </div>
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 p-4">
          <Card className="w-full max-w-lg text-center shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-12 pb-8 px-8">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-400 rounded-full blur-2xl opacity-40"></div>
                  <XCircle className="relative h-24 w-24 text-red-600" strokeWidth={1.5} />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">Application Rejected</h2>
              <p className="text-gray-600 mb-6 leading-relaxed text-base">
                Sorry, your seller application was rejected. Please review the requirements and try again.
              </p>
              <Badge className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-3 text-base font-semibold shadow-lg mb-6">
                Rejected
              </Badge>
              <div className="mt-6">
                <Button
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-6 rounded-xl shadow-lg font-semibold transition-all transform hover:scale-105"
                  onClick={() => {
                    setStatus('none');
                    setSellerType('individual');
                    setGovID1(null);
                    setGovID2(null);
                    setProofOfAddress(null);
                    setBankProof(null);
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

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl mb-4 shadow-lg">
              <AlertCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">Seller Verification</h1>
            <p className="text-gray-600 text-lg">Complete your application to start selling on Green Marketplace</p>
          </div>

          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b bg-gradient-to-r from-green-50 to-emerald-50 pb-6">
              <CardTitle className="text-2xl font-bold text-gray-900">Application Form</CardTitle>
              <p className="text-sm text-gray-600 mt-2">Please provide accurate information and upload required documents</p>
            </CardHeader>
            <CardContent className="pt-8 pb-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Seller Type Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700">Seller Type <span className="text-red-500">*</span></Label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className={`relative flex items-center gap-3 p-5 rounded-xl border-2 cursor-pointer transition-all ${sellerType === 'individual' ? 'border-green-600 bg-green-50 shadow-md' : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/50'}`}>
                      <input
                        type="radio"
                        name="sellerType"
                        value="individual"
                        checked={sellerType === 'individual'}
                        onChange={() => setSellerType('individual')}
                        className="w-5 h-5 text-green-600 focus:ring-green-500"
                      />
                      <User className={`h-6 w-6 ${sellerType === 'individual' ? 'text-green-600' : 'text-gray-400'}`} />
                      <div>
                        <div className={`font-semibold ${sellerType === 'individual' ? 'text-green-900' : 'text-gray-700'}`}>Individual</div>
                        <div className="text-xs text-gray-500">Personal seller</div>
                      </div>
                    </label>
                    <label className={`relative flex items-center gap-3 p-5 rounded-xl border-2 cursor-pointer transition-all ${sellerType === 'business' ? 'border-green-600 bg-green-50 shadow-md' : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/50'}`}>
                      <input
                        type="radio"
                        name="sellerType"
                        value="business"
                        checked={sellerType === 'business'}
                        onChange={() => setSellerType('business')}
                        className="w-5 h-5 text-green-600 focus:ring-green-500"
                      />
                      <Building2 className={`h-6 w-6 ${sellerType === 'business' ? 'text-green-600' : 'text-gray-400'}`} />
                      <div>
                        <div className={`font-semibold ${sellerType === 'business' ? 'text-green-900' : 'text-gray-700'}`}>Business</div>
                        <div className="text-xs text-gray-500">Registered entity</div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-8"></div>

                {/* Required Documents Section */}
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-600" />
                    Required Documents
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FileUploadField
                      id="govID1"
                      label="Government ID 1"
                      icon={FileText}
                      onChange={e => handleFileChange(e, setGovID1, 'govID1')}
                      required
                      file={govID1}
                      error={errors.govID1}
                    />
                    
                    <FileUploadField
                      id="govID2"
                      label="Government ID 2"
                      icon={FileText}
                      onChange={e => handleFileChange(e, setGovID2, 'govID2')}
                      required
                      file={govID2}
                      error={errors.govID2}
                    />
                    
                    <FileUploadField
                      id="proofOfAddress"
                      label="Proof of Address"
                      icon={FileText}
                      onChange={e => handleFileChange(e, setProofOfAddress, 'proofOfAddress')}
                      required
                      file={proofOfAddress}
                      error={errors.proofOfAddress}
                    />
                    
                    <FileUploadField
                      id="bankProof"
                      label="Bank Proof"
                      icon={FileText}
                      onChange={e => handleFileChange(e, setBankProof, 'bankProof')}
                      required
                      file={bankProof}
                      error={errors.bankProof}
                    />
                  </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-8"></div>

                {/* GCash Information Section */}
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-green-600" />
                    GCash Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="gcashNumber" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-green-600" />
                        GCash Number
                        <span className="text-red-500">*</span>
                      </Label>
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
                        className="h-12 text-base border-2 focus:border-green-500 focus:ring-green-500"
                      />
                      <p className="text-xs text-gray-500 ml-1">Format: +639XXXXXXXXX</p>
                    </div>
                    
                    <FileUploadField
                      id="gcashQR"
                      label="GCash QR Code"
                      icon={QrCode}
                      onChange={e => handleFileChange(e, setGcashQR, 'gcashQR')}
                      required
                      helpText="Upload a screenshot of your GCash QR code"
                      file={gcashQR}
                      error={errors.gcashQR}
                    />
                  </div>
                </div>

                {sellerType === 'business' && (
                  <>
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-8"></div>
                    
                    {/* Business Information Section */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-green-600" />
                        Business Information
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="businessName" className="text-sm font-semibold text-gray-700">
                            Business Name <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="businessName"
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            className={`mt-1 ${errors.businessName ? 'border-red-500' : ''}`}
                            placeholder="Enter your business name"
                          />
                          {errors.businessName && (
                            <p className="mt-1 text-sm text-red-500">{errors.businessName}</p>
                          )}
                        </div>

                        <div className="space-y-4">
                          <Label className="text-sm font-semibold text-gray-700">
                            Business Address <span className="text-red-500">*</span>
                          </Label>
                          <div>
                            <Input
                              value={businessAddress.street}
                              onChange={(e) => setBusinessAddress(prev => ({ ...prev, street: e.target.value }))}
                              className={`mt-1 ${errors.businessAddressStreet ? 'border-red-500' : ''}`}
                              placeholder="Street address"
                            />
                            {errors.businessAddressStreet && (
                              <p className="mt-1 text-sm text-red-500">{errors.businessAddressStreet}</p>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <Input
                                value={businessAddress.city}
                                onChange={(e) => setBusinessAddress(prev => ({ ...prev, city: e.target.value }))}
                                className={`mt-1 ${errors.businessAddressCity ? 'border-red-500' : ''}`}
                                placeholder="City"
                              />
                              {errors.businessAddressCity && (
                                <p className="mt-1 text-sm text-red-500">{errors.businessAddressCity}</p>
                              )}
                            </div>
                            <div>
                              <Input
                                value={businessAddress.province}
                                onChange={(e) => setBusinessAddress(prev => ({ ...prev, province: e.target.value }))}
                                className={`mt-1 ${errors.businessAddressProvince ? 'border-red-500' : ''}`}
                                placeholder="Province"
                              />
                              {errors.businessAddressProvince && (
                                <p className="mt-1 text-sm text-red-500">{errors.businessAddressProvince}</p>
                              )}
                            </div>
                          </div>
                          <div>
                            <Input
                              value={businessAddress.zipCode}
                              onChange={(e) => setBusinessAddress(prev => ({ ...prev, zipCode: e.target.value }))}
                              className={`mt-1 ${errors.businessAddressZipCode ? 'border-red-500' : ''}`}
                              placeholder="ZIP Code"
                            />
                            {errors.businessAddressZipCode && (
                              <p className="mt-1 text-sm text-red-500">{errors.businessAddressZipCode}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-8"></div>
                    
                    {/* Business Documents Section */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-green-600" />
                        Business Documents
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FileUploadField
                          id="businessPermit"
                          label="Business Permit"
                          icon={FileText}
                          onChange={e => handleFileChange(e, setBusinessPermit, 'businessPermit')}
                          required
                          file={businessPermit}
                          error={errors.businessPermit}
                        />
                        
                        <FileUploadField
                          id="birRegistration"
                          label="BIR Registration"
                          icon={FileText}
                          onChange={e => handleFileChange(e, setBirRegistration, 'birRegistration')}
                          required
                          file={birRegistration}
                          error={errors.birRegistration}
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="pt-6">
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-6 text-lg font-semibold rounded-xl shadow-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none" 
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        Submitting Application...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Upload className="h-5 w-5" />
                        Submit Application
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default SellerApplicationForm;