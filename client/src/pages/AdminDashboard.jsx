import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  ShoppingBag, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';
import Navbar, { AdminNavbar } from '@/components/Navbar';

const AdminDashboard = () => {
  const [sellerApplications, setSellerApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSellers: 0,
    pendingApplications: 0,
    verifiedSellers: 0
  });

  useEffect(() => {
    fetchSellerApplications();
    fetchStats();
  }, []);

  const fetchSellerApplications = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/admin/seller/applications`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      setSellerApplications(response.data.applications || []);
    } catch (error) {
      console.error('Error fetching seller applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
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
      fetchStats();
    } catch (error) {
      console.error('Error reviewing application:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar/>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 mt-7">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your marketplace operations</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <ShoppingBag className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Sellers</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalSellers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Applications</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingApplications}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Verified Sellers</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.verifiedSellers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="seller-verification">Seller Verification</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Welcome to Green Marketplace Admin</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Manage your marketplace operations, review seller applications, and monitor platform activity.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">Quick Actions</h3>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Review pending seller applications</li>
                      <li>• Monitor platform statistics</li>
                      <li>• Manage user accounts</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h3 className="font-semibold text-green-900 mb-2">Recent Activity</h3>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• {stats.pendingApplications} applications pending review</li>
                      <li>• {stats.verifiedSellers} verified sellers active</li>
                      <li>• {stats.totalUsers} total registered users</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seller-verification" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Seller Verification Applications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading applications...</p>
                  </div>
                ) : sellerApplications.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No seller applications found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sellerApplications.map((application) => (
                      <div key={application._id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {application.user?.firstName} {application.user?.lastName}
                            </h3>
                            <p className="text-gray-600">{application.user?.email}</p>
                            <p className="text-sm text-gray-500">
                              Seller Type: {application.sellerType}
                            </p>
                            {application.user?.contactNumber && (
                              <p className="text-sm text-gray-500">
                                Phone: {application.user.contactNumber}
                              </p>
                            )}
                            {application.user?.location && (
                              <p className="text-sm text-gray-500">
                                Address: {[
                                  application.user.location.address,
                                  application.user.location.city,
                                  application.user.location.province,
                                  application.user.location.zipCode
                                ].filter(Boolean).join(', ')}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(application.status)}
                            {getStatusBadge(application.status)}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <h4 className="font-medium text-sm text-gray-700 mb-2">Documents Submitted:</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                              <li>• Government IDs: {application.documents?.govIDs?.length || 0} files</li>
                              {application.documents?.govIDs?.map((url, index) => (
                                <li key={index} className="ml-4">
                                  <a 
                                    href={url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 underline"
                                  >
                                    Government ID {index + 1}
                                  </a>
                                </li>
                              ))}
                              <li>• Proof of Address: {application.documents?.proofOfAddress ? (
                                <a 
                                  href={application.documents.proofOfAddress} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline"
                                >
                                  View Document
                                </a>
                              ) : '✗'}</li>
                              <li>• Bank Proof: {application.documents?.bankProof ? (
                                <a 
                                  href={application.documents.bankProof} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline"
                                >
                                  View Document
                                </a>
                              ) : '✗'}</li>
                              {application.sellerType === 'business' && (
                                <>
                                  <li>• DTI Registration: {application.documents?.dtiRegistration ? (
                                    <a 
                                      href={application.documents.dtiRegistration} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 underline"
                                    >
                                      View Document
                                    </a>
                                  ) : '✗'}</li>
                                  <li>• Business Permit: {application.documents?.businessPermit ? (
                                    <a 
                                      href={application.documents.businessPermit} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 underline"
                                    >
                                      View Document
                                    </a>
                                  ) : '✗'}</li>
                                  <li>• BIR Registration: {application.documents?.birRegistration ? (
                                    <a 
                                      href={application.documents.birRegistration} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 underline"
                                    >
                                      View Document
                                    </a>
                                  ) : '✗'}</li>
                                </>
                              )}
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium text-sm text-gray-700 mb-2">Application Details:</h4>
                            <p className="text-sm text-gray-600">
                              <strong>Submitted:</strong> {new Date(application.createdAt).toLocaleDateString()}
                            </p>
                            {application.reviewedAt && (
                              <p className="text-sm text-gray-600">
                                <strong>Reviewed:</strong> {new Date(application.reviewedAt).toLocaleDateString()}
                              </p>
                            )}
                            {application.message && (
                              <p className="text-sm text-gray-600 mt-2">
                                <strong>Message:</strong> {application.message}
                              </p>
                            )}
                          </div>
                        </div>

                        {application.status === 'pending' && (
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => handleReviewApplication(application._id, 'approved')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              onClick={() => {
                                const message = prompt('Enter rejection reason (optional):');
                                handleReviewApplication(application._id, 'rejected', message);
                              }}
                              variant="destructive"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard; 