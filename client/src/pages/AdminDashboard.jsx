import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  ShoppingBag, 
  CheckCircle, 
  Clock,
  AlertTriangle,
  TrendingUp,
  Package,
  UserCheck,
  FileText,
  Activity,
  ArrowUpRight,
  BarChart3,
  Calendar,
  Star
} from 'lucide-react';
import axios from 'axios';
import AdminLayout from '@/components/AdminLayout';
import { Link } from 'react-router-dom';
import { toast } from '@/utils/toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSellers: 0,
    pendingApplications: 0,
    verifiedSellers: 0,
    totalReports: 0,
    pendingReports: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

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

  // Mock chart data for demonstration
  const chartData = [
    { month: 'Jan', users: 400, sellers: 240, revenue: 2400 },
    { month: 'Feb', users: 300, sellers: 139, revenue: 2210 },
    { month: 'Mar', users: 500, sellers: 380, revenue: 2290 },
    { month: 'Apr', users: 650, sellers: 308, revenue: 2000 },
    { month: 'May', users: 590, sellers: 480, revenue: 2181 },
    { month: 'Jun', users: 800, sellers: 380, revenue: 2500 }
  ];

  const recentActivities = [
    { user: 'Airi Satou', action: 'Account Verified', time: '2 hours ago', type: 'success' },
    { user: 'Angelica Ramos', action: 'Product Submitted', time: '4 hours ago', type: 'info' },
    { user: 'Ashton Cox', action: 'Report Filed', time: '6 hours ago', type: 'warning' },
    { user: 'Bradley Greer', action: 'New Registration', time: '1 day ago', type: 'info' },
    { user: 'Brenden Wagner', action: 'Payment Processed', time: '2 days ago', type: 'success' }
  ];

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your marketplace today.</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" className="gap-2">
              <Calendar className="h-4 w-4" />
              Today
            </Button>
            <Button 
              className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              onClick={() => {
                toast.success('Modern toast system is working!', { 
                  title: 'Success!',
                  duration: 3000 
                });
              }}
            >
              <BarChart3 className="h-4 w-4" />
              Test Toast
            </Button>
          </div>
        </div>
      </div>

      {/* Primary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold">{stats.totalUsers}</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-4 w-4 text-blue-200" />
                  <span className="text-blue-200 text-sm">+12.5%</span>
                </div>
              </div>
              <div className="p-3 bg-white/20 rounded-2xl">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
            <Link to="/admin/user-management">
              <Button variant="ghost" className="w-full mt-4 text-white hover:bg-white/20">
                View Details
                <ArrowUpRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Pending Reviews</p>
                <p className="text-3xl font-bold">{stats.pendingApplications}</p>
                <div className="flex items-center gap-1 mt-2">
                  <Clock className="h-4 w-4 text-orange-200" />
                  <span className="text-orange-200 text-sm">Urgent</span>
                </div>
              </div>
              <div className="p-3 bg-white/20 rounded-2xl">
                <Clock className="h-8 w-8 text-white" />
              </div>
            </div>
            <Link to="/admin/seller-verification">
              <Button variant="ghost" className="w-full mt-4 text-white hover:bg-white/20">
                View Details
                <ArrowUpRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Verified Sellers</p>
                <p className="text-3xl font-bold">{stats.verifiedSellers}</p>
                <div className="flex items-center gap-1 mt-2">
                  <CheckCircle className="h-4 w-4 text-green-200" />
                  <span className="text-green-200 text-sm">Active</span>
                </div>
              </div>
              <div className="p-3 bg-white/20 rounded-2xl">
                <UserCheck className="h-8 w-8 text-white" />
              </div>
            </div>
            <Link to="/admin/seller-verification">
              <Button variant="ghost" className="w-full mt-4 text-white hover:bg-white/20">
                View Details
                <ArrowUpRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-rose-500 text-white border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Open Reports</p>
                <p className="text-3xl font-bold">{stats.pendingReports}</p>
                <div className="flex items-center gap-1 mt-2">
                  <AlertTriangle className="h-4 w-4 text-red-200" />
                  <span className="text-red-200 text-sm">Needs attention</span>
                </div>
              </div>
              <div className="p-3 bg-white/20 rounded-2xl">
                <AlertTriangle className="h-8 w-8 text-white" />
              </div>
            </div>
            <Link to="/admin/report-management">
              <Button variant="ghost" className="w-full mt-4 text-white hover:bg-white/20">
                View Details
                <ArrowUpRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Bar Chart */}
        <Card className="lg:col-span-2 shadow-xl border-0">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Platform Growth</CardTitle>
                <p className="text-gray-600 text-sm mt-1">Monthly user and seller registration trends</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Users</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <span>Sellers</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Simple Bar Chart Visualization */}
            <div className="space-y-4">
              {chartData.map((item, index) => (
                <div key={item.month} className="flex items-center gap-4">
                  <div className="w-8 text-sm font-medium text-gray-600">{item.month}</div>
                  <div className="flex-1 flex gap-1">
                    <div 
                      className="bg-blue-500 rounded-sm h-6 flex items-center justify-end pr-2 text-white text-xs font-medium"
                      style={{ width: `${(item.users / 800) * 100}%`, minWidth: '40px' }}
                    >
                      {item.users}
                    </div>
                    <div 
                      className="bg-emerald-500 rounded-sm h-6 flex items-center justify-end pr-2 text-white text-xs font-medium"
                      style={{ width: `${(item.sellers / 500) * 100}%`, minWidth: '30px' }}
                    >
                      {item.sellers}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="shadow-xl border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === 'success' ? 'bg-green-500' :
                    activity.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{activity.user}</p>
                    <p className="text-sm text-gray-600">{activity.action}</p>
                    <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Activity
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-xl border-0 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-purple-100 rounded-2xl">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Product Verification</h3>
                <p className="text-sm text-gray-600">Review pending products</p>
              </div>
            </div>
            <Link to="/admin/product-verification">
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                Manage Products
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-xl border-0 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-pink-100 rounded-2xl">
                <FileText className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Campaign Management</h3>
                <p className="text-sm text-gray-600">Oversee marketing campaigns</p>
              </div>
            </div>
            <Link to="/admin/campaign-management">
              <Button className="w-full bg-pink-600 hover:bg-pink-700">
                View Campaigns
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-xl border-0 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-indigo-100 rounded-2xl">
                <Star className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Platform Analytics</h3>
                <p className="text-sm text-gray-600">View detailed insights</p>
              </div>
            </div>
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
              View Analytics
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;