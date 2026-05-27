import React, { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Eye, EyeOff, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import TrainerChartTooltip from './TrainerChartTooltip';
import TrainerChartCustomizedDot from './TrainerChartCustomizedDot';

const ParametersMode = ({
  selectedParameter,
  selectedParameterData,
  formatNumber,
  parameterExerciseBreakdown,
  parameterTimelineData,
  visibleExercises,
  setVisibleExercises,
  generateStableColor,
  isTrainerMode,
  userAvatarMap,
  trainerSubExercise,
  setTrainerSubExercise
}) => {
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);

  // Determine lines to draw
  let lineKeys = [];
  if (isTrainerMode) {
    if (parameterTimelineData.length > 0) {
      // Find all unique user names from timeline data
      const usersSet = new Set();
      parameterTimelineData.forEach(row => {
        Object.keys(row).forEach(key => {
          if (key !== 'date' && key !== 'timestamp') usersSet.add(key);
        });
      });
      lineKeys = Array.from(usersSet);
    }
  } else {
    lineKeys = parameterExerciseBreakdown.map(item => item.exerciseName);
  }

  // Calculate trainer specific aggregate per user for the parameter
  let trainerParameterBreakdown = [];
  if (isTrainerMode && selectedParameterData?.valuesByAthlete) {
    trainerParameterBreakdown = selectedParameterData.valuesByAthlete.sort((a, b) => b.aggregate - a.aggregate);
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="rounded-[32px] border border-zinc-800 bg-zinc-900/70 backdrop-blur-xl p-8 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent" />

          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div>
              <div className="text-zinc-400 mb-3">{selectedParameter.name}</div>

              <div className="text-5xl md:text-7xl font-black">
                {formatNumber(selectedParameterData.aggregate)}{" "}
                <span className="text-3xl text-zinc-400">{selectedParameter.unit}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-2xl bg-zinc-950/70 border border-zinc-800 p-5">
                <div className="text-zinc-500 text-sm mb-2">מדידות</div>
                <div className="text-2xl font-black">{selectedParameterData.count}</div>
              </div>

              <div className="rounded-2xl bg-zinc-950/70 border border-zinc-800 p-5">
                <div className="text-zinc-500 text-sm mb-2">ממוצע</div>
                <div className="text-2xl font-black">{formatNumber(selectedParameterData.average)}</div>
              </div>

              <div className="rounded-2xl bg-zinc-950/70 border border-zinc-800 p-5">
                <div className="text-zinc-500 text-sm mb-2">מקסימום</div>
                <div className="text-2xl font-black">{formatNumber(selectedParameterData.max)}</div>
              </div>
            </div>
          </div>
        </div>

        {isTrainerMode && trainerParameterBreakdown.length > 0 && (
          <div className="rounded-[24px] border border-zinc-800 bg-zinc-900/50 overflow-hidden transition-all duration-300">
            <button 
              onClick={() => setIsBreakdownOpen(!isBreakdownOpen)}
              className="w-full p-4 flex items-center justify-between text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
            >
              <span className="font-bold text-sm">הצג פילוח מתאמנים ({selectedParameter.name})</span>
              {isBreakdownOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            
            {isBreakdownOpen && (
              <div className="p-4 pt-0 border-t border-zinc-800/50 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                {trainerParameterBreakdown.map((user) => (
                  <div key={user.name} className="bg-zinc-950 rounded-2xl p-4 border border-zinc-800/50 flex items-center gap-4">
                    {userAvatarMap?.[user.name] ? (
                      <img src={userAvatarMap[user.name]} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-zinc-700" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-bold text-zinc-400">
                        {user.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-white truncate">{user.name}</div>
                      <div className="text-sm font-black text-green-400">
                        {formatNumber(user.aggregate)} <span className="text-xs text-zinc-500">{selectedParameter.unit}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl text-white font-black">פילוח לפי תרגיל</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {parameterExerciseBreakdown.map((item) => (
            <div key={item.exerciseName} className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5">
              <div className="flex justify-between items-center mb-5">
                <div className="font-bold text-lg">{item.exerciseName}</div>

                <div className="font-black text-2xl">
                  {formatNumber(item.value)}{" "}
                  <span className="text-zinc-400 text-base">{item.unit}</span>
                </div>
              </div>

              <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-green-400 to-green-600"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[32px] border border-zinc-800 bg-zinc-900/70 backdrop-blur-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-black mb-2">ציר זמן</h2>
            <p className="text-zinc-400">התקדמות לאורך זמן {isTrainerMode ? "פר מתאמן" : "לפי תרגילים"}</p>
          </div>

          {isTrainerMode && parameterExerciseBreakdown.length > 0 && (
            <div className="relative">
               <select
                  value={trainerSubExercise || "all"}
                  onChange={(e) => setTrainerSubExercise(e.target.value)}
                  className="appearance-none bg-zinc-950 border border-zinc-800 text-white px-5 py-3 pr-10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 font-bold w-full md:w-auto"
               >
                  <option value="all">כל התרגילים (הגבוה ביותר מבין כולם)</option>
                  {parameterExerciseBreakdown.map((item) => (
                    <option key={item.exerciseName} value={item.exerciseName}>
                      {item.exerciseName}
                    </option>
                  ))}
               </select>
               <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none" />
            </div>
          )}

          {!isTrainerMode && (
            <div className="flex flex-wrap gap-3">
              {parameterExerciseBreakdown.map((item) => {
                const visible = visibleExercises[item.exerciseName];

                return (
                  <button
                    key={item.exerciseName}
                    onClick={() =>
                      setVisibleExercises((prev) => ({
                        ...prev,
                        [item.exerciseName]: !prev[item.exerciseName],
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
                    {item.exerciseName}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="h-[420px] w-full">
          <ResponsiveContainer>
            <LineChart
              data={parameterTimelineData}
              margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" stroke="#a1a1aa" tick={{ fill: "#a1a1aa" }} />
              <YAxis stroke="#a1a1aa" tick={{ fill: "#a1a1aa" }} />
              
              {isTrainerMode ? (
                <Tooltip content={<TrainerChartTooltip userAvatarMap={userAvatarMap} unit={selectedParameter.unit} />} />
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
                if (!isTrainerMode && !visibleExercises[key]) {
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

export default ParametersMode;
