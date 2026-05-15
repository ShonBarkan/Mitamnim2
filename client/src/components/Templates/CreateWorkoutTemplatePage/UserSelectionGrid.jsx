import React, { useEffect } from 'react';
import { useUsers } from '../../../hooks/useUsers';
import { useAuth } from '../../../hooks/useAuth';

/**
 * UserSelectionGrid Component - Interactive grid for assigning workouts to athletes.
 * Featuring Arctic Mirror aesthetic, profile pictures, and bulk actions.
 */
const UserSelectionGrid = ({ selectedUserIds, onChange }) => {
  const { user: currentUser } = useAuth();
  const { users, refreshUsers } = useUsers();

  // Sync group members on mount
  useEffect(() => {
    if (currentUser?.group_id) refreshUsers(currentUser.group_id);
  }, [currentUser, refreshUsers]);

  // Filter only trainees for selection (coaches/admins aren't targets for templates)
  const trainees = users.filter(u => u.role === 'trainee');

  /**
   * Toggles an individual user's selection status.
   */
  const toggleUser = (userId) => {
    if (selectedUserIds.includes(userId)) {
      onChange(selectedUserIds.filter(id => id !== userId));
    } else {
      onChange([...selectedUserIds, userId]);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Bulk Action Controls */}
      <div className="flex gap-3">
        <button 
          type="button" 
          onClick={() => onChange(trainees.map(u => u.id))}
          className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-zinc-900/20 active:scale-95 transition-all"
        >
          בחר את כולם
        </button>
        <button 
          type="button" 
          onClick={() => onChange([])}
          className="px-5 py-2.5 bg-white/60 text-zinc-400 hover:text-zinc-900 border border-white/80 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
        >
          נקה בחירה
        </button>
      </div>

      {/* Trainee Selection Grid */}
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
              {/* Profile Picture with Selection Indicator */}
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
                    {u.first_name?.[0]?.toUpperCase()}
                  </div>
                )}
                
                {/* Visual Checkmark */}
                {isSelected && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] shadow-lg animate-in zoom-in duration-300">
                    ✓
                  </div>
                )}
              </div>

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

      {/* Empty State / Default Logic Notification */}
      {trainees.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed border-white/40 rounded-[2.5rem] bg-white/20">
          <p className="text-zinc-400 font-bold text-xs uppercase tracking-widest italic">אין מתאמנים רשומים בקבוצה.</p>
        </div>
      ) : selectedUserIds.length === 0 && (
        <div className="flex items-center gap-3 p-4 bg-zinc-900/5 rounded-2xl border border-zinc-900/10">
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