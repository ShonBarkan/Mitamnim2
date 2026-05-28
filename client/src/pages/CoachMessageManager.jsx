import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { MessageContext } from '../contexts/MessageContext';
import { ToastContext } from '../contexts/ToastContext';
import { SocketContext } from '../contexts/SocketContext';
import FrontendLogger from '../utils/logger';

/**
 * CoachMessageManager Component - Administrative portal for managing sticky broadcast notices.
 * Re-architected from legacy inline structures to premium Arctic Mirror glassmorphic layouts.
 * Empowers managers to publish top-level global or targeted contextual announcement layers.
 */
const CoachMessageManager = () => {
  const { user } = useContext(AuthContext);
  const { 
    contacts = [], 
    fetchContacts, 
    sendMessage, 
    mainMessages = {}, 
    fetchMainMessages,
    messagesByTarget = {},
    fetchHistory
  } = useContext(MessageContext);
  
  const { showToast } = useContext(ToastContext);
  const { socket } = useContext(SocketContext);

  const [groupMessage, setGroupMessage] = useState('');
  const [personalMessages, setPersonalMessages] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Initial Sync: Hydrates administrative group roster and live pinned feeds.
   */
  useEffect(() => {
    FrontendLogger.info('COACH_MESSAGE_MANAGER', 'Syncing administrative contact rosters and core announcement feeds');
    fetchContacts();
    fetchMainMessages();
  }, [fetchContacts, fetchMainMessages]);

  /**
   * Memoized Registry: Filters contacts flat collection to extract trainees only.
   */
  const trainees = useMemo(() => {
    return contacts.filter(c => c.role === 'trainee');
  }, [contacts]);

  /**
   * History Anchor: Pulls thread history to evaluate current sticky states for roster profiles.
   */
  useEffect(() => {
    trainees.forEach(trainee => {
      if (!messagesByTarget[trainee.id]) {
        fetchHistory(trainee.id);
      }
    });
  }, [trainees, fetchHistory, messagesByTarget]);

  /**
   * Real-Time Stream Hook: Intercepts inbound WebSocket messages to force update main layers.
   */
  useEffect(() => {
    if (!socket) return;

    const handleSocketUpdate = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const { action, data } = payload;

        if (action === 'MESSAGE_CREATED' && data?.is_main) {
          FrontendLogger.info('COACH_MESSAGE_MANAGER', `Live hot-reload packet detected via stream channel for action: ${action}`);
          fetchMainMessages();
          
          if (data.message_type === 'personal') {
            const traineeId = data.sender_id === user?.id ? data.recipient_id : data.sender_id;
            fetchHistory(traineeId);
          }
        }
      } catch (err) {
        FrontendLogger.error('COACH_MESSAGE_MANAGER', 'Error parsing inbound WebSocket message payload stream', err);
      }
    };

    socket.addEventListener('message', handleSocketUpdate);
    return () => socket.removeEventListener('message', handleSocketUpdate);
  }, [socket, user?.id, fetchMainMessages, fetchHistory]);

  const handleUpdateGroupMessage = async () => {
    if (!groupMessage.trim()) return;
    FrontendLogger.info('COACH_MESSAGE_MANAGER', 'Publishing global group sticky announcement node update');
    setIsSubmitting(true);
    try {
      await sendMessage('general', groupMessage.trim(), user.group_id, true);
      showToast("ההודעה הקבוצתית עודכנה בהצלחה ותוצמד ללוח המשתמשים", "success");
      setGroupMessage('');
      fetchMainMessages();
    } catch (error) {
      FrontendLogger.error('COACH_MESSAGE_MANAGER', 'Transaction failure while committing global group message', error);
      showToast("עדכון הודעה קבוצתית נכשל", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePersonalMessage = async (traineeId) => {
    const content = personalMessages[traineeId];
    if (!content || !content.trim()) return;

    FrontendLogger.info('COACH_MESSAGE_MANAGER', `Publishing targeted sticky notice onto trainee vector index: ${traineeId}`);
    setIsSubmitting(true);
    try {
      await sendMessage('personal', content.trim(), traineeId, true);
      showToast("הודעה אישית עודכנה והוצמדה למסך הבית של האתלט", "success");
      setPersonalMessages(prev => ({ ...prev, [traineeId]: '' }));
      
      fetchMainMessages();
      fetchHistory(traineeId); 
    } catch (error) {
      FrontendLogger.error('COACH_MESSAGE_MANAGER', `Transaction failure while forcing personal sticky log patch to target: ${traineeId}`, error);
      showToast("עדכון הודעה אישית נכשל", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTraineeMainMessage = (traineeId) => {
    const history = messagesByTarget[traineeId] || [];
    // Fixed syntax bug: evaluated clean JS lowercase boolean truthy metrics
    return history.find(m => m.is_main === true);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-slate-100 to-zinc-200 font-sans p-6 lg:p-12 space-y-12 max-w-6xl mx-auto" dir="rtl">
      
      {/* Top Main Page Header Block */}
      <header className="space-y-2 pb-6 border-b border-white/40 animate-in fade-in slide-in-from-top-6 duration-700 select-none">
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-zinc-900 uppercase m-0 leading-none">
          ניהול הודעות מאמן
        </h1>
        <p className="text-xs font-bold text-zinc-400 m-0 mt-1">
          עדכון הודעות ראשיות (Sticky) לקבוצה ולמתאמנים
        </p>
      </header>

      {/* --- BROADCAST CARD: GLOBAL GROUP ANNOUNCEMENT LAYER --- */}
      <section className="bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[2.5rem] p-8 lg:p-10 shadow-xl space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-1000">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-zinc-900 tracking-tight m-0 uppercase leading-none">📢 הודעה לכלל הקבוצה</h2>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">Global Group Announcement Layer</p>
        </div>
        
        {mainMessages.general && (
          <div className="bg-amber-500/5 backdrop-blur-md border border-amber-200/30 p-6 rounded-2xl shadow-inner space-y-1.5 animate-in fade-in duration-500">
            <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest block select-none">הודעה נוכחית באוויר:</span>
            <p className="text-zinc-800 font-bold text-base leading-relaxed m-0">{mainMessages.general.content}</p>
          </div>
        )}

        <p className="text-xs font-bold text-zinc-400 max-w-xl mr-1 leading-relaxed select-none">
          הודעה זו תופיע דרך קבע בראש לוח המודעות ובמסך הבית של כל חברי הקבוצה הרשומים במערכת.
        </p>
        
        <div className="flex flex-col gap-4">
          <textarea
            placeholder="הקלד כאן הודעה קבוצתית חדשה להצמדה..."
            value={groupMessage}
            onChange={(e) => setGroupMessage(e.target.value)}
            className="w-full bg-white/60 border border-white/80 rounded-2xl px-6 py-4 text-sm font-bold text-zinc-900 outline-none focus:ring-8 focus:ring-zinc-900/5 transition-all min-h-[110px] resize-none shadow-sm placeholder:text-zinc-300"
          />
          <button
            type="button"
            onClick={handleUpdateGroupMessage}
            disabled={isSubmitting || !groupMessage.trim()}
            className="self-start bg-zinc-900 text-white font-black text-xs uppercase tracking-[0.25em] px-8 py-4 rounded-2xl shadow-xl shadow-zinc-900/10 transition-all active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed border border-zinc-900"
          >
            עדכן הודעה קבוצתית
          </button>
        </div>
      </section>

      {/* --- REGISTRY CARD: TARGETED TRAINEE MESSAGES --- */}
      <section className="bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[2.5rem] p-8 lg:p-10 shadow-xl space-y-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-zinc-900 tracking-tight m-0 uppercase leading-none">👤 הודעות אישיות למתאמנים</h2>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">Targeted Athlete Sticky Pinned Feeds</p>
        </div>
        <p className="text-xs font-bold text-zinc-400 max-w-xl mr-1 leading-relaxed select-none">
          הודעה אישית ממוקדת שתופיע כהודעה ראשית מוצמדת אך ורק במסך הבית של המתאמן הספציפי שנבחר.
        </p>
        
        <div className="space-y-4">
          {trainees.length === 0 ? (
            <div className="text-center py-16 bg-white/20 rounded-[2rem] border-2 border-dashed border-white/40 select-none pointer-events-none">
              <span className="text-2xl block mb-2 opacity-30">👥</span>
              <p className="text-xs font-black text-zinc-400 uppercase tracking-widest italic m-0">לא נמצאו מתאמנים פעילים בקבוצה שלך</p>
            </div>
          ) : (
            trainees.map(trainee => {
              const currentMain = getTraineeMainMessage(trainee.id);
              
              return (
                <div key={trainee.id} className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 p-6 bg-white/60 backdrop-blur-md border border-white rounded-[2rem] shadow-sm hover:shadow-md transition-all duration-300">
                  
                  {/* Trainee Identifier Info Frame */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      {trainee.profile_picture ? (
                        <img src={trainee.profile_picture} alt="" className="w-8 h-8 rounded-lg object-cover border border-white shadow-sm" />
                      ) : (
                        <div className="w-8 h-8 bg-zinc-900 text-white rounded-lg flex items-center justify-center text-[10px] font-black uppercase font-mono select-none">
                          {trainee.first_name?.[0] || '?'}
                        </div>
                      )}
                      <span className="font-black text-base text-zinc-900 tracking-tight truncate">{trainee.full_name || `${trainee.first_name} ${trainee.second_name}`}</span>
                    </div>
                    
                    {currentMain && (
                      <div className="bg-emerald-500/5 border border-emerald-500/10 px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 max-w-xl leading-relaxed shadow-inner">
                        <small className="opacity-60 font-black uppercase tracking-wider block text-[9px] mb-0.5 select-none">הודעה אישית פעילה באוויר:</small>
                        <span>"{currentMain.content}"</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Form Action Controls Payload Input Block Box */}
                  <div className="flex items-center gap-3 w-full lg:w-auto lg:max-w-md flex-1">
                    <input
                      type="text"
                      placeholder={`הודעה חדשה ל${trainee.first_name}...`}
                      value={personalMessages[trainee.id] || ''}
                      onChange={(e) => setPersonalMessages({
                        ...personalMessages,
                        [trainee.id]: e.target.value
                      })}
                      className="flex-1 bg-white border border-zinc-100 rounded-xl px-5 py-3.5 text-sm font-bold text-zinc-900 outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all shadow-inner placeholder:text-zinc-300"
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdatePersonalMessage(trainee.id)}
                      disabled={isSubmitting || !personalMessages[trainee.id]?.trim()}
                      className="bg-blue-600 text-white font-black text-xs uppercase tracking-widest px-6 py-4 rounded-xl shadow-lg shadow-blue-500/10 transition-all active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed hover:bg-blue-700 shrink-0 border border-blue-600"
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

export default CoachMessageManager;