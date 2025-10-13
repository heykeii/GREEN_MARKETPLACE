import React, { useEffect, useMemo, useRef, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { joinConversation, onMessage, onMessagesSeen, onMessageSeen, emitTyping, markMessageAsSeen } from '@/lib/socket';
import MessageStatus from '@/components/MessageStatus';
import Avatar from '@/components/Avatar';
import { FaShoppingCart, FaTimes, FaQuestion } from 'react-icons/fa';

const ChatView = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [conversation, setConversation] = useState(null);
  const [showProductCard, setShowProductCard] = useState(true);
  const [attachProductNext, setAttachProductNext] = useState(false);
  const listRef = useRef(null);
  const seenIdsRef = useRef(new Set());
  const messageRefs = useRef(new Map());
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
        // seed dedupe set
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
        
        // Check if this message replaces an optimistic message from the same sender with similar content
        setMessages(prev => {
          const newMessage = payload.message;
          const optimisticIndex = prev.findIndex(msg => 
            msg.isOptimistic && 
            msg.sender?._id === newMessage.sender?._id && 
            msg.content === newMessage.content &&
            Math.abs(new Date(msg.createdAt).getTime() - new Date(newMessage.createdAt).getTime()) < 10000 // within 10 seconds
          );
          
          if (optimisticIndex >= 0) {
            // Replace the optimistic message with the real one
            const updated = [...prev];
            seenIdsRef.current.delete(updated[optimisticIndex]._id);
            updated[optimisticIndex] = newMessage;
            return updated;
          } else {
            // Add new message normally
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
    
    // Handle messages seen event (when other user reads messages)
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
    
    // Handle individual message seen event
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
    
    // mark conversation as read when opening
    const token = localStorage.getItem('token') || localStorage.getItem('admin_token');
    fetch(`${import.meta.env.VITE_API_URL}/api/v1/chat/conversations/${conversationId}/mark-read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    }).catch(()=>{});
  }, [conversationId, me?._id]);

  // Intersection observer to mark messages as seen when they come into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.dataset.messageId;
            const message = messages.find(m => m._id === messageId);
            
            // Mark as seen if it's a message sent to us and not already seen
            if (message && message.recipient?._id === me?._id && !message.isRead && !message.isOptimistic) {
              markMessageAsSeen(messageId);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    // Observe all message elements
    messageRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [messages, me?._id]);

  // Hide product prompts if directed by query param (e.g., seller contacting customer)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('hideProductPrompts') === '1') {
      setShowProductCard(false);
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

  // Determine the other user in the conversation robustly
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

    // Create optimistic message for immediate UI update
    const optimisticMessage = {
      _id: `temp-${Date.now()}`, // temporary ID
      conversation: conversationId,
      sender: me,
      content: content,
      attachments: body.attachments || [],
      createdAt: new Date().toISOString(),
      isOptimistic: true // flag to identify optimistic messages
    };

    // Clear input and add optimistic message immediately
    setText('');
    setAttachProductNext(false);
    emitTyping(conversationId, false);
    
    // Add optimistic message to UI immediately
    setMessages(prev => [...prev, optimisticMessage]);
    seenIdsRef.current.add(optimisticMessage._id);
    
    // Scroll to bottom of messages container
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
        
        // Replace optimistic message with real one
        setMessages(prev => prev.map(msg => 
          msg._id === optimisticMessage._id ? realMessage : msg
        ));
        
        // Update seen IDs
        seenIdsRef.current.delete(optimisticMessage._id);
        seenIdsRef.current.add(realMessage._id);
      } else {
        // Remove optimistic message on error
        setMessages(prev => prev.filter(msg => msg._id !== optimisticMessage._id));
        seenIdsRef.current.delete(optimisticMessage._id);
        
        // Restore the text input
        setText(content);
        if (body.attachments) setAttachProductNext(true);
        
        console.error('Failed to send message');
      }
    } catch (error) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg._id !== optimisticMessage._id));
      seenIdsRef.current.delete(optimisticMessage._id);
      
      // Restore the text input
      setText(content);
      if (body.attachments) setAttachProductNext(true);
      
      console.error('Error sending message:', error);
    }
  };

  const askProduct = (question) => {
    setText(question);
    setAttachProductNext(true);
  };

  const ProductCard = () => {
    if (!conversation?.product || !showProductCard) return null;

    const product = conversation.product;
    return (
      <div className="bg-white border border-emerald-200 rounded-xl p-4 mb-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <img
              src={product.images?.[0] || '/default-product.png'}
              alt={product.name}
              className="w-16 h-16 object-cover rounded-lg border"
              onError={(e) => { e.currentTarget.src = '/default-product.png'; }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
            <div className="flex items-center gap-2">
              <p className="text-sm text-emerald-700 font-semibold">₱{product.price?.toLocaleString()}</p>
              {product.category && <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">{product.category}</span>}
            </div>
          </div>
          <button
            onClick={() => setShowProductCard(false)}
            className="text-gray-400 hover:text-gray-600 p-1"
            title="Hide"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const InlineProductAttachment = ({ isMe }) => {
    if (!conversation?.product) return null;
    const p = conversation.product;
    return (
      <div className={`mt-2 border rounded-lg ${isMe ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 bg-white'} overflow-hidden`}> 
        <div className="flex items-center gap-3 p-2">
          <img
            src={p.images?.[0] || '/default-product.png'}
            alt={p.name}
            className="w-12 h-12 rounded-md object-cover border"
            onError={(e)=>{ e.currentTarget.src='/default-product.png'; }}
          />
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-medium truncate ${isMe ? 'text-emerald-800' : 'text-gray-900'}`}>{p.name}</div>
            <div className={`text-xs ${isMe ? 'text-emerald-700' : 'text-gray-600'}`}>₱{p.price?.toLocaleString()}</div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className={isMe ? 'border-emerald-300 text-emerald-700' : 'border-gray-300 text-gray-700'}
            onClick={()=>navigate(`/product/${p._id || ''}`)}
          >
            View
          </Button>
        </div>
      </div>
    );
  };

  const AskProductButton = () => {
    if (!conversation?.product) return null;

    const quickQuestions = [
      "Hi! I'm interested in this product. Can you tell me more about it?",
      "Is this product still available?",
      "What are the shipping options?",
      "Do you have any discounts available?",
      "Can I see more photos of this product?"
    ];

    return (
      <div className="mb-4 space-y-3">
        <Button
          onClick={() => askProduct(quickQuestions[0])}
          className="w-full bg-pink-500 hover:bg-pink-600 text-white py-3 text-lg font-semibold rounded-lg"
        >
          <FaQuestion className="mr-2 h-5 w-5" />
          Ask Product
        </Button>
        
        <div className="grid grid-cols-1 gap-2">
          {quickQuestions.slice(1).map((question, index) => (
            <Button
              key={index}
              onClick={() => askProduct(question)}
              variant="outline"
              className="text-sm py-2 text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              {question}
            </Button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-24 px-3 sm:px-4 bg-gradient-to-br from-emerald-50 via-emerald-100 to-teal-50">
        <div className="max-w-3xl mx-auto bg-white/90 backdrop-blur rounded-xl shadow-md overflow-hidden border border-emerald-100">
          {/* Header */}
          <div className="px-3 sm:px-4 py-3 border-b bg-gradient-to-r from-white to-emerald-50 flex items-center gap-3">
            <div className="flex-shrink-0">
              <img
                src={otherUser?.avatar || '/default-avatar.svg'}
                onError={(e)=>{ e.currentTarget.src='/default-avatar.svg'; }}
                alt="avatar"
                className="w-9 h-9 rounded-full border"
              />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-semibold text-emerald-700 truncate">
                {otherUser ? `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || otherUser.name || 'Conversation' : 'Conversation'}
              </h2>
              {conversation?.product && (
                <div className="text-xs text-gray-500 truncate">Regarding: {conversation.product?.name}</div>
              )}
            </div>
            {otherUser?._id && (
              <div className="ml-auto">
                <Button variant="outline" size="sm" onClick={()=>navigate(`/profile/${otherUser._id}`)}>View profile</Button>
              </div>
            )}
          </div>
          <div className="h-[70vh] flex flex-col">
            <div ref={listRef} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 sm:space-y-3">
              {showProductCard && <ProductCard />}
              {showProductCard && <AskProductButton />}
              {loading ? (
                <div className="text-center text-gray-500">Loading...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500">Say hello 👋</div>
              ) : (
                messages.map((m) => {
                  const isMe = m.sender?._id === me?._id;
                  const avatar = m.sender?.avatar && m.sender.avatar !== 'null' && m.sender.avatar.trim() !== '' ? m.sender.avatar : '/default-avatar.svg';
                  const displayName = `${m.sender?.firstName || ''} ${m.sender?.lastName || ''}`.trim();
                  
                  // Create ref for intersection observer
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
                      className={`flex items-end ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isMe && (
                        <Avatar 
                          src={m.sender?.avatar} 
                          alt="avatar" 
                          className="w-8 h-8 rounded-full border mr-2"
                          onClick={() => navigate(`/profile/${m.sender?._id}`)}
                          title={displayName}
                        />
                      )}
                      <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}> 
                        <div className={`text-[11px] mb-1 ${isMe ? 'text-emerald-700' : 'text-gray-500'}`}>{displayName || (isMe ? 'You' : 'User')}</div>
                        <div className={`w-full px-3 py-2 rounded-2xl shadow-sm ${isMe ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'} ${m.isOptimistic ? 'opacity-70' : ''}`}>
                          <div className="whitespace-pre-wrap break-words leading-relaxed">{m.content}</div>
                          {Array.isArray(m.attachments) && m.attachments.some(att => att?.type === 'product') && (
                            <InlineProductAttachment isMe={isMe} />
                          )}
                          <div className={`text-[10px] mt-1 flex items-center gap-1 ${isMe ? 'text-emerald-100' : 'text-gray-500'}`}>
                            <span>{new Date(m.createdAt).toLocaleTimeString()}</span>
                            {m.isOptimistic && isMe && (
                              <span className="animate-pulse">•••</span>
                            )}
                          </div>
                          <MessageStatus 
                            message={m}
                            isOwnMessage={isMe}
                            isLastReadOwnMessage={m._id === lastReadOwnMessageId}
                            recipientAvatar={otherUser?.avatar}
                          />
                        </div>
                      </div>
                      {isMe && (
                        <Avatar 
                          src={m.sender?.avatar} 
                          alt="avatar" 
                          className="w-8 h-8 rounded-full border ml-2"
                          onClick={() => navigate(`/profile/${m.sender?._id}`)}
                          title={displayName}
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>
            <form onSubmit={sendMessage} className="border-t bg-white/70 backdrop-blur px-3 py-3 flex flex-col gap-3">
              <div className="flex gap-2">
                <input
                  value={text}
                  onChange={(e)=>{ setText(e.target.value); emitTyping(conversationId, true); }}
                  onBlur={()=>emitTyping(conversationId, false)}
                  className="flex-1 border border-emerald-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 rounded-full px-3 sm:px-4 py-2 outline-none shadow-sm"
                  placeholder="Type a message"
                />
                <Button type="submit" className="rounded-full px-4 sm:px-5">Send</Button>
              </div>
              {conversation?.product && (
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 flex items-center gap-2">
                    <input type="checkbox" checked={attachProductNext} onChange={(e)=>setAttachProductNext(e.target.checked)} />
                    Attach product card with this message
                  </label>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ChatView;


