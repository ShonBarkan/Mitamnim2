import React, { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Eye, EyeOff, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import TrainerChartTooltip from './TrainerChartTooltip';
import TrainerChartCustomizedDot from './TrainerChartCustomizedDot';

// Small wrapper component to manage state per card
const ExerciseParamCard = ({ param, formatNumber, isTrainerMode, userAvatarMap }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-[28px] border border-zinc-800 bg-zinc-900/70 backdrop-blur-xl shadow-xl flex flex-col overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="text-zinc-400 mb-2">{param.name}</div>
            <div className="text-4xl font-black">{formatNumber(param.aggregate)}</div>
          </div>

          <div className="text-xs px-3 py-2 rounded-full border border-zinc-700 bg-zinc-950 text-zinc-300">
            {param.method}
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-zinc-400 mb-5">
          <span>{param.unit}</span>
          <span>max: {formatNumber(param.max)}</span>
        </div>

        <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-l from-blue-400 to-cyan-400"
            style={{ width: `${Math.min(param.avg, 100)}%` }}
          />
        </div>
      </div>

      {isTrainerMode && param.valuesByAthlete && param.valuesByAthlete.length > 0 && (
        <div className="relative mt-auto border-t border-zinc-800/50 bg-zinc-900/50">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="w-full px-6 py-3 flex items-center justify-between text-zinc-400 hover:text-white transition-colors"
          >
            <span className="font-bold text-sm">פירוט למתאמן</span>
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {isOpen && (
            <div className="px-6 pb-6 pt-2 space-y-3">
              {param.valuesByAthlete.map((user) => (
                <div key={user.name} className="flex items-center justify-between bg-zinc-950/50 rounded-xl p-3 border border-zinc-800/50">
                  <div className="flex items-center gap-3">
                    {userAvatarMap?.[user.name] ? (
                      <img src={userAvatarMap[user.name]} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-zinc-700" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-400">
                        {user.name.charAt(0)}
                      </div>
                    )}
                    <span className="font-bold text-sm text-white truncate max-w-[120px]">{user.name}</span>
                  </div>
                  <div className="font-black text-blue-400">
                    {formatNumber(user.aggregate)} <span className="text-xs text-zinc-500">{param.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ExercisesMode = ({
  selectedExerciseData,
  formatNumber,
  exerciseTimelineData,
  normalizeChart,
  setNormalizeChart,
  visibleParameters,
  setVisibleParameters,
  generateStableColor,
  isTrainerMode,
  userAvatarMap,
  trainerSubParameter,
  setTrainerSubParameter
}) => {
  // Determine lines to draw
  let lineKeys = [];
  if (isTrainerMode) {
    if (exerciseTimelineData.length > 0) {
      // Find all unique user names from timeline data
      const usersSet = new Set();
      exerciseTimelineData.forEach(row => {
        Object.keys(row).forEach(key => {
          if (key !== 'date' && key !== 'timestamp') usersSet.add(key);
        });
      });
      lineKeys = Array.from(usersSet);
    }
  } else {
    lineKeys = selectedExerciseData.map(param => param.name);
  }

  const activeParameterUnit = isTrainerMode && trainerSubParameter !== "all" 
      ? selectedExerciseData.find(p => p.name === trainerSubParameter)?.unit || ""
      : "";

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {selectedExerciseData.map((param) => (
          <ExerciseParamCard 
            key={param.name} 
            param={param} 
            formatNumber={formatNumber} 
            isTrainerMode={isTrainerMode} 
            userAvatarMap={userAvatarMap} 
          />
        ))}
      </div>

      <div className="rounded-[32px] border border-zinc-800 bg-zinc-900/70 backdrop-blur-xl p-6">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-black mb-2">גרף התקדמות</h2>
            <p className="text-zinc-400">מעקב פרמטרים לאורך זמן {isTrainerMode ? "פר מתאמן" : ""}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!isTrainerMode && (
              <button
                onClick={() => setNormalizeChart((prev) => !prev)}
                className={`
                  px-5 py-3 rounded-2xl border transition-all font-semibold
                  ${
                    normalizeChart
                      ? "bg-blue-500 text-black border-blue-400"
                      : "bg-zinc-950 border-zinc-800"
                  }
                `}
              >
                נרמל ערכים
              </button>
            )}

            {isTrainerMode && selectedExerciseData.length > 0 && (
              <div className="relative">
                 <select
                    value={trainerSubParameter || "all"}
                    onChange={(e) => setTrainerSubParameter(e.target.value)}
                    className="appearance-none bg-zinc-950 border border-zinc-800 text-white px-5 py-3 pr-10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 font-bold w-full md:w-auto"
                 >
                    <option value="all">כל הפרמטרים (סכום כולל - לא מומלץ)</option>
                    {selectedExerciseData.map((param) => (
                      <option key={param.name} value={param.name}>
                        {param.name}
                      </option>
                    ))}
                 </select>
                 <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none" />
              </div>
            )}

            {!isTrainerMode && selectedExerciseData.map((param) => {
              const visible = visibleParameters[param.name];

              return (
                <button
                  key={param.name}
                  onClick={() =>
                    setVisibleParameters((prev) => ({
                      ...prev,
                      [param.name]: !prev[param.name],
                    }))
                  }
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all
                    ${
                      visible
                        ? "bg-green-500/15 border-green-500/30"
                        : "bg-zinc-950 border-zinc-800"
                    }
                  `}
                >
                  {visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  {param.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-[460px]">
          <ResponsiveContainer>
            <LineChart
              data={exerciseTimelineData}
              margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" stroke="#a1a1aa" tick={{ fill: "#a1a1aa" }} />
              <YAxis stroke="#a1a1aa" tick={{ fill: "#a1a1aa" }} />
              
              {isTrainerMode ? (
                <Tooltip content={<TrainerChartTooltip userAvatarMap={userAvatarMap} unit={activeParameterUnit} />} />
              ) : (
                <Tooltip
                  contentStyle={{
                    background: "#18181b",
                    border: "1px solid #27272a",
                    borderRadius: 16,
                  }}
                />
              )}
              
              <Legend />

              {lineKeys.map((key, index) => {
                if (!isTrainerMode && !visibleParameters[key]) {
                  return null;
                }

                return (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={generateStableColor(isTrainerMode ? index : key)}
                    strokeWidth={3}
                    dot={isTrainerMode ? <TrainerChartCustomizedDot userAvatarMap={userAvatarMap} stroke={generateStableColor(index)} /> : false}
                    activeDot={{ r: 6 }}
                    animationDuration={500}
                    connectNulls={true}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ExercisesMode;
