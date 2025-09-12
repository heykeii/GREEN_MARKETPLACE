import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import noProfile from '@/assets/no_profile.jpg';

const FollowersPage = () => {
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingSet, setFollowingSet] = useState(new Set());

  useEffect(() => {
    const load = async () => {
      try {
        const me = JSON.parse(localStorage.getItem('user') || 'null');
        const token = localStorage.getItem('token') || localStorage.getItem('admin_token');
        if (!me || !token) { setFollowers([]); return; }
        // Get my following list to determine follow/unfollow states
        try {
          const meRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/users/me`, { headers: { Authorization: `Bearer ${token}` } });
          const ids = new Set((meRes.data?.user?.following || []).map((x)=>String(x)));
          setFollowingSet(ids);
        } catch(_) {}
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/users/${me._id || me.id}/followers`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFollowers(res.data.followers || []);
      } catch(e) {
        setFollowers([]);
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
          <h1 className="text-xl font-bold text-emerald-800 mb-4">Your Followers</h1>
          {loading ? (
            <div className="text-green-700">Loading...</div>
          ) : followers.length === 0 ? (
            <div className="text-green-700">No followers yet.</div>
          ) : (
            <div className="divide-y">
              {followers.map((u, idx) => {
                const isFollowing = followingSet.has(String(u._id));
                return (
                  <div key={u._id} className="flex items-center justify-between py-3 hover:bg-emerald-50 px-2 rounded">
                    <a href={`/profile/${u._id}`} className="flex items-center gap-3">
                      <img src={u.avatar || noProfile} onError={(e)=>{e.currentTarget.src=noProfile}} className="w-10 h-10 rounded-full border" />
                      <div className="text-emerald-800 font-medium truncate">{`${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email}</div>
                    </a>
                    <button
                      className={`text-sm px-3 py-1 rounded border ${isFollowing ? 'text-gray-600 border-gray-300 hover:bg-gray-100' : 'text-emerald-600 border-emerald-300 hover:bg-emerald-50'}`}
                      onClick={async ()=>{
                        const token = localStorage.getItem('token') || localStorage.getItem('admin_token');
                        if (!token) return;
                        try {
                          if (isFollowing) {
                            await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/users/unfollow`, { targetUserId: u._id }, { headers: { Authorization: `Bearer ${token}` } });
                            setFollowingSet(prev => { const n = new Set(prev); n.delete(String(u._id)); return n; });
                          } else {
                            await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/users/follow`, { targetUserId: u._id }, { headers: { Authorization: `Bearer ${token}` } });
                            setFollowingSet(prev => { const n = new Set(prev); n.add(String(u._id)); return n; });
                          }
                        } catch(_) {}
                      }}
                    >
                      {isFollowing ? 'Unfollow' : 'Follow'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default FollowersPage;


