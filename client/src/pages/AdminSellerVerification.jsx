import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/utils/toast';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, FileText, Clock, Users, Mail, User, Star, Filter, Search, ExternalLink, Eye, ChevronDown, ChevronUp, Smartphone, QrCode } from 'lucide-react';
// Using consistent default avatar from public folder
import AdminLayout from '@/components/AdminLayout';

const AdminSellerVerification = () => {
  const [sellerApplications, setSellerApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedApplications, setExpandedApplications] = useState(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    fetchSellerApplications();
    // eslint-disable-next-line
  }, []);

  const fetchSellerApplications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/admin/seller/applications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSellerApplications(response.data.applications || []);
    } catch (error) {
      toast.error('Failed to fetch seller applications.');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewApplication = async (applicationId, action, message = '') => {
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/v1/seller/verify/${applicationId}/review`, 
        { action, message },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
          }
        }
      );
      fetchSellerApplications();
      toast.success(`Application ${action} successfully!`);
    } catch (error) {
      toast.error('Error reviewing application.');
    }
  };

  const toggleApplicationExpand = (applicationId) => {
    const newExpanded = new Set(expandedApplications);
    if (newExpanded.has(applicationId)) {
      newExpanded.delete(applicationId);
    } else {
      newExpanded.add(applicationId);
    }
    setExpandedApplications(newExpanded);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-amber-100 text-amber-800 border-0 px-3 py-1 font-medium">
            <Clock className="h-3 w-3 mr-1" />
            Pending Review
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-0 px-3 py-1 font-medium">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 border-0 px-3 py-1 font-medium">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="px-3 py-1 font-medium">
            Unknown
          </Badge>
        );
    }
  };

  const getApplicationStats = () => {
    const pending = sellerApplications.filter(app => app.status === 'pending').length;
    const approved = sellerApplications.filter(app => app.status === 'approved').length;
    const rejected = sellerApplications.filter(app => app.status === 'rejected').length;
    return { pending, approved, rejected, total: sellerApplications.length };
  };

  const filteredApplications = sellerApplications.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  const stats = getApplicationStats();

  const DocumentSection = ({ application }) => {
    const isExpanded = expandedApplications.has(application._id);

    return (
      <div className="mt-6 border-t border-gray-100 pt-6">
        <button
          onClick={() => toggleApplicationExpand(application._id)}
          className="flex items-center gap-2 text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors duration-200 mb-4"
        >
          <FileText className="h-5 w-5" />
          Documents & Details
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {isExpanded && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Documents Section */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Submitted Documents
              </h4>
              <div className="space-y-4">
                {/* Government IDs */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Government IDs:</p>
                  {application.documents?.govIDs?.length > 0 ? (
                    <div className="space-y-2">
                      {application.documents.govIDs.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm bg-white rounded-lg px-3 py-2 border border-blue-100 hover:border-blue-200 transition-all duration-200"
                        >
                          <Eye className="h-4 w-4" />
                          Government ID {index + 1}
                          <ExternalLink className="h-3 w-3 ml-auto" />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">Not submitted</p>
                  )}
                </div>

                {/* Proof of Address */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Proof of Address:</p>
                  {application.documents?.proofOfAddress ? (
                    <a
                      href={application.documents.proofOfAddress}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm bg-white rounded-lg px-3 py-2 border border-blue-100 hover:border-blue-200 transition-all duration-200"
                    >
                      <Eye className="h-4 w-4" />
                      View Document
                      <ExternalLink className="h-3 w-3 ml-auto" />
                    </a>
                  ) : (
                    <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">Not submitted</p>
                  )}
                </div>

                {/* Bank Proof */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Bank Proof:</p>
                  {application.documents?.bankProof ? (
                    <a
                      href={application.documents.bankProof}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm bg-white rounded-lg px-3 py-2 border border-blue-100 hover:border-blue-200 transition-all duration-200"
                    >
                      <Eye className="h-4 w-4" />
                      View Document
                      <ExternalLink className="h-3 w-3 ml-auto" />
                    </a>
                  ) : (
                    <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">Not submitted</p>
                  )}
                </div>

                {/* GCash Information */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-green-600" />
                    GCash Number:
                  </p>
                  {application.gcash?.number ? (
                    <p className="text-sm text-gray-900 bg-white rounded-lg px-3 py-2 border border-gray-200">
                      {application.gcash.number}
                    </p>
                  ) : (
                    <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">Not provided</p>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-green-600" />
                    GCash QR Code:
                  </p>
                  {application.gcash?.qrCode ? (
                    <a
                      href={application.gcash.qrCode}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm bg-white rounded-lg px-3 py-2 border border-blue-100 hover:border-blue-200 transition-all duration-200"
                    >
                      <Eye className="h-4 w-4" />
                      View QR Code
                      <ExternalLink className="h-3 w-3 ml-auto" />
                    </a>
                  ) : (
                    <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">Not submitted</p>
                  )}
                </div>


                {/* Business Documents (only for business type) */}
                {application.sellerType === 'business' && (
                  <>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Business Permit:</p>
                      {application.documents?.businessPermit ? (
                        <a
                          href={application.documents.businessPermit}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm bg-white rounded-lg px-3 py-2 border border-blue-100 hover:border-blue-200 transition-all duration-200"
                        >
                          <Eye className="h-4 w-4" />
                          View Document
                          <ExternalLink className="h-3 w-3 ml-auto" />
                        </a>
                      ) : (
                        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">Not submitted</p>
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">BIR Registration:</p>
                      {application.documents?.birRegistration ? (
                        <a
                          href={application.documents.birRegistration}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm bg-white rounded-lg px-3 py-2 border border-blue-100 hover:border-blue-200 transition-all duration-200"
                        >
                          <Eye className="h-4 w-4" />
                          View Document
                          <ExternalLink className="h-3 w-3 ml-auto" />
                        </a>
                      ) : (
                        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">Not submitted</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Application Details Section */}
            <div className="bg-blue-50 rounded-xl p-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Application Details
              </h4>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Submitted Date:</p>
                  <p className="text-sm text-gray-900 bg-white rounded-lg px-3 py-2 mt-1">
                    {new Date(application.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                {application.reviewedAt && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Reviewed Date:</p>
                    <p className="text-sm text-gray-900 bg-white rounded-lg px-3 py-2 mt-1">
                      {new Date(application.reviewedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}

                {application.sellerType === 'business' && application.businessInfo?.businessName && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Business Name:</p>
                    <p className="text-sm text-gray-900 bg-white rounded-lg px-3 py-2 mt-1">
                      {application.businessInfo.businessName}
                    </p>
                  </div>
                )}

                {application.sellerType === 'business' && application.businessInfo?.businessAddress && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Business Address:</p>
                    <p className="text-sm text-gray-900 bg-white rounded-lg px-3 py-2 mt-1">
                      {[
                        application.businessInfo.businessAddress.street,
                        application.businessInfo.businessAddress.city,
                        application.businessInfo.businessAddress.province,
                        application.businessInfo.businessAddress.zipCode
                      ].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}

                {application.user?.contactNumber && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Contact Number:</p>
                    <p className="text-sm text-gray-900 bg-white rounded-lg px-3 py-2 mt-1">
                      {application.user.contactNumber}
                    </p>
                  </div>
                )}

                {application.gcash?.number && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-green-600" />
                      GCash Number:
                    </p>
                    <p className="text-sm text-gray-900 bg-white rounded-lg px-3 py-2 mt-1">
                      {application.gcash.number}
                    </p>
                  </div>
                )}

                {application.user?.location && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Address:</p>
                    <p className="text-sm text-gray-900 bg-white rounded-lg px-3 py-2 mt-1">
                      {[
                        application.user.location.address,
                        application.user.location.city,
                        application.user.location.province,
                        application.user.location.zipCode
                      ].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}

                {application.message && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Review Message:</p>
                    <p className="text-sm text-gray-900 bg-white rounded-lg px-3 py-2 mt-1">
                      {application.message}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
                Seller Verification
              </h1>
              <p className="text-sm sm:text-lg text-gray-600">
                Review and manage seller applications
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search applications..."
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 w-full sm:w-64"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Applications</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <Users className="h-10 w-10 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-r from-amber-500 to-amber-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm font-medium">Pending Review</p>
                  <p className="text-3xl font-bold">{stats.pending}</p>
                </div>
                <Clock className="h-10 w-10 text-amber-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">Approved</p>
                  <p className="text-3xl font-bold">{stats.approved}</p>
                </div>
                <CheckCircle className="h-10 w-10 text-emerald-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-r from-red-500 to-red-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Rejected</p>
                  <p className="text-3xl font-bold">{stats.rejected}</p>
                </div>
                <XCircle className="h-10 w-10 text-red-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100 w-fit">
            {[
              { key: 'all', label: 'All Applications', count: stats.total },
              { key: 'pending', label: 'Pending', count: stats.pending },
              { key: 'approved', label: 'Approved', count: stats.approved },
              { key: 'rejected', label: 'Rejected', count: stats.rejected }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                  filter === tab.key
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab.label}
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  filter === tab.key
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Applications List */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                </div>
                <p className="text-xl font-medium text-gray-900 mb-2">Loading Applications</p>
                <p className="text-gray-600">Please wait while we fetch the latest data...</p>
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-xl font-medium text-gray-900 mb-2">No Applications Found</p>
                <p className="text-gray-600">
                  {filter === 'all' 
                    ? 'No seller applications have been submitted yet.'
                    : `No ${filter} applications found.`
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredApplications.map((application, index) => (
                  <div 
                    key={application._id} 
                    className={`p-6 hover:bg-gray-50/50 transition-all duration-200 ${
                      index === 0 ? 'rounded-t-xl' : ''
                    } ${
                      index === filteredApplications.length - 1 ? 'rounded-b-xl' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      {/* Left: User Info */}
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img
                            src={application.user?.avatar || '/default-avatar.svg'}
                            alt="avatar"
                            className="w-16 h-16 rounded-2xl object-cover border-2 border-gray-100 cursor-pointer hover:border-blue-300 transition-all duration-200 hover:shadow-lg"
                            onClick={() => navigate(`/profile/${application.user?._id}`)}
                            onError={e => { e.target.onerror = null; e.target.src = '/default-avatar.svg'; }}
                            title="View Profile"
                          />
                          {application.status === 'approved' && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                              <CheckCircle className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <h3 
                            className="text-xl font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors duration-200 flex items-center gap-2" 
                            onClick={() => navigate(`/profile/${application.user?._id}`)}
                          >
                            {application.user?.firstName} {application.user?.lastName}
                          </h3>
                          
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="h-4 w-4" />
                            <span className="text-sm">{application.user?.email}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-gray-600">
                              <Star className="h-4 w-4" />
                              <span className="text-sm font-medium">Seller Type:</span>
                            </div>
                            <Badge variant="outline" className="text-xs font-medium">
                              {application.sellerType}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Right: Status and Actions */}
                      <div className="flex flex-col items-end gap-4">
                        {getStatusBadge(application.status)}
                        {application.status === 'pending' && (
                          <div className="flex gap-3">
                            <Button
                              onClick={() => handleReviewApplication(application._id, 'approved')}
                              disabled={application.status === 'approved'}
                              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              onClick={() => {
                                const message = prompt('Enter rejection reason (optional):');
                                handleReviewApplication(application._id, 'rejected', message || '');
                              }}
                              disabled={application.status === 'rejected'}
                              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Documents Section */}
                    <DocumentSection application={application} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSellerVerification;