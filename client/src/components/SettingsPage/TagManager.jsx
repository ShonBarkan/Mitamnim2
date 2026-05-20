import React, { useState, useEffect } from 'react';
import { useTag } from '../../contexts/TagContext';
import { useToast } from '../../contexts/ToastContext';
import FrontendLogger from '../../utils/logger';

// Imported modular sub-components
import TagAiHub from './TagManager/TagAiHub';
import TagForm from './TagManager/TagForm';
import TagTable from './TagManager/TagTable';

const TagManager = () => {
  const { tags, loading, fetchTags, addTag, editTag, removeTag, addBulkTags } = useTag();
  const { showToast } = useToast();

  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', color: '#00bcd4' });
  const [isAiOpen, setIsAiOpen] = useState(false); // New state for collapse

  const PRESET_COLORS = ['#00bcd4', '#ff9800', '#f44336', '#9c27b0', '#4caf50', '#e91e63', '#ffeb3b', '#607d8b'];

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: '', color: '#00bcd4' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name?.trim()) return showToast("אנא הזן שם", "error");

    try {
      if (editingId) await editTag(editingId, { name: formData.name.trim(), color: formData.color });
      else await addTag({ name: formData.name.trim(), color: formData.color });
      showToast("בוצע בהצלחה", "success");
      resetForm();
    } catch (e) { showToast("הפעולה נכשלה", "error"); }
  };

  return (
    <div className="space-y-10 font-sans" dir="rtl">
      
      {/* --- AI COLLAPSIBLE SECTION --- */}
      <div className="bg-white/40 backdrop-blur-md rounded-3xl p-6 border border-white/60 shadow-lg">
        <button 
          onClick={() => setIsAiOpen(!isAiOpen)}
          className="flex items-center justify-between w-full text-zinc-900 font-black uppercase text-sm tracking-wider mb-2 select-none"
        >
          <span>🤖 עזרה חכמה (AI Hub)</span>
          <span className="text-xl">{isAiOpen ? '−' : '+'}</span>
        </button>
        
        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isAiOpen ? 'max-h-[600px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
          <TagAiHub existingTags={tags} onImportBulk={addBulkTags} showToast={showToast} />
        </div>
      </div>

      <TagForm 
        formData={formData} editingId={editingId} PRESET_COLORS={PRESET_COLORS}
        onInputChange={handleInputChange} onPresetColorSelect={(c) => setFormData(p => ({...p, color: c}))}
        onSubmit={handleSubmit} onReset={resetForm}
      />
      <TagTable loading={loading} tags={tags} onStartEdit={setEditingId} onDelete={removeTag} />
    </div>
  );
};

export default TagManager;