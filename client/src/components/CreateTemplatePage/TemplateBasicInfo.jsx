import React from 'react';
import TagDisplay from '../common/tags/TagDisplay';

const TemplateBasicInfo = ({ formData, setFormData, tagSearch, setTagSearch, filteredTags, handleTagToggle }) => (
  <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
    <h2 className="text-sm font-black uppercase text-zinc-400 tracking-widest">1. מידע בסיס ותגיות</h2>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">שם השבלונה</label>
        <input 
          type="text" 
          placeholder="הכנס שם שבלונה" 
          className="w-full p-4 bg-zinc-50 rounded-xl font-bold border border-zinc-200 outline-none focus:border-zinc-900" 
          value={formData.name || ''} 
          onChange={e => setFormData({...formData, name: e.target.value})} 
          required 
        />
      </div>
      <div>
        <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">זמן משוער (דקות)</label>
        <input 
          type="number" 
          placeholder="45" 
          className="w-full p-4 bg-zinc-50 rounded-xl font-bold border border-zinc-200 outline-none focus:border-zinc-900" 
          value={formData.estimated_duration || 0} 
          onChange={e => setFormData({...formData, estimated_duration: parseInt(e.target.value) || 0})} 
        />
      </div>
    </div>
    
    <div>
      <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">תיאור השבלונה</label>
      <textarea 
        placeholder="תיאור כללי של האימון והמטרות..." 
        rows="3" 
        className="w-full p-4 bg-zinc-50 rounded-xl font-bold border border-zinc-200 outline-none focus:border-zinc-900 resize-none" 
        value={formData.description || ''} 
        onChange={e => setFormData({...formData, description: e.target.value})} 
      />
    </div>

    <div className="pt-4 border-t border-zinc-100 space-y-4">
      <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest">חיפוש ובחירת תגיות</label>
      <input 
        type="text" 
        placeholder="סנן תגיות..." 
        className="w-full p-3 bg-zinc-50 rounded-xl text-xs font-bold border border-zinc-200 outline-none" 
        value={tagSearch || ''} 
        onChange={e => setTagSearch(e.target.value)} 
      />
      
      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2">
        {Array.isArray(filteredTags) && filteredTags.map(tag => {
          const isSelected = Array.isArray(formData.tag_ids) && formData.tag_ids.includes(tag.id);
          return (
            <button 
              key={tag.id} 
              type="button" 
              onClick={() => handleTagToggle(tag.id)} 
              className={`transition-all ${isSelected ? 'ring-2 ring-offset-2 ring-zinc-900 rounded-xl' : 'opacity-60 hover:opacity-100'}`}
            >
              <TagDisplay name={tag.name} color={tag.color} />
            </button>
          );
        })}
        {(!Array.isArray(filteredTags) || filteredTags.length === 0) && (
          <p className="text-xs text-zinc-400">לא נמצאו תגיות...</p>
        )}
      </div>
    </div>
  </div>
);

export default TemplateBasicInfo;