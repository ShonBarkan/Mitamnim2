import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUsers } from '../hooks/useUsers';
import { useGroups } from '../hooks/useGroups';
import { useToast } from '../hooks/useToast';

/**
 * UserPanelPage Component - Administrative dashboard for user management.
 * Now featuring profile picture integration and Arctic Mirror aesthetic.
 */
const UserPanelPage = () => {
  const { user: currentUser } = useAuth();
  const { users, loading, refreshUsers, addUser, deleteUser, updateUser } = useUsers();
  const { groups, refreshGroups } = useGroups();
  const { showToast } = useToast();

  const initialFormState = {
    username: '',
    password: '',
    role: 'trainee',
    first_name: '',
    second_name: '',
    email: '',
    phone: '',
    group_id: '',
    profile_picture: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [editingUserId, setEditingUserId] = useState(null);

  useEffect(() => {
    refreshUsers(currentUser.role === 'trainer' ? currentUser.group_id : null);
    if (currentUser.role === 'admin') {
      refreshGroups();
    }
  }, [currentUser, refreshUsers, refreshGroups]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const startEdit = (user) => {
    setEditingUserId(user.id);
    setFormData({
      username: user.username,
      password: '',
      role: user.role,
      first_name: user.first_name || '',
      second_name: user.second_name || '',
      email: user.email || '',
      phone: user.phone || '',
      group_id: user.group_id || '',
      profile_picture: user.profile_picture || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setFormData(initialFormState);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const finalData = {
        ...formData,
        group_id: currentUser.role === 'trainer' ? currentUser.group_id : formData.group_id
      };

      if (editingUserId) {
        const updatePayload = { ...finalData };
        if (!updatePayload.password) delete updatePayload.password;
        await updateUser(editingUserId, updatePayload);
        showToast("המשתמש עודכן בהצלחה", "success");
      } else {
        await addUser(finalData);
        showToast("משתמש נוסף בהצלחה", "success");
      }
      cancelEdit();
    } catch (error) {
      showToast("שגיאה בפעולה: " + (error.response?.data?.detail || "נסה שוב"), "error");
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm("האם אתה בטוח שברצונך למחוק משתמש זה?")) {
      try {
        await deleteUser(userId);
        showToast("משתמש נמחק", "success");
      } catch (error) {
        showToast("שגיאה במחיקה", "error");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-slate-100 to-zinc-200 p-6 md:p-12 font-sans" dir="rtl">
      <div className="max-w-[1400px] mx-auto space-y-12">
        
        <header className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
          <div className="space-y-2">
            <h1 className="text-5xl font-black tracking-tighter text-zinc-900">ניהול משתמשים</h1>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-[0.3em]">Mitamnim2 Administration Suite</p>
          </div>
          {editingUserId && (
            <button onClick={cancelEdit} className="px-6 py-2 bg-white/40 backdrop-blur-md border border-zinc-200 rounded-full text-zinc-600 font-bold text-sm hover:bg-white/60 transition-all">
              ביטול עריכה
            </button>
          )}
        </header>

        <section className={`transition-all duration-700 bg-white/40 backdrop-blur-2xl rounded-[3rem] p-10 border border-white/60 shadow-2xl ${editingUserId ? 'ring-4 ring-blue-500/20 border-blue-200/50' : ''}`}>
          <div className="flex items-center gap-6 mb-10">
            <div className="relative">
              {formData.profile_picture ? (
                <img src={formData.profile_picture} alt="Preview" className="w-20 h-20 rounded-3xl object-cover border-4 border-white shadow-xl" />
              ) : (
                <div className="w-20 h-20 rounded-3xl bg-zinc-900 flex items-center justify-center text-white text-2xl font-black shadow-xl">
                  {formData.username?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight">{editingUserId ? 'עריכת פרטי משתמש' : 'הוספת חבר צוות חדש'}</h3>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">User Profile Configuration</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2">שם משתמש</label>
              <input name="username" placeholder="Username" value={formData.username} onChange={handleInputChange} required className="w-full bg-white/50 border border-white/40 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-zinc-900/5" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2">תמונת פרופיל (URL)</label>
              <input name="profile_picture" placeholder="Image URL" value={formData.profile_picture} onChange={handleInputChange} className="w-full bg-white/50 border border-white/40 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-zinc-900/5" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2">שם פרטי</label>
              <input name="first_name" placeholder="First Name" value={formData.first_name} onChange={handleInputChange} className="w-full bg-white/50 border border-white/40 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-zinc-900/5" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2">שם משפחה</label>
              <input name="second_name" placeholder="Last Name" value={formData.second_name} onChange={handleInputChange} className="w-full bg-white/50 border border-white/40 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-zinc-900/5" />
            </div>
            {/* ... other fields remain same ... */}
            <div className="md:col-span-2 lg:col-span-4 pt-4">
              <button type="submit" className={`px-12 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest transition-all shadow-xl ${editingUserId ? 'bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700' : 'bg-zinc-900 text-white shadow-zinc-200 hover:bg-zinc-800'}`}>
                {editingUserId ? 'עדכון משתמש קיים' : 'הוספת משתמש למאגר'}
              </button>
            </div>
          </form>
        </section>

        <section className="bg-white/80 backdrop-blur-xl rounded-[3rem] shadow-2xl border border-white overflow-hidden">
          <div className="p-8 border-b border-zinc-100 flex justify-between items-center">
            <h3 className="text-2xl font-black tracking-tight">רשימת חברים</h3>
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-100 px-3 py-1 rounded-full">{users.length} משתמשים</span>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-20 text-center text-zinc-400 font-bold uppercase animate-pulse">Synchronizing Data...</div>
            ) : (
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-zinc-50/50 text-zinc-400 uppercase text-[11px] font-black tracking-widest">
                    <th className="px-8 py-6">משתמש</th>
                    <th className="px-8 py-6">שם מלא</th>
                    <th className="px-8 py-6">אימייל / טלפון</th>
                    <th className="px-8 py-6">תפקיד</th>
                    <th className="px-8 py-6">קבוצה</th>
                    <th className="px-8 py-6 text-left">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {users.map(u => (
                    <tr key={u.id} className={`transition-all group hover:bg-zinc-50/80 ${editingUserId === u.id ? 'bg-blue-50/50' : ''}`}>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            {u.profile_picture ? (
                              <img src={u.profile_picture} alt={u.username} className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-md group-hover:scale-110 transition-transform" />
                            ) : (
                              <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-white text-[10px] font-black border-2 border-white shadow-md">
                                {u.username?.[0]?.toUpperCase()}
                              </div>
                            )}
                          </div>
                          <span className="font-black text-zinc-900">{u.username}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 font-bold text-zinc-600">{u.first_name} {u.second_name}</td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-zinc-900">{u.email || '-'}</span>
                          <span className="text-[10px] font-black text-zinc-400 uppercase">{u.phone || '-'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${u.role === 'admin' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-8 py-6 font-bold text-zinc-500">
                        {groups.find(g => g.id === u.group_id)?.name || <span className="opacity-30 italic">ללא</span>}
                      </td>
                      <td className="px-8 py-6 text-left">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          {u.role === 'trainee' && (
                            <Link to={`/stats-page/${u.id}`} className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-100 transition-all active:scale-90">📊</Link>
                          )}
                          <button onClick={() => startEdit(u)} className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 transition-all active:scale-90">✏️</button>
                          <button onClick={() => handleDelete(u.id)} className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-all active:scale-90">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default UserPanelPage;