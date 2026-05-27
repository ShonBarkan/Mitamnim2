import React from 'react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Eye, EyeOff } from 'lucide-react';

const ExercisesMode = ({
  selectedExerciseData,
  formatNumber,
  exerciseTimelineData,
  normalizeChart,
  setNormalizeChart,
  visibleParameters,
  setVisibleParameters,
  generateStableColor
}) => {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {selectedExerciseData.map((param) => (
          <div
            key={param.name}
            className="rounded-[28px] border border-zinc-800 bg-zinc-900/70 backdrop-blur-xl p-6"
          >
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
        ))}
      </div>

      <div className="rounded-[32px] border border-zinc-800 bg-zinc-900/70 backdrop-blur-xl p-6">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-black mb-2">גרף התקדמות</h2>
            <p className="text-zinc-400">מעקב פרמטרים לאורך זמן</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
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

            {selectedExerciseData.map((param) => {
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
              <Tooltip
                contentStyle={{
                  background: "#18181b",
                  border: "1px solid #27272a",
                  borderRadius: 16,
                }}
              />
              <Legend />

              {selectedExerciseData.map((param) => {
                if (!visibleParameters[param.name]) {
                  return null;
                }

                return (
                  <Line
                    key={param.name}
                    type="monotone"
                    dataKey={param.name}
                    stroke={generateStableColor(param.name)}
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

export default ExercisesMode;
