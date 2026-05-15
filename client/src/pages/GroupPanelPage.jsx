import React, { useState, useEffect } from 'react';
import { useGroups } from '../hooks/useGroups';
import { useToast } from '../hooks/useToast';

/**
 * GroupPanelPage Component - Admin dashboard for managing athletic groups.
 * Implements the "Arctic Mirror" design language with Glassmorphism.
 */
const GroupPanelPage = () => {
  const { groups, loading, refreshGroups, addGroup, deleteGroup, updateGroup } = useGroups();
  const { showToast } = useToast();

  const [groupName, setGroupName] = useState('');
  const [groupImage, setGroupImage] = useState('');
  const [editingGroupId, setEditingGroupId] = useState(null);

  // Fetch groups on component mount
  useEffect(() => {
    refreshGroups();
  }, [refreshGroups]);

  /**
   * Pre-fills the form to enter Edit Mode.
   */
  const startEdit = (group) => {
    setEditingGroupId(group.id);
    setGroupName(group.name);
    setGroupImage(group.group_image || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Resets the form and returns to Create Mode.
   */
  const cancelEdit = () => {
    setEditingGroupId(null);
    setGroupName('');
    setGroupImage('');
  };

  /**
   * Handles Form Submission (Create or Update).
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName) {
      showToast("אנא הזן שם לקבוצה", "error");
      return;
    }

    try {
      if (editingGroupId) {
        await updateGroup(editingGroupId, { 
          name: groupName, 
          group_image: groupImage || null 
        });
        showToast("הקבוצה עודכנה בהצלחה", "success");
      } else {
        await addGroup({ 
          name: groupName, 
          group_image: groupImage || null 
        });
        showToast("קבוצה נוצרה בהצלחה", "success");
      }
      cancelEdit(); 
    } catch (error) {
      const errMsg = error.response?.data?.detail || "נסה שוב";
      showToast("שגיאה בפעולה: " + errMsg, "error");
    }
  };

  /**
   * Handles Group Deletion with a safety confirmation.
   */
  const handleDeleteGroup = async (groupId) => {
    if (window.confirm("האם אתה בטוח? מחיקת קבוצה עלולה להשפיע על המשתמשים המשויכים אליה.")) {
      try {
        await deleteGroup(groupId);
        showToast("קבוצה נמחקה", "success");
        if (editingGroupId === groupId) cancelEdit();
      } catch (error) {
        showToast("שגיאה במחיקה", "error");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-slate-100 via-zinc-100 to-blue-100 p-6 md:p-12 font-sans" dir="rtl">
      <div className="max-w-[1400px] mx-auto space-y-12">
        
        {/* Header Section */}
        <header className="space-y-2">
          <h1 className="text-5xl font-black tracking-tighter text-zinc-900">ניהול קבוצות</h1>
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-[0.4em]">Global Organization Management</p>
        </header>

        {/* Dynamic Action Card (Create/Edit) */}
        <section className={`bg-white/40 backdrop-blur-2xl rounded-[3rem] p-10 border border-white/60 shadow-2xl transition-all duration-500 ${editingGroupId ? 'ring-4 ring-orange-500/20 border-orange-200/50' : ''}`}>
          <div className="flex items-center gap-4 mb-8">
            <div className={`w-3 h-3 rounded-full animate-pulse ${editingGroupId ? 'bg-orange-500' : 'bg-blue-600'}`} />
            <h3 className="text-2xl font-black tracking-tight">
              {editingGroupId ? 'עריכת קבוצה קיימת' : 'הקמת קבוצה חדשה'}
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row items-end gap-6">
            <div className="flex-1 w-full space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-4">שם הקבוצה</label>
              <input 
                type="text" 
                placeholder="Group Name" 
                value={groupName} 
                onChange={(e) => setGroupName(e.target.value)} 
                className="w-full bg-white/50 border border-white/40 rounded-2xl px-8 py-5 text-sm font-bold outline-none focus:ring-8 focus:ring-zinc-900/5 transition-all"
              />
            </div>
            
            <div className="flex-1 w-full space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-4">קישור ללוגו / תמונה</label>
              <input 
                type="text" 
                placeholder="Image URL (Optional)" 
                value={groupImage} 
                onChange={(e) => setGroupImage(e.target.value)} 
                className="w-full bg-white/50 border border-white/40 rounded-2xl px-8 py-5 text-sm font-bold outline-none focus:ring-8 focus:ring-zinc-900/5 transition-all"
              />
            </div>

            <div className="flex gap-3">
              <button 
                type="submit" 
                className={`px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl active:scale-95 ${
                  editingGroupId ? 'bg-orange-500 text-white shadow-orange-200 hover:bg-orange-600' : 'bg-zinc-900 text-white shadow-zinc-200 hover:bg-zinc-800'
                }`}
              >
                {editingGroupId ? 'עדכון' : 'צור קבוצה'}
              </button>
              
              {editingGroupId && (
                <button 
                  type="button" 
                  onClick={cancelEdit} 
                  className="px-8 py-5 bg-white/60 backdrop-blur-md rounded-2xl text-zinc-500 font-bold text-sm hover:bg-white/80 transition-all"
                >
                  ביטול
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Groups Directory Table */}
        <section className="bg-white/70 backdrop-blur-3xl rounded-[3rem] shadow-2xl border border-white overflow-hidden">
          <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-white/40">
            <h3 className="text-2xl font-black tracking-tight text-zinc-900">רשימת קבוצות פעילות</h3>
            <span className="bg-zinc-900 text-white text-[10px] px-4 py-1.5 rounded-full font-black uppercase tracking-widest">
              {groups.length} Groups Total
            </span>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-20 text-center">
                <div className="inline-block w-8 h-8 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin mb-4" />
                <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Synchronizing Data...</p>
              </div>
            ) : (
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-zinc-50/50 text-zinc-400 uppercase text-[11px] font-black tracking-[0.2em]">
                    <th className="px-10 py-6 text-center">Identity</th>
                    <th className="px-10 py-6">Group Name</th>
                    <th className="px-10 py-6">System Identifier (UUID)</th>
                    <th className="px-10 py-6">Registration Date</th>
                    <th className="px-10 py-6 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {groups.map((group) => (
                    <tr key={group.id} className={`group transition-all hover:bg-white/60 ${editingGroupId === group.id ? 'bg-orange-50/50' : ''}`}>
                      <td className="px-10 py-6 flex justify-center">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-zinc-100 border-2 border-white shadow-inner flex items-center justify-center">
                          {group.group_image ? (
                            <img src={group.group_image} alt={group.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                          ) : (
                            <span className="text-[10px] font-black text-zinc-300 uppercase">No IMG</span>
                          )}
                        </div>
                      </td>
                      <td className="px-10 py-6 font-black text-xl text-zinc-900 tracking-tight">{group.name}</td>
                      <td className="px-10 py-6">
                        <code className="text-[11px] font-mono bg-zinc-100/80 text-zinc-500 px-3 py-1 rounded-lg">
                          {group.id}
                        </code>
                      </td>
                      <td className="px-10 py-6 font-bold text-zinc-500">
                        {new Date(group.created_at).toLocaleDateString('he-IL')}
                      </td>
                      <td className="px-10 py-6 text-left">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => startEdit(group)} 
                            className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 transition-colors"
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={() => handleDeleteGroup(group.id)} 
                            className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-colors"
                          >
                            🗑️
                          </button>
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

export default GroupPanelPage;