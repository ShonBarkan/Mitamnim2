import React, { useState, useEffect } from 'react';
import { useParameter } from '../../contexts/ParameterContext';
import { useToast } from '../../contexts/ToastContext';
import FrontendLogger from '../../utils/logger';
import ParameterTabs from './ParameterManager/ParameterTabs';
import ParameterForm from './ParameterManager/ParameterForm';
import ParameterTable from './ParameterManager/ParameterTable';

/**
 * ParameterManager Index - System metric matrix architecture supervisor.
 * Orchestrates localized state bounds between forms, tabs, and datagrids.
 * Enforces strict English-only code commentary and total Hebrew UI localization.
 */
const ParameterManager = () => {
  const { parameters, loading, fetchParameters, addParameter, editParameter, removeParameter } = useParameter();
  const { showToast } = useToast();

  const [creationMode, setCreationMode] = useState('regular'); // 'regular' | 'conversion' | 'combination'
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    aggregation_strategy: 'sum',
    calculation_type: 'sum',
    source_parameter_ids: ['', ''],
    multiplier: 1
  });

  useEffect(() => {
    FrontendLogger.info('PARAMETER_MANAGER', 'Syncing operational measurement metrics registry data');
    fetchParameters();
  }, [fetchParameters]);

  const resetForms = () => {
    setEditingId(null);
    setFormData({
      name: '',
      unit: '',
      aggregation_strategy: 'sum',
      calculation_type: 'sum',
      source_parameter_ids: ['', ''],
      multiplier: 1
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.unit) {
      showToast("אנא מלא את שדות החובה של המדד (שם ויחידה)", "error");
      return;
    }

    try {
      let payload = {
        name: formData.name,
        unit: formData.unit,
        aggregation_strategy: formData.aggregation_strategy
      };

      if (creationMode === 'regular') {
        payload.is_virtual = false;
        payload.calculation_type = null;
        payload.source_parameter_ids = null;
        payload.multiplier = 1.0;
      } else if (creationMode === 'conversion') {
        if (!formData.source_parameter_ids[0]) {
          showToast("חובה לבחור פרמטר בסיס להמרה", "error");
          return;
        }
        payload.is_virtual = true;
        payload.calculation_type = 'conversion';
        payload.source_parameter_ids = [Number(formData.source_parameter_ids[0])];
        payload.multiplier = parseFloat(formData.multiplier) || 1.0;
      } else {
        if (!formData.source_parameter_ids[0] || !formData.source_parameter_ids[1]) {
          showToast("שילוב פרמטרים מחייב בחירה של שני מדדי מקור", "error");
          return;
        }
        if (formData.source_parameter_ids[0] === formData.source_parameter_ids[1]) {
          showToast("אין לבחור את אותו הפרמטר פעמיים בשילוב", "error");
          return;
        }
        payload.is_virtual = true;
        payload.calculation_type = formData.calculation_type;
        payload.source_parameter_ids = [Number(formData.source_parameter_ids[0]), Number(formData.source_parameter_ids[1])];
        payload.multiplier = parseFloat(formData.multiplier) || 1.0;
      }

      if (editingId) {
        await editParameter(editingId, payload);
        showToast("המדד עודכן בהצלחה במערכת", "success");
      } else {
        await addParameter(payload);
        showToast("המדד החדש הוקם ואושרר בהצלחה", "success");
      }
      resetForms();
    } catch (error) {
      showToast("הפעולה נכשלה, אנא בדוק את תקינות הנתונים", "error");
    }
  };

  const startEdit = (param) => {
    setEditingId(param.id);
    if (!param.is_virtual) {
      setCreationMode('regular');
      setFormData({
        name: param.name,
        unit: param.unit,
        aggregation_strategy: param.aggregation_strategy || 'max',
        calculation_type: 'sum',
        source_parameter_ids: ['', ''],
        multiplier: 1
      });
    } else if (param.calculation_type === 'conversion') {
      setCreationMode('conversion');
      setFormData({
        name: param.name,
        unit: param.unit,
        aggregation_strategy: param.aggregation_strategy || 'sum',
        calculation_type: 'conversion',
        source_parameter_ids: [param.source_parameter_ids?.[0] || '', ''],
        multiplier: param.multiplier || 1
      });
    } else {
      setCreationMode('combination');
      setFormData({
        name: param.name,
        unit: param.unit,
        aggregation_strategy: param.aggregation_strategy || 'sum',
        calculation_type: param.calculation_type || 'multiply',
        source_parameter_ids: [param.source_parameter_ids?.[0] || '', param.source_parameter_ids?.[1] || ''],
        multiplier: param.multiplier || 1
      });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("האם אתה בטוח שברצונך למחוק מדד זה? מחיקה עלולה לשבור נוסחאות התלויות בו.")) {
      try {
        await removeParameter(id);
        showToast("המדד הוסר לחלוטין מהמערכת", "success");
        if (editingId === id) resetForms();
      } catch (error) {
        showToast("שגיאה בתהליך מחיקת המדד", "error");
      }
    }
  };

  return (
    <div className="space-y-10 font-sans" dir="rtl">
      <div className="bg-white/40 backdrop-blur-md rounded-3xl p-6 border border-white/60 shadow-lg">
        <ParameterTabs
          creationMode={creationMode} 
          setCreationMode={setCreationMode} 
          setFormData={setFormData} 
          editingId={editingId} 
        />
        <ParameterForm 
          creationMode={creationMode} 
          formData={formData} 
          setFormData={setFormData} 
          parameters={parameters} 
          editingId={editingId} 
          resetForms={resetForms} 
          handleSubmit={handleSubmit} 
        />
      </div>
      <ParameterTable
        parameters={parameters} 
        loading={loading} 
        startEdit={startEdit} 
        handleDelete={handleDelete} 
      />
    </div>
  );
};

export default ParameterManager;