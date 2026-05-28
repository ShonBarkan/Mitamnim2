import React from 'react';

const ModeTabs = ({ analyticsMode, setAnalyticsMode, setSelectedExercise, setSelectedParameter }) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <button
        onClick={() => {
          setAnalyticsMode("parameters");
          setSelectedExercise(null);
        }}
        className={`
          rounded-3xl border p-5 text-lg font-bold transition-all
          ${
            analyticsMode === "parameters"
              ? "bg-green-500 text-black border-green-400"
              : "bg-zinc-900/70 border-zinc-800 hover:bg-zinc-800"
          }
        `}
      >
        פרמטרים
      </button>

      <button
        onClick={() => {
          setAnalyticsMode("exercises");
          setSelectedParameter(null);
        }}
        className={`
          rounded-3xl border p-5 text-lg font-bold transition-all
          ${
            analyticsMode === "exercises"
              ? "bg-green-500 text-black border-green-400"
              : "bg-zinc-900/70 border-zinc-800 hover:bg-zinc-800"
          }
        `}
      >
        תרגילים
      </button>
    </div>
  );
};

export default ModeTabs;
