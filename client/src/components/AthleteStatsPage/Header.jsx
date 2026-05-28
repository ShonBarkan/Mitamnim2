import React from 'react';
import { BarChart3 } from 'lucide-react';

const Header = ({ statsData, dateFilter, setDateFilter, loadingStats }) => {
  return (
    <div className="rounded-[32px] border border-zinc-800 bg-zinc-900/70 backdrop-blur-xl p-6 md:p-10 shadow-2xl">
      <div className="flex flex-col lg:flex-row gap-6 justify-between">
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-14 h-14 rounded-2xl bg-green-500/15 border border-green-500/20 flex items-center justify-center">
              <BarChart3 className="w-7 h-7 text-green-400" />
            </div>

            <div>
              <h1 className="text-3xl text-white md:text-5xl font-black tracking-tight">
                סטטיסטיקות אימונים
              </h1>

              <p className="text-zinc-400 mt-2 text-sm md:text-base">
                מעקב ביצועים, נפחים והתקדמות לאורך זמן
              </p>
            </div>
          </div>

          {statsData?.first_name && (
            <div className="flex items-center gap-4 mt-6">
              <img
                src={statsData.profile_picture}
                alt={statsData.first_name}
                className="w-14 h-14 rounded-2xl object-cover border border-zinc-700"
              />

              <div>
                <div className="font-bold text-lg">
                  {statsData.first_name} {statsData.second_name}
                </div>

                <div className="text-zinc-400 text-sm">
                  פלטפורמת אנליטיקות אתלט
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-3">
            {[
              { key: "all", label: "הכל" },
              { key: "today", label: "היום" },
              { key: "week", label: "השבוע" },
              { key: "month", label: "החודש" },
            ].map((filter) => {
              const active = dateFilter === filter.key;

              return (
                <button
                  key={filter.key}
                  disabled={loadingStats}
                  onClick={() => setDateFilter(filter.key)}
                  className={`
                    px-5 py-3 rounded-2xl transition-all duration-200 font-semibold border
                    ${
                      active
                        ? "bg-green-500 text-black border-green-400 shadow-lg shadow-green-500/20"
                        : "bg-zinc-900/70 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800"
                    }
                    disabled:opacity-50
                  `}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
