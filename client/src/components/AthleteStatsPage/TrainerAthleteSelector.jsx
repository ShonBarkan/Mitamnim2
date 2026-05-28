import React, { useState, useMemo } from 'react';
import { Check, Users, User as UserIcon, Search, X } from 'lucide-react';

const TrainerAthleteSelector = ({ users, selectedUsers, setSelectedUsers }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const trainees = useMemo(() => {
    return users.filter((u) => u.role === 'trainee' || u.role === 'athlete' || u.role === 'trainer');
  }, [users]);

  const filteredTrainees = useMemo(() => {
    return trainees.filter(user => {
      const fullName = `${user.first_name || ''} ${user.last_name || user.second_name || ''}`.toLowerCase();
      return fullName.includes(searchQuery.toLowerCase());
    });
  }, [trainees, searchQuery]);

  const toggleUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const selectAll = () => {
    setSelectedUsers(trainees.map((u) => u.id));
  };

  const clearSelection = () => {
    setSelectedUsers([]);
  };

  return (
    <div className="mb-8 space-y-4" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/40 p-4 rounded-3xl border border-zinc-800">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-green-500" />
            בחר מתאמנים להשוואה
          </h2>
          <span className="px-3 py-1 rounded-full bg-zinc-800 text-xs font-bold text-zinc-300">
            {selectedUsers.length} מתוך {trainees.length} נבחרו
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={selectAll}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold transition-colors"
          >
            בחר הכל
          </button>
          <button
            onClick={clearSelection}
            disabled={selectedUsers.length === 0}
            className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 disabled:opacity-50 text-sm font-bold transition-colors"
          >
            נקה בחירה
          </button>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-zinc-500" />
        </div>
        <input
          type="text"
          placeholder="חפש מתאמן לפי שם..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-3 pr-12 pl-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 left-4 flex items-center text-zinc-500 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 max-h-80 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#3f3f46 transparent' }}>
        {filteredTrainees.map((user) => {
          const isSelected = selectedUsers.includes(user.id);
          return (
            <button
              key={user.id}
              onClick={() => toggleUser(user.id)}
              className={`
                relative flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200
                ${isSelected 
                  ? 'bg-green-500/10 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.1)]' 
                  : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50'
                }
              `}
            >
              <div className="relative mb-3">
                {user.profile_picture ? (
                  <img src={user.profile_picture} alt={user.first_name} className="w-14 h-14 rounded-full object-cover border-2 border-zinc-800" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-xl font-black text-zinc-400">
                    {user.first_name?.charAt(0) || <UserIcon className="w-6 h-6" />}
                  </div>
                )}
                {isSelected && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-zinc-900">
                    <Check className="w-3 h-3 text-black font-bold" />
                  </div>
                )}
              </div>
              <span className={`text-sm font-bold text-center truncate w-full ${isSelected ? 'text-white' : 'text-zinc-400'}`}>
                {user.first_name} {user.last_name || user.second_name}
              </span>
            </button>
          );
        })}
        
        {filteredTrainees.length === 0 && (
          <div className="col-span-full py-8 text-center text-zinc-500 bg-zinc-900/30 rounded-2xl border border-zinc-800/50">
            לא נמצאו מתאמנים התואמים את החיפוש
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainerAthleteSelector;