import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSchedule } from '../../contexts/ScheduleContext';
import { scheduleService } from '../../services/scheduleService';
import { useToast } from '../../contexts/ToastContext';

const EventTypeOptions = [
  { value: 'template', label: 'אימון (תבנית)' },
  { value: 'test', label: 'מבדק' },
  { value: 'personal', label: 'אישי' },
  { value: 'other', label: 'אחר' }
];

const EventModal = ({ isOpen, onClose, initialSlot, existingEvent }) => {
  const { user } = useAuth();
  const { handleActionResponse, fetchEvents } = useSchedule();
  const { showToast } = useToast();
  
  const [templates, setTemplates] = useState([]); 
  
  const [formData, setFormData] = useState({
    title: '',
    event_type: 'other',
    start_time: '',
    end_time: '',
    is_recurring: false,
    template_id: '',
    assignment_target: 'self'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const formatForInput = (dateObj) => {
      if (!dateObj) return '';
      const d = new Date(dateObj);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      return d.toISOString().slice(0, 16);
    };

    if (existingEvent) {
      setFormData({
        ...existingEvent,
        start_time: formatForInput(existingEvent.start_time),
        end_time: formatForInput(existingEvent.end_time),
        template_id: existingEvent.template_id || '',
        assignment_target: 'self'
      });
    } else if (initialSlot) {
      const endSlot = new Date(initialSlot);
      endSlot.setHours(endSlot.getHours() + 1);
      
      setFormData(prev => ({
        ...prev,
        start_time: formatForInput(initialSlot),
        end_time: formatForInput(endSlot)
      }));
    }
    
    // In real app, fetch from workoutTemplateService here
  }, [existingEvent, initialSlot]);

  // Handle escape key and body scroll lock
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleTemplateChange = (e) => {
    const templateId = e.target.value;
    const selectedTemplate = templates.find(t => t.id === templateId);
    
    if (selectedTemplate) {
      const start = new Date(formData.start_time);
      const end = new Date(start.getTime() + (selectedTemplate.estimated_duration * 60000));
      const d = new Date(end);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      
      setFormData({
        ...formData,
        template_id: templateId,
        title: selectedTemplate.name,
        end_time: d.toISOString().slice(0, 16)
      });
    } else {
      setFormData({ ...formData, template_id: templateId });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const payload = {
        title: formData.title,
        event_type: formData.event_type,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
        is_recurring: formData.is_recurring,
        template_id: formData.template_id || null,
        user_id: user.id
      };

      let response;
      if (existingEvent) {
        response = await scheduleService.updateEvent(existingEvent.id, payload);
      } else {
        if (formData.assignment_target === 'group' && user.role === 'trainer') {
          response = await scheduleService.createGroupEvent(user.group_id, payload);
          showToast(`נוצרו ${response.total_created} אירועים בהצלחה`, 'success');
        } else {
          response = await scheduleService.createEvent(payload);
        }
      }
      handleActionResponse(response);
      onClose();
    } catch (error) {
      showToast('שגיאה בשמירת האירוע', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק אירוע זה?')) return;
    try {
      await scheduleService.deleteEvent(existingEvent.id);
      showToast('אירוע נמחק בהצלחה', 'success');
      fetchEvents();
      onClose();
    } catch (error) {
      showToast('שגיאה במחיקת האירוע', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0" dir="rtl">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      ></div>

      {/* Modal Content */}
      <div 
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto z-10 transform transition-all animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        role="dialog" 
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h3 className="text-xl font-bold text-gray-800">
            {existingEvent ? 'עריכת אירוע' : 'אירוע חדש'}
          </h3>
          <button
            onClick={onClose}
            type="button"
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Form Area */}
        <div className="px-6 py-4 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {user?.role === 'trainer' && !existingEvent && (
              <div>
                <label className="block text-sm font-medium mb-1">שיוך אירוע</label>
                <select 
                  value={formData.assignment_target}
                  onChange={(e) => setFormData({...formData, assignment_target: e.target.value})}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="self">עבורי בלבד</option>
                  <option value="group">עבור כל הקבוצה</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">סוג אירוע</label>
              <select 
                value={formData.event_type}
                onChange={(e) => setFormData({...formData, event_type: e.target.value})}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {EventTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>

            {formData.event_type === 'template' && (
              <div>
                <label className="block text-sm font-medium mb-1">תבנית אימון</label>
                <select 
                  value={formData.template_id}
                  onChange={handleTemplateChange}
                  required
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">בחר תבנית...</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">כותרת</label>
              <input 
                type="text" 
                required 
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">התחלה</label>
                <input 
                  type="datetime-local" 
                  required 
                  value={formData.start_time}
                  onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">סיום</label>
                <input 
                  type="datetime-local" 
                  required 
                  value={formData.end_time}
                  onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center mt-4">
              <input 
                type="checkbox" 
                id="is_recurring"
                checked={formData.is_recurring}
                onChange={(e) => setFormData({...formData, is_recurring: e.target.checked})}
                className="h-4 w-4 text-blue-600 rounded border-gray-300"
              />
              <label htmlFor="is_recurring" className="mr-2 text-sm text-gray-700">אירוע חוזר</label>
            </div>

            <div className="flex justify-end space-x-3 space-x-reverse pt-6 mt-6">
              <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                ביטול
              </button>
              {existingEvent && (
                <button type="button" onClick={handleDelete} className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-md">
                  מחיקה
                </button>
              )}
              <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                {isSubmitting ? 'שומר...' : 'שמירה'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EventModal;