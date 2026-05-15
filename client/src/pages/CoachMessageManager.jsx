import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { MessageContext } from '../contexts/MessageContext';
import { useToast } from '../hooks/useToast';
import { useSocket } from '../hooks/useSocket';

/**
 * CoachMessageManager Component
 * Manages sticky/main messages for the group and individual trainees with real-time updates.
 */
const CoachMessageManager = () => {
  const { user } = useContext(AuthContext);
  const { 
    contacts, 
    fetchContacts, 
    sendMessage, 
    mainMessages, 
    fetchMainMessages,
    messagesByTarget,
    fetchHistory
  } = useContext(MessageContext);
  
  const { showToast } = useToast();
  const { socket } = useSocket();

  const [groupMessage, setGroupMessage] = useState('');
  const [personalMessages, setPersonalMessages] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Initial data fetch
   */
  useEffect(() => {
    fetchContacts();
    fetchMainMessages();
  }, [fetchContacts, fetchMainMessages]);

  const trainees = contacts.filter(c => c.role === 'trainee');

  /**
   * Fetch history for trainees to identify current main messages
   */
  useEffect(() => {
    trainees.forEach(trainee => {
      if (!messagesByTarget[trainee.id]) {
        fetchHistory(trainee.id);
      }
    });
  }, [contacts, fetchHistory, messagesByTarget]);

  /**
   * Listen for real-time main message updates
   */
  useEffect(() => {
    if (!socket) return;

    const handleSocketUpdate = (event) => {
      const payload = JSON.parse(event.data);
      const { action, data } = payload;

      // Only care about new main messages created by someone (likely the coach themselves or an admin)
      if (action === 'MESSAGE_CREATED' && data.is_main) {
        if (data.message_type === 'general' && data.group_id === user.group_id) {
          fetchMainMessages();
        } else if (data.message_type === 'personal') {
          // If the message involves a trainee the coach is watching
          const traineeId = data.sender_id === user.id ? data.recipient_id : data.sender_id;
          fetchHistory(traineeId);
        }
      }
    };

    socket.addEventListener('message', handleSocketUpdate);
    return () => socket.removeEventListener('message', handleSocketUpdate);
  }, [socket, user.id, user.group_id, fetchMainMessages, fetchHistory]);

  const handleUpdateGroupMessage = async () => {
    if (!groupMessage.trim()) return;
    setIsSubmitting(true);
    try {
      await sendMessage('general', groupMessage, user.group_id, true);
      showToast("הודעה קבוצתית עודכנה בהצלחה", "success");
      setGroupMessage('');
      fetchMainMessages();
    } catch (error) {
      showToast("עדכון הודעה קבוצתית נכשל", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePersonalMessage = async (traineeId) => {
    const content = personalMessages[traineeId];
    if (!content || !content.trim()) return;

    setIsSubmitting(true);
    try {
      await sendMessage('personal', content, traineeId, true);
      showToast("הודעה אישית עודכנה בהצלחה", "success");
      setPersonalMessages(prev => ({ ...prev, [traineeId]: '' }));
      fetchHistory(traineeId); 
    } catch (error) {
      showToast("עדכון הודעה אישית נכשל", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTraineeMainMessage = (traineeId) => {
    const history = messagesByTarget[traineeId] || [];
    return history.find(m => m.is_main === true);
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>ניהול הודעות מאמן</h1>
        <p style={styles.subtitle}>עדכון הודעות ראשיות (Sticky) לקבוצה ולמתאמנים</p>
      </header>

      <section style={styles.card}>
        <h2 style={styles.cardTitle}>📢 הודעה לכלל הקבוצה</h2>
        
        {mainMessages.general && (
          <div style={styles.currentMessageBadge}>
            <small>הודעה נוכחית:</small>
            <p style={styles.currentMessageText}>{mainMessages.general.content}</p>
          </div>
        )}

        <p style={styles.description}>הודעה זו תופיע בראש לוח המודעות של כל חברי הקבוצה.</p>
        <div style={styles.inputGroup}>
          <textarea
            style={styles.textarea}
            placeholder="הזן הודעה קבוצתית חדשה..."
            value={groupMessage}
            onChange={(e) => setGroupMessage(e.target.value)}
          />
          <button
            style={styles.mainButton}
            onClick={handleUpdateGroupMessage}
            disabled={isSubmitting || !groupMessage.trim()}
          >
            עדכן הודעה קבוצתית
          </button>
        </div>
      </section>

      <section style={styles.card}>
        <h2 style={styles.cardTitle}>👤 הודעות אישיות למתאמנים</h2>
        <p style={styles.description}>הודעה אישית שתופיע כהודעה ראשית (Main) רק למתאמן הספציפי.</p>
        
        <div style={styles.traineeList}>
          {trainees.length === 0 ? (
            <p style={styles.noData}>לא נמצאו מתאמנים בקבוצה שלך.</p>
          ) : (
            trainees.map(trainee => {
              const currentMain = getTraineeMainMessage(trainee.id);
              
              return (
                <div key={trainee.id} style={styles.traineeRow}>
                  <div style={styles.traineeInfo}>
                    <span style={styles.traineeName}>{trainee.full_name}</span>
                    {currentMain && (
                      <div style={styles.traineeCurrentMsg}>
                        <small>הודעה פעילה: </small>
                        <span>"{currentMain.content}"</span>
                      </div>
                    )}
                  </div>
                  
                  <div style={styles.traineeActionGroup}>
                    <input
                      style={styles.smallInput}
                      placeholder={`הודעה חדשה ל${trainee.first_name}...`}
                      value={personalMessages[trainee.id] || ''}
                      onChange={(e) => setPersonalMessages({
                        ...personalMessages,
                        [trainee.id]: e.target.value
                      })}
                    />
                    <button
                      style={styles.secondaryButton}
                      onClick={() => handleUpdatePersonalMessage(trainee.id)}
                      disabled={isSubmitting || !personalMessages[trainee.id]?.trim()}
                    >
                      עדכן
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};

const styles = {
  container: {
    padding: '30px',
    maxWidth: '1000px',
    margin: '0 auto',
    direction: 'rtl',
    fontFamily: 'Arial, sans-serif'
  },
  header: {
    marginBottom: '30px',
    borderBottom: '2px solid #007bff',
    paddingBottom: '15px'
  },
  title: { margin: 0, color: '#2c3e50', fontSize: '1.8rem' },
  subtitle: { margin: '5px 0 0 0', color: '#6c757d' },
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '25px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    marginBottom: '30px',
    border: '1px solid #eee'
  },
  cardTitle: { margin: '0 0 10px 0', fontSize: '1.3rem', color: '#333' },
  description: { fontSize: '14px', color: '#666', marginBottom: '15px' },
  currentMessageBadge: {
    backgroundColor: '#fff3cd',
    border: '1px solid #ffeeba',
    padding: '10px 15px',
    borderRadius: '8px',
    marginBottom: '15px'
  },
  currentMessageText: { margin: '5px 0 0 0', fontWeight: 'bold', color: '#856404' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '15px' },
  textarea: {
    width: '100%',
    height: '100px',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '15px',
    outline: 'none',
    resize: 'none',
    fontFamily: 'inherit'
  },
  mainButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    padding: '10px 25px',
    borderRadius: '25px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  traineeList: { display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px' },
  traineeRow: {
    display: 'flex',
    flexDirection: 'column',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #eee',
    gap: '12px'
  },
  traineeInfo: { display: 'flex', flexDirection: 'column', gap: '4px' },
  traineeName: { fontWeight: 'bold', fontSize: '15px', color: '#333' },
  traineeCurrentMsg: { fontSize: '12px', color: '#28a745', fontStyle: 'italic' },
  traineeActionGroup: { display: 'flex', gap: '10px' },
  smallInput: {
    flex: 1,
    padding: '10px 15px',
    borderRadius: '20px',
    border: '1px solid #ddd',
    fontSize: '14px',
    outline: 'none'
  },
  secondaryButton: {
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    padding: '8px 20px',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold'
  },
  noData: { textAlign: 'center', color: '#999', padding: '20px' }
};

export default CoachMessageManager;