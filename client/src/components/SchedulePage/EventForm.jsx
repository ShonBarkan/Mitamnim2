import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSchedule } from '../../contexts/ScheduleContext';
import { useTemplate } from '../../contexts/TemplateContext';
import { useToast } from '../../contexts/ToastContext';
import { Search, Calendar, Clock, Save, Trash2, AlertCircle, User as UserIcon } from 'lucide-react';

const EventTypeOptions = [
  { value: 'template', label: 'אימון (תבנית)' },
  { value: 'test', label: 'מבדק', color: '#ef4444' },
  { value: 'study', label: 'לימודים', color: '#f97316' },
  { value: 'personal', label: 'אישי', color: '#22c55e' },
  { value: 'other', label: 'אחר', color: '#6b7280' }
];

const RecurrenceOptions = [
  { value: 'none', label: 'חד פעמי' },
  { value: 'daily', label: 'יומי' },
  { value: 'weekly', label: 'שבועי' },
  { value: 'bi-weekly', label: 'דו-שבועי' },
  { value: 'monthly', label: 'חודשי' }
];

const EventForm = ({ onClose, initialSlot, existingEvent }) => {
  const { user } = useAuth();
  const { addEventLocally, updateEventLocally, removeEventLocally, mockTrainees } = useSchedule();
  const { templates, fetchTemplates } = useTemplate();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('workout');
  const [templateSearch, setTemplateSearch] = useState('');
  const [applyToSeries, setApplyToSeries] = useState(false);
  const [validationError, setValidationError] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    event_type: 'other',
    date: '',
    startTime: '',
    endTime: '',
    template_id: '',
    color: '#6b7280',
    recurrence_type: 'none',
    assignment_target: 'self',
    assigned_user_ids: []
  });

  const isReadOnly = existingEvent && existingEvent.user_id && existingEvent.user_id !== user?.id;

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  useEffect(() => {
    if (existingEvent) {
      const start = new Date(existingEvent.start_time);
      const end = new Date(existingEvent.end_time);
      
      setFormData({
        title: existingEvent.title || '',
        event_type: existingEvent.event_type || 'other',
        date: start.toISOString().split('T')[0],
        startTime: start.toTimeString().slice(0, 5),
        endTime: end.toTimeString().slice(0, 5),
        template_id: existingEvent.template_id || '',
        color: existingEvent.color || '#6b7280',
        recurrence_type: existingEvent.recurrence_type || 'none',
        series_id: existingEvent.series_id,
        assignment_target: existingEvent.assignment_target || 'self',
        assigned_user_ids: existingEvent.assigned_user_ids || []
      });
      setActiveTab(existingEvent.event_type === 'template' ? 'workout' : 'other');
    } else if (initialSlot) {
      const start = new Date(initialSlot);
      start.setMinutes(Math.round(start.getMinutes() / 15) * 15);
      start.setSeconds(0);
      
      const end = new Date(start.getTime() + 3600000);
      setFormData(prev => ({
        ...prev,
        date: start.toISOString().split('T')[0],
        startTime: start.toTimeString().slice(0, 5),
        endTime: end.toTimeString().slice(0, 5)
      }));
    }
  }, [existingEvent, initialSlot]);

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => t.name.toLowerCase().includes(templateSearch.toLowerCase()));
  }, [templates, templateSearch]);

  const toggleUserSelection = (userId) => {
    setFormData(prev => ({
      ...prev,
      assigned_user_ids: prev.assigned_user_ids.includes(userId)
        ? prev.assigned_user_ids.filter(id => id !== userId)
        : [...prev.assigned_user_ids, userId]
    }));
  };

  const handleDelete = () => {
    if (existingEvent?.series_id) {
      const deleteSeries = window.confirm('אירוע זה הוא חלק מסדרה. האם ברצונך למחוק את כל הסדרה?\n\n- אישור: מחיקת כל הסדרה\n- ביטול: מחיקת אירוע זה בלבד');
      removeEventLocally(existingEvent.id, deleteSeries);
    } else {
      if(window.confirm('האם ברצונך למחוק את האירוע?')) {
        removeEventLocally(existingEvent.id, false);
      } else return;
    }
    showToast('האירוע נמחק בהצלחה', 'success');
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (activeTab === 'workout' && !formData.template_id) {
      setValidationError(true);
      showToast('חובה לבחור תבנית אימון מהרשימה', 'error');
      return;
    }
    if (activeTab === 'other' && !formData.title.trim()) {
      setValidationError(true);
      showToast('חובה להזין כותרת לאירוע', 'error');
      return;
    }

    const start = new Date(`${formData.date}T${formData.startTime}:00`);
    const end = new Date(`${formData.date}T${formData.endTime}:00`);

    const eventObj = {
      id: existingEvent?.id,
      ...formData,
      start_time: start,
      end_time: end,
      user_id: user.id
    };

    if (existingEvent) {
      updateEventLocally(eventObj, applyToSeries);
      showToast('האירוע עודכן בהצלחה', 'success');
    } else {
      addEventLocally(eventObj);
      showToast('האירוע נוסף ללוח', 'success');
    }
    onClose();
  };

  if (isReadOnly) {
    const typeLabel = EventTypeOptions.find(o => o.value === existingEvent.event_type)?.label || 'אחר';
    
    return (
      <div className="flex flex-col h-full bg-white relative">
        <div className="p-6 space-y-6 overflow-y-auto h-full">
          <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
            {existingEvent.user_picture ? (
              <img 
                src={existingEvent.user_picture} 
                alt="user" 
                className="w-16 h-16 rounded-full border-2 border-white shadow-md object-cover shrink-0" 
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shadow-md shrink-0">
                <UserIcon size={24} />
              </div>
            )}
            <div>
              <h2 className="text-xl font-black text-gray-800">{existingEvent.user_name || 'משתמש'}</h2>
              <span className="inline-block mt-1 px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg">
                {typeLabel}
              </span>
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                <AlertCircle size={20} />
              </div>
              <div className="pt-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-0.5">כותרת</p>
                <p className="font-bold text-gray-800 text-sm">{existingEvent.title || 'ללא כותרת'}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                <Calendar size={20} />
              </div>
              <div className="pt-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-0.5">תאריך</p>
                <p className="font-bold text-gray-800 text-sm">
                  {new Date(existingEvent.start_time).toLocaleDateString('he-IL')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                <Clock size={20} />
              </div>
              <div className="pt-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-0.5">שעות</p>
                <p className="font-bold text-gray-800 text-sm">
                  {new Date(existingEvent.start_time).toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'})} - {new Date(existingEvent.end_time).toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'})}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="flex p-2 gap-2 border-b shrink-0">
        {['workout', 'other'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === tab ? 'bg-blue-50 text-blue-700' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            {tab === 'workout' ? 'אימון' : 'אירוע כללי'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto h-full pb-28">
        {activeTab === 'workout' ? (
          <div>
            <div className="relative mb-3">
              <Search className="absolute right-3 top-2.5 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="חיפוש תבנית אימון..." 
                className={`w-full p-2 pr-10 border rounded-xl bg-gray-50 text-sm ${validationError && !formData.template_id ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                value={templateSearch}
                onChange={(e) => { setTemplateSearch(e.target.value); setValidationError(false); }}
              />
            </div>
            <div className="space-y-1">
              {filteredTemplates.map(t => (
                <div 
                  key={t.id} 
                  onClick={() => {
                    const start = new Date(`${formData.date}T${formData.startTime || '08:00'}`);
                    const end = new Date(start.getTime() + ((t.estimated_duration || 60) * 60000));
                    setFormData({...formData, template_id: t.id, title: t.name, event_type: 'template', endTime: end.toTimeString().slice(0,5), color: '#3b82f6'});
                    setValidationError(false);
                  }}
                  className={`p-3 rounded-xl cursor-pointer text-sm font-bold transition-all ${formData.template_id === t.id ? 'bg-blue-600 text-white shadow-md' : 'bg-white hover:bg-gray-50 border border-gray-100'}`}
                >
                  {t.name}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase text-gray-400 mb-1">סוג אירוע</label>
              <select 
                value={formData.event_type}
                onChange={(e) => {
                  const opt = EventTypeOptions.find(o => o.value === e.target.value);
                  setFormData({...formData, event_type: e.target.value, color: opt.color});
                }}
                className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 font-bold text-sm"
              >
                {EventTypeOptions.filter(o => o.value !== 'template').map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-gray-400 mb-1">
                כותרת אירוע <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                placeholder="הזן שם לאירוע..."
                value={formData.title} 
                onChange={(e) => { setFormData({...formData, title: e.target.value}); setValidationError(false); }} 
                className={`w-full p-2.5 border rounded-xl text-sm font-bold transition-colors ${validationError && !formData.title.trim() ? 'border-red-500 bg-red-50' : 'border-gray-200'}`} 
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
           <div>
              <label className="block text-xs font-black uppercase text-gray-400 mb-1 flex items-center gap-1"><Calendar size={12} /> תאריך</label>
              <input type="date" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-xl text-sm font-bold" />
           </div>
           <div>
              <label className="block text-xs font-black uppercase text-gray-400 mb-1">חזרה</label>
              <select 
                value={formData.recurrence_type} 
                onChange={(e) => setFormData({...formData, recurrence_type: e.target.value})} 
                disabled={!!existingEvent && existingEvent.series_id} 
                className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 font-bold text-sm disabled:opacity-50"
              >
                {RecurrenceOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
           <div>
              <label className="block text-xs font-black uppercase text-gray-400 mb-1 flex items-center gap-1"><Clock size={12} /> התחלה</label>
              <input type="time" step="900" required value={formData.startTime} onChange={(e) => setFormData({...formData, startTime: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-xl text-sm font-bold" />
           </div>
           <div>
              <label className="block text-xs font-black uppercase text-gray-400 mb-1 flex items-center gap-1"><Clock size={12} /> סיום</label>
              <input type="time" step="900" required value={formData.endTime} onChange={(e) => setFormData({...formData, endTime: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-xl text-sm font-bold" />
           </div>
        </div>

        {user?.role === 'trainer' && (
           <div className="pt-2">
             <label className="block text-xs font-black uppercase text-gray-400 mb-2">שיוך אירוע</label>
             <select value={formData.assignment_target} onChange={(e) => setFormData({...formData, assignment_target: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-xl mb-3 text-sm font-bold">
               <option value="self">רק לעצמי</option>
               <option value="group">לכל הקבוצה</option>
               <option value="specific">מתאמנים ספציפיים</option>
             </select>
             
             {formData.assignment_target === 'specific' && (
               <div className="max-h-40 overflow-y-auto bg-gray-50 p-2 rounded-xl border flex flex-col gap-1">
                 {mockTrainees.map(u => (
                   <div 
                     key={u.id} 
                     className="flex items-center gap-3 p-2 text-sm font-bold cursor-pointer hover:bg-gray-100 rounded-lg transition-colors" 
                     onClick={() => toggleUserSelection(u.id)}
                   >
                     <input 
                       type="checkbox" 
                       checked={formData.assigned_user_ids.includes(u.id)} 
                       readOnly 
                       className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                     />
                     <img 
                       src={u.picture || u.user_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random`} 
                       alt={u.name} 
                       className="w-7 h-7 rounded-full border border-gray-200 object-cover" 
                     />
                     <span>{u.name}</span>
                   </div>
                 ))}
               </div>
             )}
           </div>
        )}

        {existingEvent?.series_id && (
          <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-200 mt-4">
            <p className="text-xs text-yellow-800 font-bold mb-2">אירוע זה הוא חלק מסדרה. החל שינויים על:</p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="radio" checked={!applyToSeries} onChange={() => setApplyToSeries(false)} className="text-blue-600 focus:ring-blue-500" />
                אירוע זה בלבד
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="radio" checked={applyToSeries} onChange={() => setApplyToSeries(true)} className="text-blue-600 focus:ring-blue-500" />
                כל הסדרה
              </label>
            </div>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t flex gap-2">
          {existingEvent && (
            <button type="button" onClick={handleDelete} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors">
              <Trash2 size={20} />
            </button>
          )}
          <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg transition-all flex items-center justify-center gap-2">
            <Save size={18} /> {existingEvent ? 'עדכן אירוע' : 'שמור אירוע'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EventForm;