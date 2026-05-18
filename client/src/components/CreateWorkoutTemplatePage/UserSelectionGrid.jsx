import React, { useEffect, useRef, useContext } from 'react';
import { UserContext } from '../../contexts/UserContext';
import { useAuth } from '../../contexts/AuthContext';
import FrontendLogger from '../../utils/logger';

/**
 * UserSelectionGrid Component - Handles targeted trainee distribution mappings.
 * Refactored: Automatically selects all group trainees by default upon initialization.
 * Implements Arctic Mirror glassmorphism styles and strict English-only code commentary.
 */
const UserSelectionGrid = ({ selectedUserIds = [], onChange }) => {
  const { user: currentUser } = useAuth();
  const { users, refreshUsers } = useContext(UserContext);
  
  // Ref tracker to ensure auto-selection runs exactly once upon initial cache hydration
  const isInitialSync = useRef(true);

  // Sync group members on component mount lifecycle
  useEffect(() => {
    if (currentUser?.group_id) {
      FrontendLogger.info('USER_SELECTION_GRID', `Syncing squad users cluster map for group index ID: ${currentUser.group_id}`);
      refreshUsers(currentUser.group_id);
    }
  }, [currentUser, refreshUsers]);

  // Isolate active trainee profiles out of the generic group users pool
  const trainees = users.filter(u => u.role === 'trainee');

  /**
   * Safe Context Trigger Effect: Automatically signs up all active group trainees 
   * by default on creation mode, while safely preserving explicit edit-mode records.
   */
  useEffect(() => {
    if (trainees.length > 0 && isInitialSync.current) {
      if (selectedUserIds.length === 0) {
        FrontendLogger.info('USER_SELECTION_GRID', 'Applying absolute group auto-selection safety default rules');
        onChange(trainees.map(u => u.id));
      }
      isInitialSync.current = false; // Close initialization gateway permanently for this mount lifecycle
    }
  }, [trainees, selectedUserIds, onChange]);

  /**
   * Alternates individual trainee tracking status keys arrays.
   */
  const toggleUser = (userId) => {
    FrontendLogger.info('USER_SELECTION_GRID', `Toggling selection context boundary vector for user index ID: ${userId}`);
    if (selectedUserIds.includes(userId)) {
      onChange(selectedUserIds.filter(id => id !== userId));
    } else {
      onChange([...selectedUserIds, userId]);
    }
  };

  const handleSelectAll = () => {
    FrontendLogger.info('USER_SELECTION_GRID', 'Executing bulk global select action on all squad trainees parameters');
    onChange(trainees.map(u => u.id));
  };

  const handleClearAll = () => {
    FrontendLogger.info('USER_SELECTION_GRID', 'Purging selected user mapping constraints cache registry');
    onChange([]);
  };

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Bulk Global Action Modifier Suite */}
      <div className="flex gap-3">
        <button 
          type="button" 
          onClick={handleSelectAll}
          className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-zinc-900/20 active:scale-95 transition-all"
        >
          בחר את כולם
        </button>
        <button 
          type="button" 
          onClick={handleClearAll}
          className="px-5 py-2.5 bg-white/60 text-zinc-400 hover:text-zinc-900 border border-white/80 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
        >
          נקה בחירה
        </button>
      </div>

      {/* Trainee Presentation Interactive Grid Core */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {trainees.map(u => {
          const isSelected = selectedUserIds.includes(u.id);
          return (
            <div 
              key={u.id}
              onClick={() => toggleUser(u.id)}
              className={`relative p-5 rounded-[2rem] border transition-all duration-500 cursor-pointer group flex flex-col items-center gap-3 text-center ${
                isSelected 
                  ? 'bg-blue-600/10 border-blue-500/50 shadow-xl shadow-blue-500/10 scale-105' 
                  : 'bg-white/40 border-white/60 hover:bg-white/60'
              }`}
            >
              {/* Profile Image with Dynamic Context Badging Borders */}
              <div className="relative">
                {u.profile_picture ? (
                  <img 
                    src={u.profile_picture} 
                    alt={u.username} 
                    className={`w-16 h-16 rounded-2xl object-cover border-2 shadow-md transition-all ${
                      isSelected ? 'border-blue-500' : 'border-white'
                    }`} 
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center text-white text-lg font-black border-2 border-white shadow-md">
                    {u.first_name?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                
                {/* Floating Checkmark Stamp Badge */}
                {isSelected && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] shadow-lg animate-in zoom-in duration-300">
                    ✓
                  </div>
                )}
              </div>

              {/* Textual Identity Mappings Block */}
              <div className="space-y-0.5">
                <div className={`text-sm font-black transition-colors ${isSelected ? 'text-blue-700' : 'text-zinc-900'}`}>
                  {u.first_name} {u.second_name}
                </div>
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">
                  @{u.username}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State and Default System Status Notice Banners */}
      {trainees.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed border-white/40 rounded-[2.5rem] bg-white/20">
          <p className="text-zinc-400 font-black text-xs uppercase tracking-widest italic">אין מתאמנים רשומים בקבוצה זו.</p>
        </div>
      ) : selectedUserIds.length === 0 && (
        <div className="flex items-center gap-3 p-4 bg-zinc-900/5 rounded-2xl border border-zinc-900/10 animate-in fade-in duration-300">
          <span className="text-lg">📢</span>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
            לא נבחרו מתאמנים - האימון ישויך לכל הקבוצה כברירת מחדל.
          </p>
        </div>
      )}
    </div>
  );
};

export default UserSelectionGrid;