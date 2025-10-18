import React, { useEffect, useMemo, useRef, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { joinConversation, onMessage, onMessagesSeen, onMessageSeen, emitTyping, markMessageAsSeen } from '@/lib/socket';
import MessageStatus from '@/components/MessageStatus';
import Avatar from '@/components/Avatar';
import { FaShoppingCart, FaTimes, FaQuestion, FaPaperPlane, FaImage, FaSmile, FaEllipsisV, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';

const ChatView = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [conversation, setConversation] = useState(null);
  const [showProductCard, setShowProductCard] = useState(true);
  const [attachProductNext, setAttachProductNext] = useState(false);
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);
  const listRef = useRef(null);
  const seenIdsRef = useRef(new Set());
  const messageRefs = useRef(new Map());
  const inputRef = useRef(null);
  const token = localStorage.getItem('token') || localStorage.getItem('admin_token');
  const location = useLocation();
  const me = useMemo(() => JSON.parse(localStorage.getItem('user') || 'null'), []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/chat/messages/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const msgs = data.messages || [];
        const setIds = new Set();
        msgs.forEach(m => m && m._id && setIds.add(m._id));
        seenIdsRef.current = setIds;
        setMessages(msgs);
        setConversation(data.conversation);
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
        
        setMessages(prev => {
          const newMessage = payload.message;
          const optimisticIndex = prev.findIndex(msg => 
            msg.isOptimistic && 
            msg.sender?._id === newMessage.sender?._id && 
            msg.content === newMessage.content &&
            Math.abs(new Date(msg.createdAt).getTime() - new Date(newMessage.createdAt).getTime()) < 10000
          );
          
          if (optimisticIndex >= 0) {
            const updated = [...prev];
            seenIdsRef.current.delete(updated[optimisticIndex]._id);
            updated[optimisticIndex] = newMessage;
            return updated;
          } else {
            return [...prev, newMessage];
          }
        });
        
        setTimeout(() => {
          if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
          }
        }, 0);
      }
    };
    onMessage(handler);
    
    const seenHandler = (payload) => {
      if (payload?.conversationId === conversationId) {
        setMessages(prev => prev.map(msg => {
          if (msg.sender?._id === me?._id && !msg.isRead) {
            return { ...msg, isRead: true, readAt: payload.seenAt };
          }
          return msg;
        }));
      }
    };
    onMessagesSeen(seenHandler);
    
    const messageSeenHandler = (payload) => {
      if (payload?.conversationId === conversationId) {
        setMessages(prev => prev.map(msg => {
          if (msg._id === payload.messageId) {
            return { ...msg, isRead: true, readAt: payload.seenAt };
          }
          return msg;
        }));
      }
    };
    onMessageSeen(messageSeenHandler);
    
    const token = localStorage.getItem('token') || localStorage.getItem('admin_token');
    fetch(`${import.meta.env.VITE_API_URL}/api/v1/chat/conversations/${conversationId}/mark-read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    }).catch(()=>{});
  }, [conversationId, me?._id]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.dataset.messageId;
            const message = messages.find(m => m._id === messageId);
            
            if (message && message.recipient?._id === me?._id && !message.isRead && !message.isOptimistic) {
              markMessageAsSeen(messageId);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    messageRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [messages, me?._id]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('hideProductPrompts') === '1') {
      setShowProductCard(false);
      setShowQuickQuestions(false);
    }
  }, [location.search]);

  const lastReadOwnMessageId = useMemo(() => {
    const myId = me?._id;
    let lastId = null;
    let lastTs = -1;
    (messages || []).forEach((msg) => {
      if (msg?.sender?._id === myId && msg?.isRead) {
        const ts = new Date(msg.readAt || msg.createdAt || 0).getTime();
        if (ts >= lastTs) {
          lastTs = ts;
          lastId = msg._id;
        }
      }
    });
    return lastId;
  }, [messages, me?._id]);

  const otherUser = useMemo(() => {
    const myId = me?._id;
    let list = [];
    if (Array.isArray(conversation?.participants)) list = conversation.participants;
    else if (Array.isArray(conversation?.users)) list = conversation.users;
    else if (Array.isArray(conversation?.members)) list = conversation.members;

    let candidate = list.find((p) => (p?._id || p?.id) && (p._id || p.id) !== myId);
    if (!candidate && Array.isArray(messages)) {
      candidate = messages.find((m) => (m?.sender?._id || m?.sender?.id) && (m.sender._id || m.sender.id) !== myId)?.sender;
    }
    return candidate || null;
  }, [conversation, messages, me]);

  const sendMessage = async (e) => {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;

    const body = { conversationId, content };
    if (attachProductNext && conversation?.product?._id) {
      body.attachments = [{ type: 'product', url: conversation.product._id }];
    }

    const optimisticMessage = {
      _id: `temp-${Date.now()}`,
      conversation: conversationId,
      sender: me,
      content: content,
      attachments: body.attachments || [],
      createdAt: new Date().toISOString(),
      isOptimistic: true
    };

    setText('');
    setAttachProductNext(false);
    emitTyping(conversationId, false);
    
    setMessages(prev => [...prev, optimisticMessage]);
    seenIdsRef.current.add(optimisticMessage._id);
    
    setTimeout(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    }, 0);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/chat/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        const data = await res.json();
        const realMessage = data.message;
        
        setMessages(prev => prev.map(msg => 
          msg._id === optimisticMessage._id ? realMessage : msg
        ));
        
        seenIdsRef.current.delete(optimisticMessage._id);
        seenIdsRef.current.add(realMessage._id);
      } else {
        setMessages(prev => prev.filter(msg => msg._id !== optimisticMessage._id));
        seenIdsRef.current.delete(optimisticMessage._id);
        setText(content);
        if (body.attachments) setAttachProductNext(true);
        console.error('Failed to send message');
      }
    } catch (error) {
      setMessages(prev => prev.filter(msg => msg._id !== optimisticMessage._id));
      seenIdsRef.current.delete(optimisticMessage._id);
      setText(content);
      if (body.attachments) setAttachProductNext(true);
      console.error('Error sending message:', error);
    }
  };

  const askProduct = (question) => {
    setText(question);
    setAttachProductNext(true);
    setShowQuickQuestions(false);
    inputRef.current?.focus();
  };

  const ProductCard = () => {
    if (!conversation?.product || !showProductCard) return null;

    const product = conversation.product;
    return (
      <div className="bg-gradient-to-br from-white to-emerald-50/30 border border-emerald-100 rounded-2xl p-4 mb-4 shadow-sm hover:shadow-md transition-all duration-300 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Product Discussion</span>
          </div>
          <button
            onClick={() => setShowProductCard(false)}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1.5 transition-colors"
            title="Hide"
          >
            <FaTimes className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 relative group">
            <img
              src={product.images?.[0] || '/default-product.png'}
              alt={product.name}
              className="w-20 h-20 object-cover rounded-xl border-2 border-white shadow-md group-hover:scale-105 transition-transform duration-300"
              onError={(e) => { e.currentTarget.src = '/default-product.png'; }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 rounded-xl transition-colors"></div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 truncate text-lg mb-1">{product.name}</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-lg text-emerald-600 font-bold">₱{product.price?.toLocaleString()}</p>
              {product.category && (
                <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-medium border border-emerald-200">
                  {product.category}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const InlineProductAttachment = ({ isMe }) => {
    if (!conversation?.product) return null;
    const p = conversation.product;
    return (
      <div className={`mt-2 border-2 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg ${
        isMe 
          ? 'border-emerald-200 bg-white/90' 
          : 'border-gray-200 bg-white shadow-sm'
      }`}> 
        <div className="flex items-center gap-3 p-3">
          <div className="relative group">
            <img
              src={p.images?.[0] || '/default-product.png'}
              alt={p.name}
              className="w-14 h-14 rounded-lg object-cover border-2 border-white shadow group-hover:scale-105 transition-transform"
              onError={(e)=>{ e.currentTarget.src='/default-product.png'; }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 rounded-lg transition-colors"></div>
          </div>
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-semibold truncate ${isMe ? 'text-gray-900' : 'text-gray-900'}`}>
              {p.name}
            </div>
            <div className={`text-sm font-bold ${isMe ? 'text-emerald-600' : 'text-emerald-600'}`}>
              ₱{p.price?.toLocaleString()}
            </div>
          </div>
          <Button
            size="sm"
            className={`rounded-lg font-semibold shadow-sm hover:shadow-md transition-all ${
              isMe 
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-0' 
                : 'bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200'
            }`}
            onClick={()=>navigate(`/product/${p._id || ''}`)}
          >
            View
          </Button>
        </div>
      </div>
    );
  };

  const QuickQuestions = () => {
    if (!conversation?.product || !showQuickQuestions) return null;

    const quickQuestions = [
      { text: "Hi! I'm interested in this product. Can you tell me more about it?", icon: "💬" },
      { text: "Is this product still available?", icon: "✅" },
      { text: "What are the shipping options?", icon: "📦" },
      { text: "Do you have any discounts available?", icon: "🏷️" },
      { text: "Can I see more photos of this product?", icon: "📸" }
    ];

    return (
      <div className="mb-6 space-y-3 animate-fade-in">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent"></div>
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider px-3">Quick Actions</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent"></div>
        </div>
        
        <button
          onClick={() => askProduct(quickQuestions[0].text)}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-4 px-6 text-base font-bold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 group"
        >
          <span className="text-2xl group-hover:scale-110 transition-transform">{quickQuestions[0].icon}</span>
          <span>Ask About This Product</span>
        </button>
        
        <div className="grid grid-cols-1 gap-2">
          {quickQuestions.slice(1).map((question, index) => (
            <button
              key={index}
              onClick={() => askProduct(question.text)}
              className="text-sm py-3 px-4 text-left text-gray-700 bg-white hover:bg-emerald-50 border-2 border-gray-200 hover:border-emerald-300 rounded-xl transition-all duration-200 flex items-center gap-3 group hover:shadow-md"
            >
              <span className="text-lg group-hover:scale-110 transition-transform">{question.icon}</span>
              <span className="flex-1">{question.text}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-20 pb-4 px-3 sm:px-4 bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/50">
        <div className="max-w-4xl mx-auto h-[calc(100vh-7rem)] flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
          {/* Modern Header */}
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-white via-emerald-50/20 to-white backdrop-blur-xl flex items-center gap-3 shadow-sm">
            <button 
              onClick={() => navigate(-1)}
              className="lg:hidden text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full p-2 transition-all"
            >
              <FaArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="flex-shrink-0 relative">
              <img
                src={otherUser?.avatar || '/default-avatar.svg'}
                onError={(e)=>{ e.currentTarget.src='/default-avatar.svg'; }}
                alt="avatar"
                className="w-12 h-12 rounded-full border-3 border-white shadow-lg ring-2 ring-emerald-100 cursor-pointer hover:ring-emerald-300 transition-all"
                onClick={() => otherUser?._id && navigate(`/profile/${otherUser._id}`)}
              />
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
            </div>
            
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate flex items-center gap-2">
                {otherUser ? `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || otherUser.name || 'Conversation' : 'Conversation'}
              </h2>
              {conversation?.product && (
                <div className="text-xs text-gray-500 truncate flex items-center gap-1.5">
                  <FaShoppingCart className="w-3 h-3 text-emerald-500" />
                  <span>{conversation.product?.name}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {otherUser?._id && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="hidden sm:flex rounded-xl font-semibold border-2 hover:border-emerald-300 hover:bg-emerald-50 transition-all"
                  onClick={()=>navigate(`/profile/${otherUser._id}`)}
                >
                  View Profile
                </Button>
              )}
            </div>
          </div>

          {/* Messages Container */}
          <div ref={listRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gradient-to-br from-slate-50/30 to-white custom-scrollbar">
            {showProductCard && <ProductCard />}
            {showQuickQuestions && <QuickQuestions />}
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                <p className="text-gray-500 font-medium">Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-4xl">👋</span>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-700 mb-1">Start the conversation</p>
                  <p className="text-sm text-gray-500">Send a message to begin chatting</p>
                </div>
              </div>
            ) : (
              messages.map((m, idx) => {
                const isMe = m.sender?._id === me?._id;
                const avatar = m.sender?.avatar && m.sender.avatar !== 'null' && m.sender.avatar.trim() !== '' ? m.sender.avatar : '/default-avatar.svg';
                const displayName = `${m.sender?.firstName || ''} ${m.sender?.lastName || ''}`.trim();
                const showAvatar = idx === 0 || messages[idx - 1]?.sender?._id !== m.sender?._id;
                
                const messageRef = (el) => {
                  if (el) {
                    messageRefs.current.set(m._id, el);
                  } else {
                    messageRefs.current.delete(m._id);
                  }
                };
                
                return (
                  <div 
                    key={m._id} 
                    ref={messageRef}
                    data-message-id={m._id}
                    className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'} animate-slide-up`}
                  >
                    {!isMe && (
                      <div className="flex-shrink-0 mb-1">
                        {showAvatar ? (
                          <Avatar 
                            src={m.sender?.avatar} 
                            alt="avatar" 
                            className="w-8 h-8 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform"
                            onClick={() => navigate(`/profile/${m.sender?._id}`)}
                            title={displayName}
                          />
                        ) : (
                          <div className="w-8 h-8"></div>
                        )}
                      </div>
                    )}
                    
                    <div className={`max-w-[75%] sm:max-w-[65%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}> 
                      {showAvatar && !isMe && (
                        <div className="text-xs font-semibold text-gray-600 px-1">{displayName || 'User'}</div>
                      )}
                      
                      <div className={`group relative px-4 py-3 rounded-3xl shadow-md hover:shadow-lg transition-all duration-200 ${
                        isMe 
                          ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-br-md' 
                          : 'bg-white text-gray-800 rounded-bl-md border border-gray-100'
                      } ${m.isOptimistic ? 'opacity-70' : ''}`}>
                        <div className="whitespace-pre-wrap break-words leading-relaxed text-[15px]">
                          {m.content}
                        </div>
                        
                        {Array.isArray(m.attachments) && m.attachments.some(att => att?.type === 'product') && (
                          <InlineProductAttachment isMe={isMe} />
                        )}
                        
                        <div className={`text-[10px] mt-2 flex items-center gap-1.5 ${
                          isMe ? 'text-emerald-100' : 'text-gray-500'
                        }`}>
                          <span className="font-medium">
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {m.isOptimistic && isMe && (
                            <span className="animate-pulse flex gap-0.5">
                              <span>•</span><span>•</span><span>•</span>
                            </span>
                          )}
                          {!m.isOptimistic && isMe && (
                            <MessageStatus 
                              message={m}
                              isOwnMessage={isMe}
                              isLastReadOwnMessage={m._id === lastReadOwnMessageId}
                              recipientAvatar={otherUser?.avatar}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {isMe && (
                      <div className="flex-shrink-0 mb-1">
                        {showAvatar ? (
                          <Avatar 
                            src={m.sender?.avatar} 
                            alt="avatar" 
                            className="w-8 h-8 rounded-full border-2 border-emerald-200 shadow-md cursor-pointer hover:scale-110 transition-transform"
                            onClick={() => navigate(`/profile/${m.sender?._id}`)}
                            title={displayName}
                          />
                        ) : (
                          <div className="w-8 h-8"></div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Modern Input Area */}
          <div className="border-t border-gray-100 bg-white/95 backdrop-blur-xl px-4 sm:px-6 py-4">
            {conversation?.product && attachProductNext && (
              <div className="mb-3 flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border-l-4 border-emerald-500 rounded-lg">
                <FaCheckCircle className="text-emerald-600 w-4 h-4 flex-shrink-0" />
                <span className="text-sm text-emerald-800 font-medium flex-1">Product card will be attached</span>
                <button 
                  onClick={() => setAttachProductNext(false)}
                  className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 rounded-full p-1 transition-colors"
                >
                  <FaTimes className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            
            <form onSubmit={sendMessage} className="flex items-end gap-3">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  value={text}
                  onChange={(e)=>{ setText(e.target.value); emitTyping(conversationId, true); }}
                  onBlur={()=>emitTyping(conversationId, false)}
                  className="w-full border-2 border-gray-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 rounded-3xl px-5 py-3.5 pr-12 outline-none shadow-sm hover:shadow-md transition-all text-[15px] bg-gray-50 focus:bg-white"
                  placeholder="Type your message..."
                />
              </div>
              
              <Button 
                type="submit" 
                disabled={!text.trim()}
                className="rounded-2xl px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
              >
                <FaPaperPlane className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </Button>
            </form>
            
            {conversation?.product && !attachProductNext && (
              <div className="mt-3 flex items-center justify-center">
                <button
                  onClick={() => setAttachProductNext(true)}
                  className="text-xs text-gray-500 hover:text-emerald-600 font-medium px-4 py-2 rounded-full hover:bg-emerald-50 transition-all flex items-center gap-2"
                >
                  <FaShoppingCart className="w-3 h-3" />
                  <span>Attach product to message</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
        
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </>
  );
};

export default ChatView;