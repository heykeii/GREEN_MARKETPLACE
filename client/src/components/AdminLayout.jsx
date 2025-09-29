import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

const AdminLayout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden transition-opacity ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebars */}
      <AdminSidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <AdminSidebar isMobile mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} collapsed={false} setCollapsed={() => {}} />

      <div className={`transition-all duration-300 ${
        sidebarCollapsed ? 'ml-0 md:ml-16' : 'ml-0 md:ml-64'
      }`}>
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)} className="rounded-lg">
              <Menu className="h-5 w-5" />
            </Button>
            <div className="text-sm font-semibold text-gray-800">Admin Panel</div>
            <div className="w-10" />
          </div>
        </div>

        <main className="p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
