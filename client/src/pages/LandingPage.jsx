import React, { useState, useEffect, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useUsers } from '../hooks/useUsers';
import { MessageContext } from '../contexts/MessageContext';

// Components
import PersonalInfo from '../components/LandingPage/PersonalInfo';
import MainBanners from '../components/LandingPage/MainBanners';
import MessageFeed from '../components/MessageFeed';
import ParameterManager from '../components/Parameters/ParameterManager';
import ExerciseTreeManager from '../components/Exercises/ExerciseTreeManager';
import ActivityCreator from '../components/Activity/ActivityCreator';

const LandingPage = () => {
  const { user } = useAuth();
  const { refreshUsers } = useUsers();
  const { mainMessages, fetchMainMessages } = useContext(MessageContext);

  // --- UI State ---
  const [isAddLogOpen, setIsAddLogOpen] = useState(false);

  const isTrainer = user?.role === 'trainer' || user?.role === 'admin';

  // --- Sync Data ---
  useEffect(() => {
    if (user?.group_id) {
      refreshUsers(user.group_id);
    }
    fetchMainMessages();
  }, [user, refreshUsers, fetchMainMessages]);

  return (
    <div style={{ direction: 'rtl', padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      
      {/* --- HEADER --- */}
      <header style={{ 
        marginBottom: '20px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid #f0f0f0',
        paddingBottom: '15px'
      }}>
        <h1 style={{ margin: 0 }}>
          שלום, {user?.first_name || user?.username} 👋
        </h1>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setIsAddLogOpen(true)}
            style={{ 
              backgroundColor: '#28a745', 
              color: 'white', 
              border: 'none', 
              padding: '12px 25px', 
              borderRadius: '50px', 
              fontWeight: 'bold', 
              cursor: 'pointer', 
              boxShadow: '0 4px 12px rgba(40, 167, 69, 0.25)' 
            }}
          >
            ➕ תיעוד אימון מהיר
          </button>
        </div>
      </header>

      {/* --- DASHBOARD CONTENT --- */}
      <PersonalInfo user={user} />
      <MainBanners mainMessages={mainMessages} />

      <hr style={{ margin: '40px 0', border: '0', borderTop: '1px solid #eee' }} />

      {/* --- ANNOUNCEMENT BOARD ONLY --- */}
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <MessageFeed 
          title="📢 לוח מודעות קבוצתי" 
          targetId={user?.group_id} 
          type="general" 
          currentUserId={user?.id} 
          userRole={user?.role} 
        />
      </div>

      {/* --- QUICK LOG MODAL --- */}
      {isAddLogOpen && (
        <div style={{ 
          position: 'fixed', 
          top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.7)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 2000, 
          backdropFilter: 'blur(8px)' 
        }}>
          <div style={{ width: '95%', maxWidth: '500px', position: 'relative' }}>
            <button 
              onClick={() => setIsAddLogOpen(false)} 
              style={{ 
                position: 'absolute', top: '-45px', left: '0', 
                background: 'none', border: 'none', color: 'white', 
                fontSize: '20px', cursor: 'pointer', fontWeight: 'bold' 
              }}
            >
              ✕ סגור חלונית
            </button>
            <ActivityCreator onComplete={() => setIsAddLogOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;