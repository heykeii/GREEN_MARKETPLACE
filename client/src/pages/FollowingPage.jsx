import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import noProfile from '@/assets/no_profile.jpg';

const FollowingPage = () => {
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const me = JSON.parse(localStorage.getItem('user') || 'null');
        const token = localStorage.getItem('token') || localStorage.getItem('admin_token');
        if (!me || !token) { setFollowing([]); return; }
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/users/${me._id || me.id}/following`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFollowing(res.data.following || []);
      } catch(e) {
        setFollowing([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-24 px-4 bg-gradient-to-br from-emerald-50 via-emerald-100 to-teal-50">
        <div className="max-w-3xl mx-auto bg-white/90 backdrop-blur rounded-xl shadow-md overflow-hidden border border-emerald-100 p-6">
          <h1 className="text-xl font-bold text-emerald-800 mb-4">You're Following</h1>
          {loading ? (
            <div className="text-green-700">Loading...</div>
          ) : following.length === 0 ? (
            <div className="text-green-700">You're not following anyone yet.</div>
          ) : (
            <div className="divide-y">
              {following.map((u, idx) => (
                <div key={u._id} className="flex items-center justify-between py-3 hover:bg-emerald-50 px-2 rounded">
                  <a href={`/profile/${u._id}`} className="flex items-center gap-3">
                    <img src={u.avatar || noProfile} onError={(e)=>{e.currentTarget.src=noProfile}} className="w-10 h-10 rounded-full border" />
                    <div className="text-emerald-800 font-medium truncate">{`${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email}</div>
                  </a>
                  <button
                    className="text-sm px-3 py-1 rounded border text-gray-600 border-gray-300 hover:bg-gray-100"
                    onClick={async ()=>{
                      const token = localStorage.getItem('token') || localStorage.getItem('admin_token');
                      if (!token) return;
                      try {
                        await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/users/unfollow`, { targetUserId: u._id }, { headers: { Authorization: `Bearer ${token}` } });
                        setFollowing(prev => prev.filter((_, i) => i !== idx));
                      } catch(_) {}
                    }}
                  >
                    Unfollow
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default FollowingPage;


