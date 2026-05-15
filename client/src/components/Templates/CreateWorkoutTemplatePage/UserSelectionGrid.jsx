import React, { useEffect } from 'react';
import { useUsers } from '../../../hooks/useUsers';
import { useAuth } from '../../../hooks/useAuth';

const UserSelectionGrid = ({ selectedUserIds, onChange }) => {
  const { user: currentUser } = useAuth();
  const { users, refreshUsers } = useUsers();

  useEffect(() => {
    if (currentUser?.group_id) refreshUsers(currentUser.group_id);
  }, [currentUser]);

  const trainees = users.filter(u => u.role === 'trainee');

  const toggleUser = (userId) => {
    if (selectedUserIds.includes(userId)) {
      onChange(selectedUserIds.filter(id => id !== userId));
    } else {
      onChange([...selectedUserIds, userId]);
    }
  };

  return (
    <div dir="rtl">
      <div className="flex gap-2 mb-4">
        <button 
          type="button" 
          onClick={() => onChange(trainees.map(u => u.id))}
          className="px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-bold hover:bg-zinc-800 transition-colors shadow-sm"
        >
          בחר את כולם
        </button>
        <button 
          type="button" 
          onClick={() => onChange([])}
          className="px-3 py-1.5 bg-white text-zinc-600 border border-zinc-200 rounded-lg text-xs font-bold hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-sm"
        >
          נקה בחירה
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {trainees.map(u => {
          const isSelected = selectedUserIds.includes(u.id);
          return (
            <div 
              key={u.id}
              onClick={() => toggleUser(u.id)}
              className={`p-3 rounded-xl border-2 cursor-pointer transition-all text-center flex flex-col items-center justify-center min-h-[80px] shadow-sm ${
                isSelected 
                  ? 'border-zinc-900 bg-zinc-900 text-white' 
                  : 'border-zinc-100 bg-white text-zinc-900 hover:border-zinc-300'
              }`}
            >
              <div className="font-bold text-sm leading-tight">{u.first_name} {u.second_name}</div>
              <div className={`text-xs mt-1 ${isSelected ? 'text-zinc-300' : 'text-zinc-500'}`}>{u.username}</div>
            </div>
          );
        })}
      </div>
      {trainees.length === 0 && <p className="text-zinc-500 text-sm mt-4 font-medium">אין מתאמנים רשומים בקבוצה.</p>}
    </div>
  );
};

export default UserSelectionGrid;