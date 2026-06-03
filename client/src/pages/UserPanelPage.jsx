import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUsers } from '../contexts/UserContext';
import { useGroups } from '../contexts/GroupContext';
import { useToast } from '../contexts/ToastContext';
import { uploadToCloudinary } from '../utils/cloudinary';
import FrontendLogger from '../utils/logger';

/**
 * UserPanelPage Component - Administrative dashboard for team and athlete account management.
 * Fully features the bright "Arctic Mirror" design layout and Cloudinary file streaming.
 */
const UserPanelPage = () => {
  const { user: currentUser } = useAuth();
  const { users, loading, refreshUsers, addUser, deleteUser, updateUser } = useUsers();
  const { groups, refreshGroups } = useGroups(); // Kept context instance strictly to populate creation select forms
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
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [editingUserId, setEditingUserId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Search, filter and sort UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterGroupId, setFilterGroupId] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const fileInputRef = useRef(null);

  // Synchronize system user registry matrices based on role privileges
  useEffect(() => {
    FrontendLogger.info('USER_PANEL', 'Mounting user management administrative dashboard view');
    const targetGroupId = currentUser.role === 'trainer' ? currentUser.group_id : null;
    refreshUsers(targetGroupId);
    
    // Groups lookup network request is now required only for global admin creation contexts
    if (currentUser.role === 'admin') {
      refreshGroups();
    }
  }, [currentUser, refreshUsers, refreshGroups]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  /**
   * Triggers file input stream change and caches instant local visual preview tokens
   */
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      FrontendLogger.info('USER_PANEL', `Local image file selected for user profile avatar: ${file.name}`);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Handler to update search input state
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Toggles sort state for a given column key
  const handleSort = (key) => {
    setSortConfig((s) => {
      if (s.key === key) {
        // toggle direction
        return { key, direction: s.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  // Clear all filters and sort
  const clearFilters = () => {
    setSearchQuery('');
    setFilterRole('');
    setFilterGroupId('');
    setSortConfig({ key: null, direction: 'asc' });
  };

  // Utility: safe getter for nested values and normalization for comparison
  const getComparable = (item, key) => {
    const val = item?.[key];
    if (val === null || val === undefined) return '';
    if (typeof val === 'string') return val.toLowerCase();
    if (typeof val === 'number') return val;
    if (val instanceof Date) return val.getTime();
    return String(val).toLowerCase();
  };

  // Memoize the processed (filtered + sorted) users list so it recalculates
  // when either the raw `users` array or any of the filter/sort inputs change.
  const processedUsers = useMemo(() => {
    // Combine filters (AND logic): search + role + group
    const q = searchQuery.trim().toLowerCase();

    let list = Array.isArray(users) ? users.slice() : [];

    if (q) {
      list = list.filter((u) => {
        const haystack = [u.username, u.first_name, u.second_name, u.email, u.phone, u.group_name]
          .filter(Boolean)
          .join(' ') // join searchable fields
          .toLowerCase();
        return haystack.includes(q);
      });
    }

    if (filterRole) {
      list = list.filter((u) => (u.role || '').toString() === filterRole.toString());
    }

    if (filterGroupId) {
      list = list.filter((u) => (u.group_id || '').toString() === filterGroupId.toString());
    }

    // Sorting: if no key specified, return filtered list as-is
    if (!sortConfig.key) return list;

    const { key, direction } = sortConfig;

    list.sort((a, b) => {
      const va = getComparable(a, key);
      const vb = getComparable(b, key);

      // Numeric comparison when both are numbers
      if (typeof va === 'number' && typeof vb === 'number') {
        return direction === 'asc' ? va - vb : vb - va;
      }

      // Fallback to localeCompare for strings
      const res = String(va).localeCompare(String(vb), undefined, { numeric: true, sensitivity: 'base' });
      return direction === 'asc' ? res : -res;
    });

    return list;
  }, [users, searchQuery, filterRole, filterGroupId, sortConfig]);

  /**
   * Pre-fills the form parameters context boundary to transition into Edit Mode.
   */
  const startEdit = (user) => {
    FrontendLogger.info('USER_PANEL', `Transitioning into account inline edit mode for target record user ID: ${user.id}`);
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
    setPreviewUrl(user.profile_picture || '');
    setSelectedFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Purges active form memory properties and safely restores Create Mode constraints.
   */
  const cancelEdit = () => {
    FrontendLogger.info('USER_PANEL', 'Evicting active profile form properties, falling back to create boundaries');
    setEditingUserId(null);
    setFormData(initialFormState);
    setSelectedFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /**
   * Handles Form Submission Pipeline (Processes lazy image uploads, then creates or modifies record).
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    FrontendLogger.info('USER_PANEL', 'Intercepted account profiles mutation form submission trigger');

    setIsUploading(true);
    try {
      let finalImageUrl = formData.profile_picture;

      // Stream media assets asynchronously via Cloudinary global pipeline utilities if selected
      if (selectedFile) {
        finalImageUrl = await uploadToCloudinary(selectedFile);
      }

      const finalData = {
        ...formData,
        profile_picture: finalImageUrl || null,
        group_id: currentUser.role === 'trainer' ? currentUser.group_id : formData.group_id || null
      };

      if (editingUserId) {
        const updatePayload = { ...finalData };
        if (!updatePayload.password) delete updatePayload.password;
        await updateUser(editingUserId, updatePayload);
        showToast("המשתמש עודכן בהצלחה", "success");
      } else {
        if (!finalData.password) {
          showToast("אנא הזן סיסמה עבור משתמש חדש", "error");
          setIsUploading(false);
          return;
        }
        await addUser(finalData);
        showToast("משתמש נוסף בהצלחה", "success");
      }
      cancelEdit();
    } catch (error) {
      FrontendLogger.error('USER_PANEL', 'Exception observed while committing system identity profile changes', error);
      showToast("שגיאה בפעולה: " + (error.response?.data?.detail || "נסה שוב"), "error");
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Deletes a user profile with confirmation verification boundaries.
   */
  const handleDelete = async (userId) => {
    FrontendLogger.warn('USER_PANEL', `Prompting identity destruction sequence validation for target user ID: ${userId}`);
    if (window.confirm("האם אתה בטוח שברצונך למחוק משתמש זה?")) {
      try {
        await deleteUser(userId);
        showToast("משתמש נמחק", "success");
        if (editingUserId === userId) cancelEdit();
      } catch (error) {
        FrontendLogger.error('USER_PANEL', `Failed to apply absolute eviction loop rules on user entity node: ${userId}`, error);
        showToast("שגיאה במחיקה", "error");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-blue-50 via-slate-100 to-zinc-200 p-6 md:p-12 font-sans" dir="rtl">
      <div className="max-w-350 mx-auto space-y-12">
        
        {/* Header Block */}
        <header className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
          <div className="space-y-2">
            <h1 className="text-5xl font-black tracking-tighter text-zinc-900">ניהול משתמשים</h1>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-[0.3em]">Mitamnim2 Administration Suite</p>
          </div>
          {editingUserId && (
            <button onClick={cancelEdit} disabled={isUploading} className="px-6 py-2 bg-white/40 backdrop-blur-md border border-zinc-200 rounded-full text-zinc-600 font-bold text-sm hover:bg-white/60 transition-all">
              ביטול עריכה
            </button>
          )}
        </header>

        {/* Form Configuration Card */}
        <section className={`transition-all duration-700 bg-white/40 backdrop-blur-2xl rounded-[3rem] p-10 border border-white/60 shadow-2xl ${editingUserId ? 'ring-4 ring-blue-500/20 border-blue-200/50' : ''}`}>
          <div className="flex items-center gap-6 mb-10">
            <div className="relative">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-20 h-20 rounded-3xl object-cover border-4 border-white shadow-xl" />
              ) : (
                <div className="w-20 h-20 rounded-3xl bg-zinc-900 flex items-center justify-center text-white text-2xl font-black shadow-xl">
                  {formData.username?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight">{editingUserId ? 'עריכת פרטי משתמש קיימים' : 'הוספת חבר צוות חדש'}</h3>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">User Profile Configuration</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Credentials Fields Group */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2">שם משתמש</label>
                <input name="username" placeholder="Username" value={formData.username} onChange={handleInputChange} required disabled={isUploading || editingUserId} className="w-full bg-white/50 border border-white/40 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2">
                  {editingUserId ? 'סיסמה חדשה (אופציונלי)' : 'סיסמת כניסה'}
                </label>
                <input type="password" name="password" placeholder={editingUserId ? "••••••••" : "Password"} value={formData.password} onChange={handleInputChange} required={!editingUserId} disabled={isUploading} className="w-full bg-white/50 border border-white/40 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all" />
              </div>

              {/* Identity Details Fields */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2">שם פרטי</label>
                <input name="first_name" placeholder="First Name" value={formData.first_name} onChange={handleInputChange} disabled={isUploading} className="w-full bg-white/50 border border-white/40 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2">שם משפחה</label>
                <input name="second_name" placeholder="Last Name" value={formData.second_name} onChange={handleInputChange} disabled={isUploading} className="w-full bg-white/50 border border-white/40 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all" />
              </div>

              {/* Communication Details Fields */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2">כתובת אימייל</label>
                <input type="email" name="email" placeholder="athlete@example.com" value={formData.email} onChange={handleInputChange} disabled={isUploading} className="w-full bg-white/50 border border-white/40 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2">מספר טלפון</label>
                <input type="tel" name="phone" placeholder="05X-XXXXXXX" value={formData.phone} onChange={handleInputChange} disabled={isUploading} className="w-full bg-white/50 border border-white/40 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all" />
              </div>

              {/* Account Privilege Level Dropdown */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2">תפקיד והרשאות מערכת</label>
                <select name="role" value={formData.role} onChange={handleInputChange} disabled={isUploading || currentUser.role !== 'admin'} className="w-full bg-white/50 border border-white/40 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-zinc-900/5 appearance-none transition-all">
                  <option value="trainee">ספורטאי / מתאמן (Trainee)</option>
                  <option value="trainer">מאמן צוות (Trainer)</option>
                  <option value="admin">מנהל מערכת ראשי (Admin)</option>
                </select>
              </div>

              {/* Dynamic Group Boundaries Association Field */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2">שיוך לקבוצת פעילות</label>
                {currentUser.role === 'trainer' ? (
                  <input type="text" readOnly value={currentUser.group_name || 'קבוצת המאמן'} className="w-full bg-zinc-200/50 border border-zinc-300 rounded-2xl px-6 py-4 text-sm font-bold outline-none cursor-not-allowed opacity-70" />
                ) : (
                  <select name="group_id" value={formData.group_id} onChange={handleInputChange} disabled={isUploading} className="w-full bg-white/50 border border-white/40 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-zinc-900/5 appearance-none transition-all">
                    <option value="">-- בחר קבוצה מהרשימה --</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Glassmorphic Media Selection Block */}
              <div className="lg:col-span-4 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2">תמונת פרופיל / אוואטר</label>
                <div className="flex items-center gap-4 max-w-md">
                  <button type="button" disabled={isUploading} onClick={() => fileInputRef.current?.click()} className="w-full bg-white/70 backdrop-blur-md border border-white/90 rounded-2xl py-4 px-6 text-sm font-black text-zinc-700 hover:bg-white/90 active:scale-95 transition-all shadow-sm">
                    {selectedFile ? 'החלף קובץ נבחר 🔄' : 'העלה תמונת פרופיל 📸'}
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                </div>
              </div>

            </div>

            {/* Submit Control Row */}
            <div className="pt-4 border-t border-zinc-900/5 flex justify-end gap-3">
              <button type="submit" disabled={isUploading} className={`px-12 py-5 rounded-4xl font-black text-sm uppercase tracking-widest transition-all shadow-xl flex items-center gap-3 active:scale-95 ${editingUserId ? 'bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700' : 'bg-zinc-900 text-white shadow-zinc-200 hover:bg-zinc-800'}`}>
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    מעבד נתוני סגל...
                  </>
                ) : editingUserId ? (
                  'עדכון משתמש קיים'
                ) : (
                  'הוספת משתמש למאגר'
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Directory surveillance list view */}
        <section className="bg-white/80 backdrop-blur-xl rounded-[3rem] shadow-2xl border border-white overflow-hidden">
          <div className="p-8 border-b border-zinc-100 bg-white/30">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black tracking-tight">רשימת חברי ארגון וספורטאים</h3>
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-100 px-4 py-1.5 rounded-full">{processedUsers.length} / {users.length} משתמשים</span>
            </div>

            {/* Filters Row: search, role, group, clear */}
            <div className="mt-4 flex flex-col md:flex-row gap-3 items-center">
              <input
                type="search"
                placeholder="חפש משתמשים לפי שם, משתמש, אימייל או טלפון"
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full md:w-1/3 bg-white/70 border border-zinc-200 rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-200"
              />

              <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="w-full md:w-1/6 bg-white/70 border border-zinc-200 rounded-2xl px-4 py-3 text-sm font-medium outline-none">
                <option value="">כל התפקידים</option>
                <option value="trainee">ספורטאי</option>
                <option value="trainer">מאמן</option>
                <option value="admin">מנהל</option>
              </select>

              <select value={filterGroupId} onChange={(e) => setFilterGroupId(e.target.value)} className="w-full md:w-1/4 bg-white/70 border border-zinc-200 rounded-2xl px-4 py-3 text-sm font-medium outline-none">
                <option value="">כל הקבוצות</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>

              <div className="ml-auto">
                <button type="button" onClick={clearFilters} className="px-4 py-2 bg-white border border-zinc-200 rounded-2xl text-sm font-bold">נקה מסננים</button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-20 text-center text-zinc-400 font-bold uppercase animate-pulse">Synchronizing Registry Data...</div>
            ) : (
              <table className="w-full text-right border-collapse">
                <thead>
                      <tr className="bg-zinc-50/50 text-zinc-400 uppercase text-[11px] font-black tracking-widest border-b border-zinc-100">
                        <th onClick={() => handleSort('username')} className="px-8 py-6 cursor-pointer select-none">משתמש {sortConfig.key==='username' && (sortConfig.direction==='asc' ? '▲' : '▼')}</th>
                        <th onClick={() => handleSort('first_name')} className="px-8 py-6 cursor-pointer select-none">שם מלא {sortConfig.key==='first_name' && (sortConfig.direction==='asc' ? '▲' : '▼')}</th>
                        <th onClick={() => handleSort('email')} className="px-8 py-6 cursor-pointer select-none">אימייל / טלפון {sortConfig.key==='email' && (sortConfig.direction==='asc' ? '▲' : '▼')}</th>
                        <th onClick={() => handleSort('role')} className="px-8 py-6 cursor-pointer select-none">תפקיד {sortConfig.key==='role' && (sortConfig.direction==='asc' ? '▲' : '▼')}</th>
                        <th onClick={() => handleSort('group_name')} className="px-8 py-6 cursor-pointer select-none">קבוצה {sortConfig.key==='group_name' && (sortConfig.direction==='asc' ? '▲' : '▼')}</th>
                        <th className="px-8 py-6 text-left">פעולות</th>
                      </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {processedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-16 text-center text-zinc-400 italic font-bold">אין משתמשים התואמים את המסננים הנוכחיים.</td>
                    </tr>
                  ) : processedUsers.map(u => (
                    <tr key={u.id} className={`transition-all group hover:bg-white/50 ${editingUserId === u.id ? 'bg-blue-50/50' : ''}`}>
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
                      <td className="px-8 py-6 font-bold text-zinc-600">{u.first_name || '-'} {u.second_name || '-'}</td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-zinc-900">{u.email || '-'}</span>
                          <span className="text-[10px] font-black text-zinc-400 uppercase">{u.phone || '-'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${u.role === 'admin' ? 'bg-zinc-900 text-white' : u.role === 'trainer' ? 'bg-blue-600 text-white' : 'bg-zinc-100 text-zinc-500'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-8 py-6 font-bold text-zinc-500">
                        {/* Streamed efficiently straight from server parameters instead of local map arrays loops */}
                        {u.group_name || <span className="opacity-30 italic">ללא שיוך</span>}
                      </td>
                      <td className="px-8 py-6 text-left">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          {u.role === 'trainee' && (
                            <Link to={`/stats-page/${u.id}`} className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-100 transition-all active:scale-90">📊</Link>
                          )}
                          <button onClick={() => startEdit(u)} disabled={isUploading} className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 transition-all active:scale-90">✏️</button>
                          <button onClick={() => handleDelete(u.id)} disabled={isUploading} className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-all active:scale-90">🗑️</button>
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