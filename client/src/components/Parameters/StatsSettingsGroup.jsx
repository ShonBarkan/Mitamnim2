import React from 'react';
import DashboardConfig from './DashboardConfig/DashboardConfig';
import ParameterConversions from '../Parameters/ParameterConversions';
import ParameterFormulas from '../Parameters/ParameterFormulas';

/**
 * StatsSettingsGroup Component - Layout wrapper for statistical configurations.
 * Organizes Dashboard display rules, Calculation Formulas, and Unit Conversions.
 * Implements the "Arctic Mirror" (Glassmorphism) aesthetic.
 */
const StatsSettingsGroup = () => {
  return (
    <div className="p-8 bg-transparent min-h-screen font-sans" dir="rtl">
      <div className="max-w-[1600px] mx-auto space-y-12">
        
        {/* --- HEADER SECTION --- */}
        <header className="bg-white/40 backdrop-blur-3xl rounded-[3rem] p-10 border border-white/60 shadow-2xl shadow-zinc-200/50">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-white text-lg">
              📊
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-zinc-900 uppercase">ניהול הגדרות סטטיסטיקה</h1>
          </div>
          <p className="text-zinc-500 font-bold text-sm mt-3 opacity-70 tracking-wide">
            System Logic Engine: Configure dashboard display rules, build complex formulas, and manage unit conversions.
          </p>
        </header>

        {/* --- MAIN CONFIGURATION GRID --- */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 items-start">
          
          {/* Dashboard Display Rules (Major Section - 2/3 Width) */}
          <div className="xl:col-span-2 space-y-10">
            <div className="bg-white/60 backdrop-blur-2xl rounded-[3.5rem] border border-white shadow-xl overflow-hidden">
               <DashboardConfig />
            </div>
          </div>

          {/* Logic Engine Sidebar (Minor Section - 1/3 Width) */}
          <aside className="xl:col-span-1 space-y-10">
            
            {/* Unit Conversions (e.g., Pools to Meters) */}
            <section className="bg-white/60 backdrop-blur-2xl rounded-[3rem] border border-white shadow-lg overflow-hidden">
              <ParameterConversions />
            </section>

            {/* Complex Calculation Formulas */}
            <section className="bg-white/60 backdrop-blur-2xl rounded-[3rem] border border-white shadow-lg overflow-hidden">
              <ParameterFormulas />
            </section>
            
          </aside>
        </div>
      </div>
    </div>
  );
};

export default StatsSettingsGroup;