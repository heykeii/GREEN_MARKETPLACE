import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  ShoppingBag, 
  CheckCircle, 
  Clock
} from 'lucide-react';
import axios from 'axios';
import { AdminNavbar } from '@/components/Navbar';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSellers: 0,
    pendingApplications: 0,
    verifiedSellers: 0
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
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

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <Link to="/admin/user-management">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-purple-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">User Management</p>
                    <p className="text-sm font-medium text-purple-600">View All Users</p>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Main Content */}
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
                  <li>• <Link to="/admin/user-management" className="underline">Manage Users</Link></li>
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
      </div>
    </div>
  );
};

export default AdminDashboard; 