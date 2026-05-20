import React from 'react';
import FrontendLogger from '../../utils/logger';

const UserSelectionGrid = ({ users, selectedIds, onChange }) => {
  
  const isAllSelected = users.length > 0 && selectedIds.length === users.length;

  const toggleAll = () => {
    if (isAllSelected) {
      onChange([]); // Unselect all
      FrontendLogger.info('USER_GRID', 'Unselected all users');
    } else {
      onChange(users.map(u => u.id)); // Select all
      FrontendLogger.info('USER_GRID', 'Selected all users');
    }
  };

  const toggleUser = (userId) => {
    const next = selectedIds.includes(userId)
      ? selectedIds.filter(id => id !== userId)
      : [...selectedIds, userId];
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">משתמשים משויכים ({selectedIds.length}/{users.length})</label>
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
                ? 'bg-zinc-900 text-white border-zinc-900'
                : 'bg-white border-zinc-200 hover:border-zinc-300'
            }`}
          >
            <img 
              src={user.profile_picture || '/default-avatar.png'} 
              alt={user.first_name}
              className="w-8 h-8 rounded-full bg-zinc-200"
            />
            <div className="text-right">
              <p className="text-xs font-bold truncate">{user.first_name} {user.second_name}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default UserSelectionGrid;