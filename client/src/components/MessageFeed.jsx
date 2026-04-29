import React, { useState, useEffect, useRef } from 'react';
import { useMessages } from '../hooks/useMessages';
import { useToast } from '../hooks/useToast';

/**
 * MessageFeed Component
 * Displays a list of messages with Hebrew UI, day separators, and CRUD operations.
 */
const MessageFeed = ({ title, targetId, type, currentUserId, userRole }) => {
  const [newMsg, setNewMsg] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, msgId: null });
  const messagesEndRef = useRef(null);
  const { showToast } = useToast();
  
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

  /**
   * Helper to format time strings
   */
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Helper to format date labels for day separators
   */
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
    <section style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h3 style={styles.headerTitle}>{title}</h3>
      </div>
      
      {/* Messages List Area */}
      <div style={styles.messagesArea}>
        {loading ? (
          <p style={styles.statusText}>טוען...</p>
        ) : messages.length === 0 ? (
          <p style={styles.statusText}>אין הודעות בשיחה זו</p>
        ) : (
          messages.map((msg, index) => {
            // Logic to determine if a date separator is needed
            const msgDate = new Date(msg.created_at).toDateString();
            const prevMsgDate = index > 0 ? new Date(messages[index - 1].created_at).toDateString() : null;
            const isNewDay = msgDate !== prevMsgDate;

            const isMine = msg.sender_id === currentUserId;
            const canEdit = isMine;
            const canDelete = isMine || userRole === 'trainer' || userRole === 'admin';

            let alignment = isMine ? 'flex-start' : 'flex-end';
            let bgColor = isMine ? '#e3f2fd' : '#f1f1f1';

            if (type === 'general') {
              alignment = 'center';
              bgColor = '#fff3cd';
            }

            return (
              <React.Fragment key={msg.id}>
                {isNewDay && (
                  <div style={styles.daySeparator}>
                    <span style={styles.dayLabel}>{formatDateLabel(msg.created_at)}</span>
                  </div>
                )}
                
                <div 
                  style={{
                    ...styles.messageBubble,
                    alignSelf: alignment,
                    backgroundColor: bgColor,
                    borderColor: type === 'general' ? '#ffeeba' : (isMine ? '#bbdefb' : '#ddd'),
                    width: type === 'general' ? '95%' : 'auto',
                  }}
                >
                  <div style={styles.messageMeta}>
                    <span>{isMine ? 'אני' : msg.sender_name}</span>
                    <div style={styles.actions}>
                      <span>{formatTime(msg.created_at)}</span>
                      {canEdit && <button onClick={() => handleEdit(msg)} style={styles.actionBtn}>✎</button>}
                      {canDelete && (
                        <button 
                          onClick={() => setDeleteModal({ open: true, msgId: msg.id })} 
                          style={{ ...styles.actionBtn, color: '#ff4d4f' }}
                        >
                          🗑
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={styles.messageContent}>
                    {msg.content}
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Section */}
      <div style={styles.inputArea}>
        <input 
          type="text" 
          value={newMsg} 
          onChange={(e) => setNewMsg(e.target.value)} 
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="הקלד הודעה..."
          style={styles.input}
        />
        <button 
          onClick={handleSend} 
          disabled={!newMsg.trim()}
          style={styles.sendBtn}
        >
          שלח
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <p style={{ marginBottom: '15px', fontWeight: 'bold' }}>למחוק הודעה זו?</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={executeDelete} style={styles.confirmDeleteBtn}>מחק</button>
              <button onClick={() => setDeleteModal({ open: false, msgId: null })} style={styles.cancelBtn}>ביטול</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

// --- STYLES ---

const styles = {
  container: { 
    display: 'flex', 
    flexDirection: 'column', 
    height: '100%', 
    backgroundColor: '#ffffff', 
    position: 'relative', 
    direction: 'rtl' 
  },
  header: { 
    borderBottom: '2px solid #f0f0f0', 
    padding: '15px 20px', 
    backgroundColor: '#fff' 
  },
  headerTitle: { 
    margin: 0, 
    color: '#333', 
    fontSize: '1.1rem' 
  },
  messagesArea: { 
    flex: 1, 
    overflowY: 'auto', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '12px', 
    padding: '20px' 
  },
  statusText: { 
    textAlign: 'center', 
    color: '#999', 
    marginTop: '20px' 
  },
  daySeparator: {
    display: 'flex',
    justifyContent: 'center',
    margin: '20px 0 10px 0',
    position: 'relative'
  },
  dayLabel: {
    backgroundColor: '#f1f3f5',
    color: '#6c757d',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  },
  messageBubble: {
    maxWidth: '85%', 
    padding: '10px 14px', 
    borderRadius: '10px',
    border: '1px solid',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  },
  messageMeta: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    gap: '20px', 
    fontSize: '11px', 
    fontWeight: 'bold', 
    color: '#666', 
    marginBottom: '5px' 
  },
  actions: { 
    display: 'flex', 
    gap: '8px', 
    alignItems: 'center' 
  },
  actionBtn: { 
    border: 'none', 
    background: 'none', 
    cursor: 'pointer', 
    fontSize: '12px' 
  },
  messageContent: { 
    wordBreak: 'break-word', 
    color: '#2c3e50', 
    lineHeight: '1.5',
    fontSize: '14px' 
  },
  inputArea: { 
    display: 'flex', 
    gap: '10px', 
    borderTop: '1px solid #eee', 
    padding: '15px 20px',
    backgroundColor: '#fff'
  },
  input: { 
    flex: 1, 
    padding: '12px 18px', 
    borderRadius: '25px', 
    border: '1px solid #ddd', 
    outline: 'none', 
    fontSize: '14px' 
  },
  sendBtn: { 
    padding: '10px 25px', 
    backgroundColor: '#007bff', 
    color: 'white', 
    border: 'none', 
    borderRadius: '25px', 
    cursor: 'pointer', 
    fontWeight: 'bold' 
  },
  overlay: { 
    position: 'absolute', 
    top: 0, left: 0, right: 0, bottom: 0, 
    backgroundColor: 'rgba(0,0,0,0.4)', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    zIndex: 100 
  },
  modal: { 
    backgroundColor: 'white', 
    padding: '20px', 
    borderRadius: '8px', 
    textAlign: 'center',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
  },
  confirmDeleteBtn: { 
    padding: '8px 15px', 
    backgroundColor: '#ff4d4f', 
    color: 'white', 
    border: 'none', 
    borderRadius: '4px', 
    cursor: 'pointer' 
  },
  cancelBtn: { 
    padding: '8px 15px', 
    backgroundColor: '#ccc', 
    border: 'none', 
    borderRadius: '4px', 
    cursor: 'pointer' 
  }
};

export default MessageFeed;