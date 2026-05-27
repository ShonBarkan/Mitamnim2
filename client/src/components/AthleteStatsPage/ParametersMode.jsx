import React from 'react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Eye, EyeOff } from 'lucide-react';

const ParametersMode = ({
  selectedParameter,
  selectedParameterData,
  formatNumber,
  parameterExerciseBreakdown,
  parameterTimelineData,
  visibleExercises,
  setVisibleExercises,
  generateStableColor
}) => {
  return (
    <div className="space-y-8">
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
            <p className="text-zinc-400">התקדמות לאורך זמן לפי תרגילים</p>
          </div>

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
              <Tooltip
                contentStyle={{
                  background: "#18181b",
                  border: "1px solid #27272a",
                  borderRadius: 16,
                }}
              />
              <Legend />

              {parameterExerciseBreakdown.map((item) => {
                if (!visibleExercises[item.exerciseName]) {
                  return null;
                }

                return (
                  <Line
                    key={item.exerciseName}
                    type="monotone"
                    dataKey={item.exerciseName}
                    stroke={generateStableColor(item.exerciseName)}
                    strokeWidth={3}
                    dot={false}
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
