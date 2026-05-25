import React from 'react';

const TemplateUserSelector = ({ users, assignedUserIds, setFormData, toggleUserSelection }) => (
  <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
    <div className="flex justify-between items-center">
      <h2 className="text-sm font-black uppercase text-zinc-400 tracking-widest">3. שיוך למתאמנים</h2>
      <div className="flex gap-2">
        <button type="button" onClick={() => {
            setFormData(prev => ({...prev, assigned_user_ids: users.map(u => u.id)}));
          }} className="text-[10px] font-bold bg-zinc-100 px-3 py-1 rounded hover:bg-zinc-200">בחר הכל</button>
        <button type="button" onClick={() => {
            setFormData(prev => ({...prev, assigned_user_ids: []}));
          }} className="text-[10px] font-bold bg-red-50 text-red-600 px-3 py-1 rounded hover:bg-red-100">נקה הכל</button>
      </div>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {users.map(u => {
        const isSelected = Array.isArray(assignedUserIds) && assignedUserIds.includes(u.id);
        return (
          <button key={u.id} type="button" onClick={() => toggleUserSelection(u.id)} className={`flex flex-col items-center p-3 rounded-2xl border transition-all ${isSelected ? 'border-zinc-900 bg-zinc-50 shadow-md' : 'border-transparent hover:bg-zinc-50 opacity-60 hover:opacity-100'}`}>
            <div className="w-12 h-12 rounded-full bg-zinc-200 mb-2 overflow-hidden">
              {u.profile_picture ? <img src={u.profile_picture} alt={u.username} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-zinc-400 font-bold text-xs">{u.first_name?.[0]}</div>}
            </div>
            <span className="text-[10px] font-black text-center">{u.first_name} {u.second_name}</span>
          </button>
        );
      })}
    </div>
  </div>
);

export default TemplateUserSelector;
