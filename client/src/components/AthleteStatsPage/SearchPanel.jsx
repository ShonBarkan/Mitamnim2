import React from 'react';
import { Search } from 'lucide-react';

const SearchPanel = ({
  analyticsMode,
  searchValue,
  setSearchValue,
  filteredSearchResults,
  selectedParameter,
  handleParameterSelect,
  selectedExercise,
  handleExerciseSelect
}) => {
  return (
    <div className="rounded-[30px] border border-zinc-800 bg-zinc-900/70 backdrop-blur-xl p-5">
      <div className="relative mb-5">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />

        <input
          aria-label="search"
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder={
            analyticsMode === "parameters" ? "חפש פרמטר..." : "חפש תרגיל..."
          }
          className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pr-12 pl-4 outline-none focus:border-green-500 transition-all"
        />
      </div>

      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
        {!filteredSearchResults.length ? (
          <div className="text-center py-12 text-zinc-400">לא נמצאו תוצאות</div>
        ) : analyticsMode === "parameters" ? (
          filteredSearchResults.map((parameter) => {
            const active = selectedParameter?.id === parameter.id;

            return (
              <button
                key={parameter.id}
                onClick={() => handleParameterSelect(parameter)}
                className={`
                  w-full rounded-2xl border p-4 transition-all text-right
                  ${
                    active
                      ? "border-green-500 bg-green-500/10"
                      : "border-zinc-800 bg-zinc-950/70 hover:border-zinc-700"
                  }
                `}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-bold text-lg">{parameter.name}</div>
                    <div className="text-sm text-zinc-400 mt-1">{parameter.unit}</div>
                  </div>
                  <div className="text-sm text-zinc-400">{parameter.appearances} מופעים</div>
                </div>
              </button>
            );
          })
        ) : (
          filteredSearchResults.map((exercise) => {
            const active = selectedExercise?.id === exercise.id;

            return (
              <button
                key={exercise.id}
                onClick={() => handleExerciseSelect(exercise)}
                className={`
                  w-full rounded-2xl border p-4 transition-all text-right
                  ${
                    active
                      ? "border-green-500 bg-green-500/10"
                      : "border-zinc-800 bg-zinc-950/70 hover:border-zinc-700"
                  }
                `}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-bold text-lg">{exercise.name}</div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      {exercise.tags?.map((tag) => (
                        <div
                          key={tag.id}
                          className="px-3 py-1 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: `${tag.color}20`,
                            border: `1px solid ${tag.color}50`,
                            color: tag.color,
                          }}
                        >
                          {tag.name}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-sm text-zinc-400">{exercise.appearances} מופעים</div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SearchPanel;
