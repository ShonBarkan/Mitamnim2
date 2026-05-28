import React from 'react';
import { RefreshCcw } from 'lucide-react';

const ErrorState = ({ loadStatistics }) => {
  return (
    <div dir="rtl" className="min-h-screen bg-[#09090B] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-10 text-center">
          <div className="flex justify-center mb-5">
            <RefreshCcw className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold mb-3">שגיאה בטעינת הנתונים</h2>
          <p className="text-zinc-300 mb-6">לא הצלחנו לטעון את הסטטיסטיקות כרגע</p>
          <button
            onClick={loadStatistics}
            className="inline-flex items-center gap-2 rounded-2xl bg-red-500 hover:bg-red-400 transition-all px-6 py-3 font-semibold"
          >
            <RefreshCcw className="w-4 h-4" />
            נסה שוב
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorState;
