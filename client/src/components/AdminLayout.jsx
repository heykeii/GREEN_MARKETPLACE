import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';

const AdminLayout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div className={`transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
