import React from 'react';
import DashboardConfig from './DashboardConfig/DashboardConfig';

/**
 * Main layout component for statistics and parameter configuration.
 * Organizes dashboard rules, formulas, and conversions in a clean grid.
 */
const StatsSettingsGroup = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-black text-gray-800">ניהול הגדרות סטטיסטיקה</h1>
          <p className="text-gray-500 text-sm mt-1">
            הגדרת חוקי תצוגה לדשבורד, בניית נוסחאות חישוב וניהול המרות יחידות.
          </p>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          {/* Main Configuration Section - Dashboard Rules */}
          <div className="xl:col-span-2 space-y-6">
            <DashboardConfig />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsSettingsGroup;