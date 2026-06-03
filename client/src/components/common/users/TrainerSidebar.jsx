import React, { useState, useMemo } from 'react';

const TrainerSidebar = ({ activeUser, activeUserId, users = [], selectedUserId, setSelectedUserId, onUserSelect }) => {
  const activeId = activeUser?.id ?? activeUserId;
  const [searchTerm, setSearchTerm] = useState('');

  // Memoized filtering logic for user search
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;

    const lowerSearchTerm = searchTerm.toLowerCase();
    return users.filter(u => 
      u.first_name.toLowerCase().includes(lowerSearchTerm) ||
      u.second_name.toLowerCase().includes(lowerSearchTerm) ||
      u.username.toLowerCase().includes(lowerSearchTerm)
    );
  }, [users, searchTerm]);

  const handleSelect = (id) => {
    if (typeof onUserSelect === 'function') {
      onUserSelect({ id });
    } else if (typeof setSelectedUserId === 'function') {
      setSelectedUserId(id);
    }
  };

  return (
    <aside className="w-72 bg-white border-l border-gray-200 overflow-y-auto flex flex-col shadow-sm z-10">
      <div className="p-4 border-b border-gray-100 bg-gray-50 sticky top-0">
        <h2 className="text-lg font-bold text-gray-800">המתאמנים שלי</h2>
      </div>

      {/* Search input for filtering users */}
      <div className="p-3 border-b border-gray-100">
        <div className="relative">
          <input
            type="text"
            placeholder="חיפוש לפי שם..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 transition-all"
          />
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">🔍</span>
        </div>
      </div>

      <div className="flex flex-col p-2 gap-1">
        <button
          onClick={() => activeId && handleSelect(activeId)}
          disabled={!activeId}
          className={`flex items-center gap-3 p-3 rounded-lg transition-colors text-right ${selectedUserId === activeId ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}`}
        >
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
            שלי
          </div>
          <div>
            <p className="font-semibold text-gray-800">האימונים שלי</p>
            <p className="text-xs text-gray-500">צפייה אישית</p>
          </div>
        </button>

        {Array.isArray(filteredUsers) && filteredUsers.map((u) => (
          <button
            key={u.id}
            onClick={() => handleSelect(u.id)}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors text-right ${selectedUserId === u.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}`}
          >
            <img
              src={u.profile_picture || `https://ui-avatars.com/api/?name=${u.first_name}+${u.second_name}&background=random&rounded=true`}
              alt={u.first_name}
              className="w-10 h-10 rounded-full object-cover border border-gray-200"
            />
            <div>
              <p className="font-semibold text-gray-800">{u.first_name} {u.second_name}</p>
              <p className="text-xs text-gray-500">@{u.username}</p>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
};

export default TrainerSidebar;
