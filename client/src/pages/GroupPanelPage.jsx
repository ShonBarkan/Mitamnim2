import React, { useState, useEffect, useRef } from 'react';
import { useGroups } from '../contexts/GroupContext';
import { useToast } from '../contexts/ToastContext';
import { uploadToCloudinary } from '../utils/cloudinary';
import FrontendLogger from '../utils/logger';

/**
 * GroupPanelPage Component - Admin dashboard for managing athletic groups.
 * Implements the "Arctic Mirror" design language with decoupled Cloudinary utility integration.
 */
const GroupPanelPage = () => {
  const { groups, loading, refreshGroups, addGroup, deleteGroup, updateGroup } = useGroups();
  const { showToast } = useToast();

  const [groupName, setGroupName] = useState('');
  const [groupImage, setGroupImage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef(null);

  // Fetch groups on component mount
  useEffect(() => {
    FrontendLogger.info('GROUP_PANEL', 'Mounting group administration cluster view panel');
    refreshGroups();
  }, [refreshGroups]);

  /**
   * Pre-fills the form to enter Edit Mode.
   */
  const startEdit = (group) => {
    FrontendLogger.info('GROUP_PANEL', `Redirecting context focus pool into edit mode for group id: ${group.id}`);
    setEditingGroupId(group.id);
    setGroupName(group.name);
    setGroupImage(group.group_image || '');
    setPreviewUrl(group.group_image || '');
    setSelectedFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Resets the form and returns safely to Create Mode.
   */
  const cancelEdit = () => {
    FrontendLogger.info('GROUP_PANEL', 'Evicting active inline edit mode state properties, resetting form constraints');
    setEditingGroupId(null);
    setGroupName('');
    setGroupImage('');
    setSelectedFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /**
   * Handles local file selection and generates an instant UI image preview.
   */
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      FrontendLogger.info('GROUP_PANEL', `Local image file selected: ${file.name} (${file.size} bytes)`);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  /**
   * Handles Form Submission (Uploads image if needed via shared utility, then saves group).
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    FrontendLogger.info('GROUP_PANEL', 'Intercepted group structure submission transaction event trigger');

    if (!groupName) {
      showToast("אנא הזן שם לקבוצה", "error");
      return;
    }

    setIsUploading(true);
    try {
      let finalImageUrl = groupImage;

      // Stream media payload asynchronously to Cloudinary using the shared utility if file exists
      if (selectedFile) {
        finalImageUrl = await uploadToCloudinary(selectedFile);
      }

      if (editingGroupId) {
        await updateGroup(editingGroupId, { 
          name: groupName, 
          group_image: finalImageUrl || null 
        });
        showToast("הקבוצה עודכנה בהצלחה", "success");
      } else {
        await addGroup({ 
          name: groupName, 
          group_image: finalImageUrl || null 
        });
        showToast("קבוצה נוצרה בהצלחה", "success");
      }
      cancelEdit(); 
    } catch (error) {
      FrontendLogger.error('GROUP_PANEL', 'Exception caught during organization pipeline mutation execution layout', error);
      showToast("שגיאה בפעולה: " + (error.message || "נסה שוב"), "error");
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Handles Group Deletion with safety confirmation.
   */
  const handleDeleteGroup = async (groupId) => {
    FrontendLogger.warn('GROUP_PANEL', `Prompting structural verification destruction loop sequence for target group id: ${groupId}`);
    if (window.confirm("האם אתה בטוח? מחיקת קבוצה עלולה להשפיע על המשתמשים המשויכים אליה.")) {
      try {
        await deleteGroup(groupId);
        showToast("קבוצה נמחקה", "success");
        if (editingGroupId === groupId) cancelEdit();
      } catch (error) {
        FrontendLogger.error('GROUP_PANEL', `Destruction process fault observed for target group row entity index: ${groupId}`, error);
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

        {/* Dynamic Action Card (Create/Edit Framework) */}
        <section className={`bg-white/40 backdrop-blur-2xl rounded-[3rem] p-10 border border-white/60 shadow-2xl transition-all duration-500 ${editingGroupId ? 'ring-4 ring-orange-500/20 border-orange-200/50' : ''}`}>
          <div className="flex items-center gap-4 mb-8">
            <div className={`w-3 h-3 rounded-full animate-pulse ${editingGroupId ? 'bg-orange-500' : 'bg-blue-600'}`} />
            <h3 className="text-2xl font-black tracking-tight">
              {editingGroupId ? 'עריכת קבוצה קיימת' : 'הקמת קבוצה חדשה'}
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              
              {/* Group Name input */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-4">שם הקבוצה</label>
                <input 
                  type="text" 
                  placeholder="Group Name" 
                  value={groupName} 
                  onChange={(e) => setGroupName(e.target.value)} 
                  disabled={isUploading}
                  className="w-full bg-white/50 border border-white/40 rounded-2xl px-8 py-5 text-sm font-bold outline-none focus:ring-8 focus:ring-zinc-900/5 transition-all"
                />
              </div>

              {/* High-End Glass Image Upload Field */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-4">לוגו / תמונת הקבוצה</label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 bg-white/60 backdrop-blur-md border border-white/80 rounded-2xl py-4 px-6 text-sm font-black text-zinc-700 hover:bg-white/90 active:scale-95 transition-all shadow-sm text-center"
                  >
                    {selectedFile ? 'החלף תמונה 🔄' : 'בחר קובץ 📸'}
                  </button>
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  
                  {/* Real-time Local Upload Preview Frame */}
                  {previewUrl && (
                    <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white bg-zinc-200/50 flex-shrink-0 shadow-md">
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Actions Grid Block */}
            <div className="flex justify-end gap-3 border-t border-zinc-900/5 pt-6">
              {editingGroupId && (
                <button 
                  type="button" 
                  onClick={cancelEdit} 
                  disabled={isUploading}
                  className="px-8 py-5 bg-white/60 backdrop-blur-md rounded-2xl text-zinc-500 font-bold text-sm hover:bg-white/80 transition-all"
                >
                  ביטול
                </button>
              )}
              
              <button 
                type="submit" 
                disabled={isUploading}
                className={`px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center gap-3 ${
                  editingGroupId ? 'bg-orange-500 text-white shadow-orange-200 hover:bg-orange-600' : 'bg-zinc-900 text-white shadow-zinc-200 hover:bg-zinc-800'
                } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    מעלה נתונים...
                  </>
                ) : editingGroupId ? (
                  'עדכון'
                ) : (
                  'צור קבוצה'
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Groups Directory Table Area */}
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