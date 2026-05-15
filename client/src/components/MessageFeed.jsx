import React, { useState, useEffect, useRef } from 'react';
import { useMessages } from '../hooks/useMessages';
import { useToast } from '../hooks/useToast';
import { useSocket } from '../hooks/useSocket';

/**
 * MessageFeed Component - Core messaging thread layer.
 * Powered by WebSockets for real-time CRUD operational state syncing.
 * Styled completely with premium Arctic Mirror glassmorphic design configurations.
 */
const MessageFeed = ({ title, targetId, type, currentUserId, userRole }) => {
  const [newMsg, setNewMsg] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, msgId: null });
  const messagesEndRef = useRef(null);
  
  const { showToast } = useToast();
  const { socket } = useSocket();
  
  // Real-time hook synchronization bindings
  const { messages, setMessages, sendMessage, deleteMessage, updateMessage, loading } = useMessages(targetId);

  /**
   * WebSocket Lifecycle: Synchronizes global messaging operations seamlessly.
   */
  useEffect(() => {
    if (!socket) return;

    const handleSocketMessage = (event) => {
      const payload = JSON.parse(event.data);
      const { action, data } = payload;

      // Gateway Filter: Only trap packets belonging strictly to this operational chat scope
      const isRelevant = 
        (type === 'general' && data.group_id === targetId) || 
        (type === 'personal' && (data.sender_id === targetId || data.recipient_id === targetId));

      if (!isRelevant) return;

      switch (action) {
        case 'MESSAGE_CREATED':
          setMessages((prev) => {
            if (prev.find(m => m.id === data.id)) return prev;
            return [...prev, data];
          });
          break;

        case 'MESSAGE_UPDATED':
          setMessages((prev) => 
            prev.map(m => m.id === data.id ? { ...m, content: data.content } : m)
          );
          break;

        case 'MESSAGE_DELETED':
          setMessages((prev) => prev.filter(m => m.id !== data.id));
          break;

        default:
          break;
      }
    };

    socket.addEventListener('message', handleSocketMessage);
    return () => socket.removeEventListener('message', handleSocketMessage);
  }, [socket, targetId, type, setMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!newMsg.trim() || !targetId) return;
    try {
      await sendMessage(type, newMsg, targetId, false);
      setNewMsg('');
    } catch (err) {
      showToast("שליחת ההודעה נכשלה", "error");
    }
  };

  const handleEdit = async (msg) => {
    const newContent = prompt("ערוך הודעה:", msg.content);
    if (newContent && newContent.trim() !== msg.content) {
      try {
        await updateMessage(msg.id, newContent);
        showToast("ההודעה עודכנה", "success");
      } catch (err) {
        showToast("העדכון נכשל", "error");
      }
    }
  };

  const executeDelete = async () => {
    try {
      await deleteMessage(deleteModal.msgId);
      showToast("ההודעה נמחקה", "success");
    } catch (err) {
      showToast("המחיקה נכשלה", "error");
    } finally {
      setDeleteModal({ open: false, msgId: null });
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateLabel = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "היום";
    if (date.toDateString() === yesterday.toDateString()) return "אתמול";
    
    return date.toLocaleDateString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <section className="flex flex-col h-full bg-white/30 backdrop-blur-3xl border border-white/60 rounded-[2.5rem] shadow-2xl overflow-hidden relative" dir="rtl">
      
      {/* Feed Dynamic Header */}
      <header className="p-6 border-b border-white/40 bg-white/20 flex items-center justify-between">
        <div className="space-y-0.5">
          <h3 className="m-0 text-xl font-black text-zinc-900 tracking-tighter uppercase">{title || "צ'אט קבוצתי"}</h3>
          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Secure Chat Thread</p>
        </div>
      </header>
      
      {/* Messaging Stream Arena */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-4 p-6 scrollbar-hide">
        {loading ? (
          <div className="flex flex-col flex-1 justify-center items-center gap-2 py-10">
            <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Loading Sync...</p>
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-xs font-bold text-zinc-400 italic py-12">אין הודעות בשיחה זו</p>
        ) : (
          messages.map((msg, index) => {
            const msgDate = new Date(msg.created_at).toDateString();
            const prevMsgDate = index > 0 ? new Date(messages[index - 1].created_at).toDateString() : null;
            const isNewDay = msgDate !== prevMsgDate;

            const isMine = msg.sender_id === currentUserId;
            const canEdit = isMine;
            const canDelete = isMine || userRole === 'trainer' || userRole === 'admin';

            // Establish responsive fluid layouts based on message configuration types
            let alignment = isMine ? 'self-start' : 'self-end';
            let bubbleStyle = isMine 
              ? 'bg-blue-500/10 border border-blue-200/30 rounded-tr-none' 
              : 'bg-white/80 border border-white rounded-tl-none';

            if (type === 'general') {
              alignment = 'self-center w-[96%]';
              bubbleStyle = 'bg-amber-500/5 border border-amber-200/30 shadow-inner text-center';
            }

            return (
              <React.Fragment key={msg.id}>
                {/* Timeline Axis Date Badges */}
                {isNewDay && (
                  <div className="flex justify-center my-4">
                    <span className="bg-white/80 backdrop-blur-md border border-white/80 text-zinc-400 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">
                      {formatDateLabel(msg.created_at)}
                    </span>
                  </div>
                )}
                
                {/* Message Item Module Container */}
                <div className={`max-w-[85%] p-4 rounded-[1.5rem] shadow-sm flex flex-col transition-all duration-300 hover:shadow-md ${alignment} ${bubbleStyle}`}>
                  
                  {/* Metadata Row: Sender Context and Meta Control Utilities */}
                  <div className="flex justify-between items-center gap-6 text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-2">
                    <span className={isMine ? 'text-blue-600' : 'text-zinc-500'}>
                      {isMine ? 'אני' : msg.sender_name}
                    </span>
                    
                    <div className="flex items-center gap-2">
                      <span className="tabular-nums font-bold">{formatTime(msg.created_at)}</span>
                      {canEdit && (
                        <button 
                          onClick={() => handleEdit(msg)} 
                          className="border-none bg-transparent cursor-pointer text-xs p-1 text-zinc-300 hover:text-zinc-900 transition-colors"
                          title="Edit message"
                        >
                          ✎
                        </button>
                      )}
                      {canDelete && (
                        <button 
                          onClick={() => setDeleteModal({ open: true, msgId: msg.id })} 
                          className="border-none bg-transparent cursor-pointer text-xs p-1 text-rose-300 hover:text-rose-500 transition-colors"
                          title="Delete message"
                        >
                          ⨉
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Operational Message Content Frame */}
                  <div className="break-words text-zinc-800 font-bold text-sm leading-relaxed text-right">
                    {msg.content}
                  </div>

                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Action Panel */}
      <div className="flex gap-3 border-t border-white/40 p-5 bg-white/30 backdrop-blur-xl items-center">
        <input 
          type="text" 
          value={newMsg} 
          onChange={(e) => setNewMsg(e.target.value)} 
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="הקלד הודעה משהו..."
          className="flex-1 bg-white border border-zinc-100 rounded-full px-6 py-4 text-sm font-bold text-zinc-900 outline-none focus:ring-8 focus:ring-zinc-900/5 transition-all shadow-inner placeholder:text-zinc-300"
        />
        <button 
          onClick={handleSend} 
          disabled={!newMsg.trim()}
          className="px-6 py-4 bg-zinc-900 text-white rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-zinc-900/10 transition-all active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed hover:bg-zinc-800"
        >
          שלח
        </button>
      </div>

      {/* Confirmation Guard Overlay Modal */}
      {deleteModal.open && (
        <div className="absolute inset-0 z-[120] flex items-center justify-center p-6 bg-zinc-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white/90 backdrop-blur-3xl border border-white/80 rounded-[2.5rem] p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-300 space-y-6">
            <p className="text-base font-black text-zinc-900 tracking-tight">האם ברצונך למחוק הודעה זו?</p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={executeDelete} 
                className="px-6 py-3 bg-rose-500 text-white font-black text-xs uppercase tracking-wider rounded-xl hover:bg-rose-600 transition-all active:scale-95"
              >
                מחק
              </button>
              <button 
                onClick={() => setDeleteModal({ open: false, msgId: null })} 
                className="px-6 py-3 bg-zinc-100 text-zinc-500 font-black text-xs uppercase tracking-wider rounded-xl hover:bg-zinc-200 transition-all active:scale-95"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default MessageFeed;