import React from 'react'
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';

const Sidebar = () => {
  const navigate = useNavigate();
  return (
    <aside className="w-64 bg-white border-r border-green-200 min-h-[60vh] p-6 flex flex-col gap-4 shadow-md">
      <h2 className="text-lg font-bold text-green-700 mb-4">Menu</h2>
      <Button onClick={() => navigate('/seller/application')} className="w-full bg-green-600 hover:bg-green-700 text-white">Seller Application</Button>
      {/* Add more sidebar links here if needed */}
    </aside>
  );
};

const Homepage = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || 'null');
  return (
    <div>
      <Navbar />
      <div className="flex">
        {user && <Sidebar />}
        <div className="flex-1 py-12 flex flex-col items-center justify-center min-h-[60vh]">
          <h1 className='text-4xl font-bold mb-6'>This is a landing page</h1>
          {!user && <Button onClick={() => navigate('/login')}>Sign in</Button>}
        </div>
      </div>
    </div>
  )
}

export default Homepage
