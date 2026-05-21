import React from 'react';
import FrontendLogger from '../../utils/logger';

/**
 * Grid component for selecting users to be assigned to templates.
 * Provides bulk selection and individual toggling capabilities.
 */
const UserSelectionGrid = ({ users = [], selectedIds = [], onChange }) => {
  
  const isAllSelected = users.length > 0 && selectedIds.length === users.length;

  const toggleAll = () => {
    if (isAllSelected) {
      FrontendLogger.info('USER_GRID', 'Unselecting all users');
      onChange([]);
    } else {
      FrontendLogger.info('USER_GRID', `Selecting all ${users.length} users`);
      onChange(users.map(u => u.id));
    }
  };

  const toggleUser = (userId) => {
    const next = selectedIds.includes(userId)
      ? selectedIds.filter(id => id !== userId)
      : [...selectedIds, userId];
    
    FrontendLogger.info('USER_GRID', `Toggled user ID: ${userId}`);
    onChange(next);
  };

  if (!users || users.length === 0) {
    return (
      <div className="p-4 text-center text-zinc-400 text-xs font-bold italic">
        לא נמצאו משתמשים לשיוך
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
          משתמשים משויכים ({selectedIds.length}/{users.length})
        </label>
        <button 
          type="button"
          onClick={toggleAll}
          className="text-[10px] font-black uppercase text-cyan-700 hover:text-cyan-900 transition-colors"
        >
          {isAllSelected ? 'בטל הכל' : 'סמן הכל'}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {users.map(user => (
          <button
            key={user.id}
            type="button"
            onClick={() => toggleUser(user.id)}
            className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
              selectedIds.includes(user.id)
                ? 'bg-zinc-900 text-white border-zinc-900 shadow-md'
                : 'bg-white border-zinc-200 hover:border-zinc-300'
            }`}
          >
            <img 
              src={user.profile_picture || '/default-avatar.png'} 
              alt={`${user.first_name} ${user.second_name}`}
              className="w-8 h-8 rounded-full bg-zinc-200 object-cover"
              onError={(e) => { e.target.src = '/default-avatar.png'; }}
            />
            <div className="text-right overflow-hidden">
              <p className="text-xs font-bold truncate">{user.first_name} {user.second_name}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default UserSelectionGrid;