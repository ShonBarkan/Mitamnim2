import React, { useContext, useEffect } from 'react';
import { useParameter } from '../../contexts/ParameterContext';
import { ExerciseContext } from '../../contexts/ExerciseContext';
import { ActivityContext } from '../../contexts/ActivityContext';
import { ActiveParamContext } from '../../contexts/ActiveParamContext';
import ConversionConfig from './ConversionConfig';
import FormulaConfig from './FormulaConfig';
import DashboardConfig from './DashboardConfig';

const StatsSettingsGroup = () => {
  const { parameters } = useParameter(); 
  const { exercises, fetchExercises } = useContext(ExerciseContext);
  const { logs, fetchLogs } = useContext(ActivityContext);
  const { activeParams, fetchActiveParams } = useContext(ActiveParamContext);

  useEffect(() => {
    const loadRequiredData = async () => {
      try {
        console.log("StatsSettingsGroup: Syncing exercises, logs, and active params...");
        await Promise.all([
          fetchExercises(),
          fetchLogs(),
          fetchActiveParams()
        ]);
      } catch (error) {
        console.error("StatsSettingsGroup: Failed to sync data", error);
      }
    };

    loadRequiredData();
  }, [fetchExercises, fetchLogs, fetchActiveParams]);

  return (
    <div style={{ 
      marginTop: '40px', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '30px',
      direction: 'rtl',
      backgroundColor: '#f8f9fa',
      padding: '25px',
      borderRadius: '16px',
      border: '1px solid #e9ecef'
    }}>
      <div style={{ textAlign: 'right', marginBottom: '10px' }}>
        <h3 style={{ margin: 0, color: '#1a1a1a', fontSize: '1.5rem', fontWeight: '800' }}>
          הגדרות סטטיסטיקה וניהול דשבורד
        </h3>
        <p style={{ margin: '5px 0 0 0', color: '#6c757d', fontSize: '0.9rem' }}>
          נהל את האופן שבו המערכת מחשבת ומציגה נתונים עבור הקבוצה שלך.
        </p>
      </div>

      <section>
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ backgroundColor: '#6f42c1', width: '4px', height: '20px', borderRadius: '2px' }}></span>
          <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#444' }}>נראות ולוח תוצאות</h4>
        </div>
        {/* Added activeParams to props */}
        <DashboardConfig exercises={exercises} logs={logs} activeParams={activeParams} />
      </section>

      <section>
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ backgroundColor: '#007bff', width: '4px', height: '20px', borderRadius: '2px' }}></span>
          <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#444' }}>לוגיקת חישובים והמרות</h4>
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
          gap: '20px' 
        }}>
          <ConversionConfig parameters={parameters} />
          <FormulaConfig parameters={parameters} />
        </div>
      </section>

      <div style={{ 
        textAlign: 'center', 
        fontSize: '0.8rem', 
        color: '#adb5bd', 
        borderTop: '1px solid #dee2e6', 
        paddingTop: '15px' 
      }}>
        כל השינויים בהגדרות אלו משפיעים על חישובי הסטטיסטיקה בזמן אמת עבור כל חברי הקבוצה.
      </div>
    </div>
  );
};

export default StatsSettingsGroup;