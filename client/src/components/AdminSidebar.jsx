import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard,
  Users,
  ShoppingBag,
  CheckCircle,
  AlertTriangle,
  Package,
  UserCheck,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Megaphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAdminCounts } from '@/hooks/useAdminCounts';

const AdminSidebar = ({ collapsed, setCollapsed, isMobile = false, mobileOpen = false, onMobileClose = () => {} }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { counts } = useAdminCounts();

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      path: '/admin',
      color: 'text-blue-500',
      count: null
    },
    {
      icon: Users,
      label: 'User Management',
      path: '/admin/user-management',
      color: 'text-purple-500',
      count: null
    },
    {
      icon: UserCheck,
      label: 'Seller Verification',
      path: '/admin/seller-verification',
      color: 'text-emerald-500',
      count: counts.sellerVerification
    },
    {
      icon: Package,
      label: 'Product Verification',
      path: '/admin/product-verification',
      color: 'text-orange-500',
      count: counts.productVerification
    },
    {
      icon: FileText,
      label: 'Campaign Management',
      path: '/admin/campaign-management',
      color: 'text-pink-500',
      count: null
    },
    {
      icon: Megaphone,
      label: 'Announcements',
      path: '/admin/announcements',
      color: 'text-indigo-500',
      count: null
    },
    {
      icon: MessageSquare,
      label: 'Feedback',
      path: '/admin/feedback',
      color: 'text-emerald-500',
      count: counts.feedback
    },
    {
      icon: ShoppingBag,
      label: 'Order Records',
      path: '/admin/order-records',
      color: 'text-purple-500'
    },
    {
      icon: FileText,
      label: 'Sustainability',
      path: '/admin/sustainability',
      color: 'text-teal-500',
      count: null
    },
    {
      icon: AlertTriangle,
      label: 'Reports',
      path: '/admin/report-management',
      color: 'text-red-500',
      count: counts.reports
    }
  ];

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  };

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className={cn(
      "fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-lg transition-all duration-300 z-40",
      collapsed ? "w-16" : "w-64",
      isMobile ? 
        cn(
          "block md:hidden transform will-change-transform",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )
        : "hidden md:block"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-900">GREEN</h1>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>
        )}
        {isMobile ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMobileClose}
            className="p-1.5 hover:bg-gray-100 md:hidden"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 hover:bg-gray-100"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
              isActive(item.path)
                ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 border border-blue-100"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <div className="relative">
              <item.icon className={cn(
                "h-5 w-5 transition-colors",
                isActive(item.path) ? "text-blue-600" : item.color
              )} />
              {/* Notification Badge */}
              {item.count > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg">
                  {item.count > 99 ? '99+' : item.count}
                </div>
              )}
            </div>
            {!collapsed && (
              <span className="font-medium text-sm">{item.label}</span>
            )}
            {isActive(item.path) && !collapsed && (
              <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full"></div>
            )}
          </Link>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start px-3 py-2.5 text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="ml-3 font-medium text-sm">Logout</span>}
        </Button>
      </div>
    </div>
  );
};

export default AdminSidebar;
