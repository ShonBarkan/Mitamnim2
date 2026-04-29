import React, { useState, useEffect, useRef } from 'react';
import { useMessages } from '../../hooks/useMessages';
import { useToast } from '../../hooks/useToast';

const MessageFeed = ({ title, targetId, type, currentUserId, userRole }) => {
  const [newMsg, setNewMsg] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, msgId: null });
  const messagesEndRef = useRef(null);
  const { showToast } = useToast(); // Safeguard for hook
  
  const { messages, sendMessage, deleteMessage, updateMessage, loading } = useMessages(targetId);

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
    const newContent = prompt("ערוך את ההודעה:", msg.content);
    if (newContent && newContent.trim() !== msg.content) {
      try {
        await updateMessage(msg.id, newContent);
        showToast("הודעה עודכנה", "success");
      } catch (err) {
        showToast("עדכון נכשל", "error");
      }
    }
  };

  const executeDelete = async () => {
    try {
      await deleteMessage(deleteModal.msgId);
      showToast("הודעה נמחקה", "success");
    } catch (err) {
      showToast("מחיקה נכשלה", "error");
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

  return (
    <section style={{ 
      border: '1px solid #ddd', borderRadius: '12px', padding: '20px', 
      backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', 
      gap: '10px', height: '500px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
      position: 'relative', direction: 'rtl' 
    }}>
      <div style={{ borderBottom: '2px solid #f0f0f0', paddingBottom: '10px', marginBottom: '10px' }}>
        <h3 style={{ margin: 0, color: '#333', fontSize: '1.2rem' }}>{title}</h3>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', padding: '5px' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#999' }}>טוען...</p>
        ) : messages.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#bbb', marginTop: '20px' }}>אין הודעות בשיחה זו</p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === currentUserId;
            const canEdit = isMine;
            const canDelete = isMine || userRole === 'trainer' || userRole === 'admin';

            // Alignment and style logic
            // isMine = Right (flex-start in RTL), Blue
            // Others = Left (flex-end in RTL), Gray
            let alignment = isMine ? 'flex-start' : 'flex-end';
            let bgColor = isMine ? '#e3f2fd' : '#f1f1f1';
            let textColor = '#2c3e50';

            if (type === 'general') {
              alignment = 'center';
              bgColor = '#fff3cd'; // Yellow for general board
            }

            return (
              <div 
                key={msg.id} 
                style={{
                  alignSelf: alignment,
                  width: type === 'general' ? '95%' : 'auto',
                  maxWidth: '85%', padding: '10px 14px', borderRadius: '10px',
                  backgroundColor: bgColor,
                  border: '1px solid',
                  borderColor: type === 'general' ? '#ffeeba' : (isMine ? '#bbdefb' : '#ddd'),
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', fontSize: '11px', fontWeight: 'bold', color: '#666', marginBottom: '5px' }}>
                  <span>{isMine ? 'אני' : msg.sender_name}</span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span>{formatTime(msg.created_at)}</span>
                    {canEdit && <button onClick={() => handleEdit(msg)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>✎</button>}
                    {canDelete && <button onClick={() => setDeleteModal({ open: true, msgId: msg.id })} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ff4d4f' }}>🗑</button>}
                  </div>
                </div>
                <div style={{ wordBreak: 'break-word', color: textColor, lineHeight: '1.5' }}>
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
        <input 
          type="text" value={newMsg} 
          onChange={(e) => setNewMsg(e.target.value)} 
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="כתוב הודעה..."
          style={{ flex: 1, padding: '12px', borderRadius: '25px', border: '1px solid #ddd', outline: 'none', fontSize: '14px' }}
        />
        <button 
          onClick={handleSend} disabled={!newMsg.trim()}
          style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          שלח
        </button>
      </div>

      {deleteModal.open && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, borderRadius: '12px' }}>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <p style={{ marginBottom: '15px', fontWeight: 'bold' }}>למחוק הודעה זו?</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={executeDelete} style={{ padding: '8px 15px', backgroundColor: '#ff4d4f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>מחק</button>
              <button onClick={() => setDeleteModal({ open: false, msgId: null })} style={{ padding: '8px 15px', backgroundColor: '#ccc', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>ביטול</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default MessageFeed;