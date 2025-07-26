import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Search, 
  Eye,
  Calendar,
  Clock,
  Mail,
  User,
  Trash2,
  Download,
  UserCheck,
  Shield,
  Star,
  TrendingUp,
  Activity
} from 'lucide-react';
import axios from 'axios';
import { AdminNavbar } from '@/components/Navbar';
import { toast } from 'react-toastify';

const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchQuery]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/admin/get-all-users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        params: {
          page: currentPage,
          limit: 10,
          search: searchQuery || undefined
        }
      });
      
      setUsers(response.data.users);
      setTotalPages(response.data.pagination.totalPages);
      setTotalUsers(response.data.pagination.totalItems);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewProfile = (userId) => {
    // Navigate to user profile page or open modal
    window.open(`/profile/${userId}`, '_blank');
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (!window.confirm(`Are you sure you want to permanently delete the account for ${userEmail}? This action cannot be undone.`)) {
      return;
    }
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/v1/admin/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const getStatusColor = (user) => {
    if (user.role === 'admin') return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/25';
    if (user.isSeller && user.sellerStatus === 'verified') return 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25';
    if (user.isSeller && user.sellerStatus === 'pending') return 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/25';
    return 'bg-gradient-to-r from-slate-500 to-slate-600 text-white shadow-lg shadow-slate-500/25';
  };
  const getStatusIcon = (user) => {
    if (user.role === 'admin') return <Shield className="h-3 w-3" />;
    if (user.isSeller && user.sellerStatus === 'verified') return <UserCheck className="h-3 w-3" />;
    if (user.isSeller && user.sellerStatus === 'pending') return <Clock className="h-3 w-3" />;
    return <User className="h-3 w-3" />;
  };

  const getStatusText = (user) => {
    if (user.role === 'admin') return 'Admin';
    if (user.isSeller && user.sellerStatus === 'verified') return 'Verified Seller';
    if (user.isSeller && user.sellerStatus === 'pending') return 'Pending Seller';
    return 'User';
  };

  const verifiedSellers = users.filter(u => u.isSeller && u.sellerStatus === 'verified').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* <AdminNavbar/> */}
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-emerald-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8 pt-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-xl shadow-blue-500/25">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  User Management
                </h1>
                <p className="text-slate-600 text-lg mt-1">Manage and monitor all registered users in the marketplace</p>
              </div>
            </div>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl shadow-blue-500/25 px-6 py-3 rounded-xl">
              <Download className="h-4 w-4 mr-2" />
              Export Users
            </Button>
          </div>
        </div>
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/70 backdrop-blur-xl border-0 shadow-xl shadow-blue-500/10 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Total Users</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{totalUsers}</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/25">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/70 backdrop-blur-xl border-0 shadow-xl shadow-emerald-500/10 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-500 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Active Users</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">{Math.floor(totalUsers * 0.85)}</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl shadow-lg shadow-emerald-500/25">
                  <Activity className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/70 backdrop-blur-xl border-0 shadow-xl shadow-amber-500/10 hover:shadow-2xl hover:shadow-amber-500/20 transition-all duration-500 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Verified Sellers</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent">{verifiedSellers}</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl shadow-lg shadow-amber-500/25">
                  <Star className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/70 backdrop-blur-xl border-0 shadow-xl shadow-purple-500/10 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Growth Rate</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">+12%</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/25">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Enhanced Search and Filters */}
        <Card className="mb-8 bg-white/70 backdrop-blur-xl border-0 shadow-xl shadow-slate-500/10">
          <CardContent className="p-8">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-1 relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5 group-focus-within:text-blue-500 transition-colors" />
                <Input
                  type="text"
                  placeholder="Search by name, email, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-3 bg-slate-50/50 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 placeholder:text-slate-400"
                />
              </div>
              <Button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 px-8 py-3 rounded-xl">
                Search
              </Button>
            </form>
          </CardContent>
        </Card>
        {/* Enhanced Users Table */}
        <Card className="bg-white/70 backdrop-blur-xl border-0 shadow-xl shadow-slate-500/10">
          <CardHeader className="px-8 py-6 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-semibold text-slate-800">All Users</CardTitle>
              <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
                <span>Page {currentPage} of {totalPages}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="relative">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200"></div>
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent absolute top-0"></div>
                </div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-16">
                <div className="p-4 bg-slate-100 rounded-2xl w-fit mx-auto mb-4">
                  <Users className="h-12 w-12 text-slate-400" />
                </div>
                <p className="text-slate-500 text-lg">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl">
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="text-left py-4 px-8 font-semibold text-slate-700">User</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">Contact</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">Status</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">Date Joined</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">Last Activity</th>
                      <th className="text-left py-4 px-8 font-semibold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, index) => (
                      <tr key={user._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-all duration-200 group">
                        <td className="py-6 px-8">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                                {user.avatar ? (
                                  <img 
                                    src={user.avatar} 
                                    alt={`${user.firstName} ${user.lastName}`}
                                    className="w-12 h-12 rounded-xl object-cover"
                                  />
                                ) : (
                                  <User className="h-6 w-6 text-white" />
                                )}
                              </div>
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 text-lg">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-sm text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded mt-1">
                                #{user._id.slice(-8)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-6 px-4">
                          <div className="flex items-center gap-3 text-slate-700">
                            <div className="p-2 bg-slate-100 rounded-lg">
                              <Mail className="h-4 w-4 text-slate-500" />
                            </div>
                            <span className="font-medium">{user.email}</span>
                          </div>
                        </td>
                        <td className="py-6 px-4">
                          <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ${getStatusColor(user)}`}>
                            {getStatusIcon(user)}
                            {getStatusText(user)}
                          </span>
                        </td>
                        <td className="py-6 px-4">
                          <div className="flex items-center gap-3 text-slate-600">
                            <div className="p-2 bg-slate-100 rounded-lg">
                              <Calendar className="h-4 w-4 text-slate-500" />
                            </div>
                            <span className="font-medium">{formatDate(user.createdAt)}</span>
                          </div>
                        </td>
                        <td className="py-6 px-4">
                          <div className="flex items-center gap-3 text-slate-600">
                            <div className="p-2 bg-slate-100 rounded-lg">
                              <Clock className="h-4 w-4 text-slate-500" />
                            </div>
                            <span className="font-medium">{formatDate(user.lastLogin)}</span>
                          </div>
                        </td>
                        <td className="py-6 px-8">
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleViewProfile(user._id)}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2 border-slate-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                            <Button
                              onClick={() => handleDeleteUser(user._id, user.email)}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2 border-red-200 hover:bg-red-50 hover:border-red-300 hover:text-red-700 text-red-600 transition-all duration-200"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {/* Enhanced Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-8 border-t border-slate-100 bg-slate-50/30">
                <p className="text-sm text-slate-600 font-medium">
                  Showing page {currentPage} of {totalPages} • {totalUsers} total users
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                    className="px-6 py-2 rounded-xl border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminUserManagement; 