'use client';
import { useState, useEffect, useRef } from 'react';
import { ref, push, onValue } from 'firebase/database';
import { database } from '@/lib/firebase';
import { timeAgo } from '@/lib/timeAgo';

export default function ChatPanel({ session, sessionId, currentUserId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastReadRef = useRef(Date.now());
  const inputRef = useRef(null);
  const mobileInputRef = useRef(null);

  const currentUser = session?.users?.[currentUserId];

  // Listen for messages
  useEffect(() => {
    if (!sessionId) return;

    const messagesRef = ref(database, `sessions/${sessionId}/messages`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messageList = Object.entries(data).map(([id, msg]) => ({
          id,
          ...msg
        })).sort((a, b) => a.timestamp - b.timestamp);
        setMessages(messageList);

        // Count unread messages when panel is closed
        if (!isOpen) {
          const newUnread = messageList.filter(
            msg => msg.timestamp > lastReadRef.current && msg.userId !== currentUserId
          ).length;
          setUnreadCount(newUnread);
        }
      } else {
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, [sessionId, currentUserId, isOpen]);

  const desktopMessagesContainerRef = useRef(null);
  const mobileMessagesContainerRef = useRef(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    // Desktop: scroll container to bottom
    if (desktopMessagesContainerRef.current) {
      desktopMessagesContainerRef.current.scrollTop = desktopMessagesContainerRef.current.scrollHeight;
    }
    // Mobile: scroll container to bottom
    if (isOpen && mobileMessagesContainerRef.current) {
      mobileMessagesContainerRef.current.scrollTop = mobileMessagesContainerRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // Mark messages as read when opening panel
  useEffect(() => {
    if (isOpen) {
      lastReadRef.current = Date.now();
      setUnreadCount(0);
    }
  }, [isOpen]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    const messagesRef = ref(database, `sessions/${sessionId}/messages`);
    await push(messagesRef, {
      text: newMessage.trim(),
      userId: currentUserId,
      userName: currentUser.name,
      timestamp: Date.now()
    });

    setNewMessage('');
  };

  const users = session?.users ? Object.entries(session.users) : [];
  const getUserColor = (userId) => {
    const index = users.findIndex(([id]) => id === userId);
    const colors = ['text-blue-600', 'text-green-600', 'text-purple-600', 'text-orange-600'];
    return colors[index] || colors[0];
  };

  // Render messages list
  const renderMessages = () => (
    <>
      {messages.length === 0 ? (
        <p className="text-center text-[#6b7c87] text-sm py-4">
          No messages yet. Start the conversation!
        </p>
      ) : (
        messages.map((msg) => {
          const isOwn = msg.userId === currentUserId;
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 ${
                  isOwn
                    ? 'bg-[#8bc34a] text-white'
                    : 'bg-gray-100 text-[#37474f]'
                }`}
              >
                {!isOwn && (
                  <div className={`text-xs font-semibold mb-1 ${getUserColor(msg.userId)}`}>
                    {msg.userName}
                  </div>
                )}
                <p className="text-sm break-words">{msg.text}</p>
              </div>
              <span className="text-xs text-[#6b7c87] mt-1">
                {timeAgo(msg.timestamp)}
              </span>
            </div>
          );
        })
      )}
    </>
  );

  return (
    <>
      {/* Desktop: Inline chat below map */}
      <div className="hidden lg:block bg-white border border-[#d0d0d0] rounded shadow-sm mt-4">
        <div className="p-3 border-b border-[#d0d0d0] bg-gray-50">
          <h3 className="font-semibold text-[#37474f] flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Chat
          </h3>
        </div>
        <div className="h-[250px] flex flex-col">
          {/* Messages */}
          <div ref={desktopMessagesContainerRef} className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
            {renderMessages()}
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-3 border-t border-[#d0d0d0] bg-white">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 border border-[#d0d0d0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#8bc34a]"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-[#8bc34a] hover:bg-[#7cb342] disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Mobile: Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed bottom-20 right-4 z-40 bg-[#8bc34a] hover:bg-[#7cb342] text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Mobile: Slide-out panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="lg:hidden fixed right-0 top-0 bottom-0 w-[85%] max-w-[350px] bg-white z-50 shadow-xl flex flex-col animate-slide-in">
            {/* Header */}
            <div className="p-3 border-b border-[#d0d0d0] bg-gray-50 flex items-center justify-between">
              <h3 className="font-semibold text-[#37474f] flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Chat
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[#6b7c87] hover:text-[#37474f] p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div ref={mobileMessagesContainerRef} className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
              {renderMessages()}
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-3 border-t border-[#d0d0d0] bg-white">
              <div className="flex gap-2">
                <input
                  ref={mobileInputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 border border-[#d0d0d0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#8bc34a]"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-[#8bc34a] hover:bg-[#7cb342] disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Animation styles */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slideIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
