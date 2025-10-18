import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, MessageCircle, Clock, Check, CheckCheck, Search, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Avatar from '@/components/Avatar';

const Messages = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

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

  const me = JSON.parse(localStorage.getItem('user') || 'null');

  const filteredConversations = conversations.filter(conv => {
    const other = (conv.participants || []).find(p => p._id !== me?._id) || {};
    const fullName = `${other.firstName} ${other.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  const formatTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const msgDate = new Date(date);
    const diffMs = now - msgDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return msgDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-20 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <div className="max-w-5xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-green-600 flex items-center justify-center shadow-lg">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
                <p className="text-gray-600 text-sm mt-1">
                  {conversations.length} {conversations.length === 1 ? 'conversation' : 'conversations'}
                </p>
              </div>
            </div>

            {/* Search Bar */}
            {conversations.length > 0 && (
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none transition-colors bg-white shadow-sm"
                />
              </div>
            )}
          </div>

          {/* Messages List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 font-medium">Loading conversations...</p>
            </div>
          ) : conversations.length === 0 ? (
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
              <CardContent className="p-16 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mx-auto mb-6">
                  <Mail className="w-10 h-10 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No conversations yet</h3>
                <p className="text-gray-600 mb-6">Start a conversation by messaging someone!</p>
                <Button 
                  onClick={() => navigate('/')}
                  className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg"
                >
                  Explore Profiles
                </Button>
              </CardContent>
            </Card>
          ) : filteredConversations.length === 0 ? (
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <p className="text-gray-600">No conversations match your search.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredConversations.map(conv => {
                const other = (conv.participants || []).find(p => p._id !== me?._id) || {};
                const isUnread = conv.lastMessage && !conv.lastMessage.isRead && conv.lastMessage.sender?._id !== me?._id;
                const isSentByMe = conv.lastMessage?.sender?._id === me?._id;
                
                return (
                  <Card 
                    key={conv._id} 
                    className={`group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-white cursor-pointer ${
                      isUnread ? 'ring-2 ring-emerald-500' : ''
                    }`}
                    onClick={() => navigate(`/messages/${conv._id}`)}
                  >
                    <CardContent className="p-0">
                      <div className="flex items-center gap-4 p-4">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          <div className={`absolute -inset-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full blur opacity-0 group-hover:opacity-75 transition duration-300 ${
                            isUnread ? 'opacity-75' : ''
                          }`}></div>
                          <Avatar 
                            src={other.avatar} 
                            alt="avatar" 
                            className="relative w-14 h-14 rounded-full ring-4 ring-white object-cover"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/profile/${other._id}`);
                            }}
                          />
                          {isUnread && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
                          )}
                        </div>

                        {/* Message Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className={`font-semibold text-gray-900 truncate ${
                              isUnread ? 'text-emerald-900' : ''
                            }`}>
                              {other.firstName} {other.lastName}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              <span>{formatTime(conv.lastMessage?.createdAt)}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {isSentByMe && (
                              <div className="flex-shrink-0">
                                {conv.lastMessage?.isRead ? (
                                  <CheckCheck className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <Check className="w-4 h-4 text-gray-400" />
                                )}
                              </div>
                            )}
                            <p className={`text-sm truncate ${
                              isUnread ? 'text-gray-900 font-medium' : 'text-gray-600'
                            }`}>
                              {conv.lastMessage?.content || 'No messages yet'}
                            </p>
                          </div>

                          {isUnread && (
                            <div className="mt-2">
                              <span className="inline-block px-2 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full">
                                New message
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteConversation(conv._id);
                            }}
                            className="hover:bg-red-50 hover:text-red-600"
                            title="Delete conversation"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/messages/${conv._id}`);
                            }}
                            className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-md"
                          >
                            Open
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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