import React from 'react';

const TrainerSidebar = ({ activeUser, users, selectedUserId, setSelectedUserId }) => {
  return (
    <aside className="w-72 bg-white border-l border-gray-200 overflow-y-auto flex flex-col shadow-sm z-10">
      <div className="p-4 border-b border-gray-100 bg-gray-50 sticky top-0">
        <h2 className="text-lg font-bold text-gray-800">המתאמנים שלי</h2>
      </div>
      <div className="flex flex-col p-2 gap-1">
        <button
          onClick={() => setSelectedUserId(activeUser.id)}
          className={`flex items-center gap-3 p-3 rounded-lg transition-colors text-right ${selectedUserId === activeUser.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}`}
        >
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
            שלי
          </div>
          <div>
            <p className="font-semibold text-gray-800">האימונים שלי</p>
            <p className="text-xs text-gray-500">צפייה אישית</p>
          </div>
        </button>

        {Array.isArray(users) && users.map((u) => (
          <button
            key={u.id}
            onClick={() => setSelectedUserId(u.id)}
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
