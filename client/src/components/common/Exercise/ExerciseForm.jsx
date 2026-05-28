import React, { useState, useEffect, useMemo } from 'react';
import { useTag } from '../../../contexts/TagContext';
import { useParameter } from '../../../contexts/ParameterContext';
import TagDisplay from '../tags/TagDisplay';
import FrontendLogger from '../../../utils/logger';
import ExerciseAiHub from './ExerciseAiHub';

const ExerciseForm = ({ 
  editingId, 
  initialData, 
  onSubmit, 
  onCancel, 
  existingExercises, 
  existingTags, 
  existingParams, 
  onImportBulk 
}) => {
  const { tags } = useTag();
  const { parameters } = useParameter();
  const [isAiOpen, setIsAiOpen] = useState(false);

  const [tagSearch, setTagSearch] = useState('');
  const [paramSearch, setParamSearch] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    tag_ids: [],
    parameter_ids: []
  });

  const filteredTags = useMemo(() => 
    tags.filter(t => t.name.toLowerCase().includes(tagSearch.toLowerCase())),
    [tags, tagSearch]
  );

  const filteredParams = useMemo(() => 
    parameters.filter(p => !p.is_virtual && p.name.toLowerCase().includes(paramSearch.toLowerCase())),
    [parameters, paramSearch]
  );

  useEffect(() => {
    if (editingId && initialData) {
      setFormData({
        name: initialData.name,
        tag_ids: initialData.tags.map(t => t.id),
        parameter_ids: initialData.parameters.filter(p => !p.is_virtual).map(p => p.id)
      });
    } else {
      setFormData({ name: '', tag_ids: [], parameter_ids: [] });
    }
  }, [editingId, initialData]);

  const activatedVirtualParams = useMemo(() => {
    return parameters.filter(p => {
      if (!p.is_virtual || !p.source_parameter_ids) return false;
      return p.source_parameter_ids.every(id => formData.parameter_ids.includes(id));
    });
  }, [formData.parameter_ids, parameters]);

  const handleToggleId = (field, id) => {
    setFormData(prev => {
      const current = prev[field];
      const next = current.includes(id) 
        ? current.filter(item => item !== id) 
        : [...current, id];
      return { ...prev, [field]: next };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSubmit(formData);
  };

  return (
    <div className="bg-white/40 backdrop-blur-md rounded-3xl p-6 border border-white/60 shadow-lg transition-all">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-black uppercase tracking-wider text-zinc-700 select-none">
          {editingId ? '✏️ עריכת תרגיל' : '🏋️ הקמת תרגיל חדש'}
        </h3>
        {!editingId && (
          <button 
            type="button"
            onClick={() => setIsAiOpen(!isAiOpen)}
            className="text-[10px] font-black uppercase text-cyan-700 hover:text-cyan-900 transition-colors flex items-center gap-1"
          >
            {isAiOpen ? 'סגור עוזר AI' : 'פתח עוזר AI'} 🤖
          </button>
        )}
      </div>

      {isAiOpen && (
        <div className="mb-8 animate-in fade-in zoom-in-95 duration-300">
          <ExerciseAiHub 
            existingExercises={existingExercises}
            existingTags={existingTags}
            existingParams={existingParams}
            onImportBulk={onImportBulk}
          />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mr-2">שם התרגיל</label>
          <input 
            type="text" 
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full bg-white/60 border border-white/80 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all"
          />
        </div>

        {/* Tags Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">תגים</label>
            <input 
              type="text" 
              placeholder="סינון תגים..." 
              className="flex-1 bg-white/50 border border-white/80 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-zinc-900/10"
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2 p-4 bg-white/20 border border-white/40 rounded-2xl min-h-[60px]">
            {filteredTags.map(tag => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleToggleId('tag_ids', tag.id)}
                className={`transition-all transform active:scale-95 ${formData.tag_ids.includes(tag.id) ? 'scale-110 ring-2 ring-zinc-400 ring-offset-1 rounded-xl' : 'opacity-40 hover:opacity-100'}`}
              >
                <TagDisplay name={tag.name} color={tag.color} />
              </button>
            ))}
          </div>
        </div>

        {/* Parameters Section (Flex Wrap) */}
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">פרמטרים</label>
            <input 
              type="text" 
              placeholder="סינון פרמטרים..." 
              className="flex-1 bg-white/50 border border-white/80 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-zinc-900/10"
              value={paramSearch}
              onChange={(e) => setParamSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2 p-4 bg-white/20 border border-white/40 rounded-2xl">
            {filteredParams.map(param => (
              <button
                key={param.id}
                type="button"
                onClick={() => handleToggleId('parameter_ids', param.id)}
                className={`px-4 py-2 rounded-xl text-[11px] font-bold border transition-all ${
                  formData.parameter_ids.includes(param.id)
                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-md'
                    : 'bg-white/60 text-zinc-500 border-white/80 hover:bg-white'
                }`}
              >
                {param.name} ({param.unit})
              </button>
            ))}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100">
          <button type="button" onClick={onCancel} className="px-8 py-3 bg-white/80 rounded-xl text-zinc-500 font-bold text-xs hover:bg-white transition-all">ביטול</button>
          <button type="submit" className="px-10 py-3 bg-zinc-900 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-zinc-800 transition-all active:scale-95">
            {editingId ? 'עדכן תרגיל' : 'צור תרגיל'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExerciseForm;