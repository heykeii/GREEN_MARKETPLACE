import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Messages = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);

  const token = localStorage.getItem('token') || localStorage.getItem('admin_token');

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteConversation = async (conversationId) => {
    if (!window.confirm('Delete this conversation? This cannot be undone.')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/chat/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setConversations(prev => prev.filter(c => c._id !== conversationId));
      }
    } catch (e) {
      // no-op
    }
  };

  useEffect(() => { fetchConversations(); }, []);

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-24 px-4 bg-gradient-to-br from-emerald-50 via-emerald-100 to-teal-50">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Messages</h1>
          {loading ? (
            <div>Loading...</div>
          ) : conversations.length === 0 ? (
            <div>No conversations yet.</div>
          ) : (
            <div className="space-y-3">
              {conversations.map(conv => {
                const me = JSON.parse(localStorage.getItem('user') || 'null');
                const other = (conv.participants || []).find(p => p._id !== me?._id) || {};
                return (
                  <div key={conv._id} className="p-3 bg-white rounded shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={other.avatar || '/default-avatar.png'} alt="avatar" className="w-10 h-10 rounded-full border" onError={(e)=>{ e.currentTarget.src='/default-avatar.png';}} />
                      <div>
                        <div className="font-semibold">{other.firstName} {other.lastName}</div>
                        <div className="text-sm text-gray-600 line-clamp-1">{conv.lastMessage?.content || 'No messages yet'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => deleteConversation(conv._id)} title="Delete conversation">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                      <Button size="sm" onClick={()=>navigate(`/messages/${conv._id}`)}>Open</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Messages;


