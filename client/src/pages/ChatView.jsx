import React, { useEffect, useMemo, useRef, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useParams, useNavigate } from 'react-router-dom';
import { joinConversation, onMessage, emitTyping } from '@/lib/socket';

const ChatView = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const listRef = useRef(null);
  const seenIdsRef = useRef(new Set());
  const token = localStorage.getItem('token') || localStorage.getItem('admin_token');

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/chat/messages/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const msgs = data.messages || [];
        // seed dedupe set
        const setIds = new Set();
        msgs.forEach(m => m && m._id && setIds.add(m._id));
        seenIdsRef.current = setIds;
        setMessages(msgs);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    joinConversation(conversationId);
    const handler = (payload) => {
      if (payload?.message?.conversation === conversationId) {
        const id = payload.message?._id;
        if (id && seenIdsRef.current.has(id)) return;
        if (id) seenIdsRef.current.add(id);
        setMessages(prev => [...prev, payload.message]);
        setTimeout(() => listRef.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth' }), 0);
      }
    };
    onMessage(handler);
    // mark conversation as read when opening
    const token = localStorage.getItem('token') || localStorage.getItem('admin_token');
    fetch(`${import.meta.env.VITE_API_URL}/api/v1/chat/conversations/${conversationId}/mark-read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    }).catch(()=>{});
  }, [conversationId]);

  const me = useMemo(() => JSON.parse(localStorage.getItem('user') || 'null'), []);

  const sendMessage = async (e) => {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;

    const body = { conversationId, content };
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/chat/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      // Do not append here to avoid duplicate with socket echo
      setText('');
      emitTyping(conversationId, false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-24 px-4 bg-gradient-to-br from-emerald-50 via-emerald-100 to-teal-50">
        <div className="max-w-3xl mx-auto bg-white/90 backdrop-blur rounded-xl shadow-md overflow-hidden border border-emerald-100">
          {/* Header */}
          <div className="px-4 py-3 border-b bg-gradient-to-r from-white to-emerald-50">
            <h2 className="text-sm font-semibold text-emerald-700">Conversation</h2>
          </div>
          <div className="h-[70vh] flex flex-col">
            <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="text-center text-gray-500">Loading...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500">Say hello 👋</div>
              ) : (
                messages.map((m) => {
                  const isMe = m.sender?._id === me?._id;
                  const avatar = m.sender?.avatar || '/default-avatar.png';
                  const displayName = `${m.sender?.firstName || ''} ${m.sender?.lastName || ''}`.trim();
                  return (
                    <div key={m._id} className={`flex items-end ${isMe ? 'justify-end' : 'justify-start'}`}>
                      {!isMe && (
                        <button onClick={()=>navigate(`/profile/${m.sender?._id}`)} title={displayName} className="mr-2">
                          <img src={avatar} alt="avatar" onError={(e)=>{ e.currentTarget.src='/default-avatar.png'; }} className="w-8 h-8 rounded-full border" />
                        </button>
                      )}
                      <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}> 
                        <div className={`text-[11px] mb-1 ${isMe ? 'text-emerald-700' : 'text-gray-500'}`}>{displayName || (isMe ? 'You' : 'User')}</div>
                        <div className={`w-full px-3 py-2 rounded-2xl shadow-sm ${isMe ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                          <div className="whitespace-pre-wrap break-words leading-relaxed">{m.content}</div>
                          <div className={`text-[10px] mt-1 ${isMe ? 'text-emerald-100' : 'text-gray-500'}`}>{new Date(m.createdAt).toLocaleTimeString()}</div>
                        </div>
                      </div>
                      {isMe && (
                        <button onClick={()=>navigate(`/profile/${m.sender?._id}`)} title={displayName} className="ml-2">
                          <img src={avatar} alt="avatar" onError={(e)=>{ e.currentTarget.src='/default-avatar.png'; }} className="w-8 h-8 rounded-full border" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            <form onSubmit={sendMessage} className="border-t bg-white/70 backdrop-blur px-3 py-3 flex items-center gap-2">
              <input
                value={text}
                onChange={(e)=>{ setText(e.target.value); emitTyping(conversationId, true); }}
                onBlur={()=>emitTyping(conversationId, false)}
                className="flex-1 border border-emerald-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 rounded-full px-4 py-2 outline-none shadow-sm"
                placeholder="Type a message"
              />
              <Button type="submit" className="rounded-full px-5">Send</Button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ChatView;


