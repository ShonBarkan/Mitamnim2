import React from 'react';

/**
 * CrossTraineeExerciseView Component - Transposes collective dataset maps into an Exercise-First view.
 * Loops over unique exercise identifiers and cross-references performance data rows across all group trainees.
 */
const CrossTraineeExerciseView = ({ statsData }) => {
  const memberBreakdown = statsData?.member_breakdown || [];

  // Re-map row vectors dynamically to extract individual performance scores per exercise profile
  const exerciseGroupedMatrix = React.useMemo(() => {
    const exerciseMap = {};

    memberBreakdown.forEach(member => {
      const exercises = member.exercises || [];
      exercises.forEach(ex => {
        if (!exerciseMap[ex.exercise_id]) {
          exerciseMap[ex.exercise_id] = {
            exercise_id: ex.exercise_id,
            exercise_name: ex.exercise_name,
            membersPerformances: []
          };
        }

        exerciseMap[ex.exercise_id].membersPerformances.push({
          userId: member.user_id,
          fullName: member.full_name,
          metrics: ex.metrics || []
        });
      });
    });

    return Object.values(exerciseMap);
  }, [memberBreakdown]);

  return (
    <div className="space-y-10" dir="rtl">
      
      <div className="flex items-center gap-4 px-2 select-none">
        <div className="w-2 h-2 rounded-full bg-blue-600" />
        <h3 className="text-2xl font-black text-zinc-900 uppercase tracking-tight">השוואת ביצועים רוחבית</h3>
        <div className="h-px flex-1 bg-gradient-to-l from-white/80 to-transparent mr-2" />
      </div>

      {exerciseGroupedMatrix.length > 0 ? (
        <div className="space-y-8">
          {exerciseGroupedMatrix.map((exGroup) => (
            <div key={exGroup.exercise_id} className="bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[3rem] p-8 shadow-xl space-y-6 animate-in fade-in duration-500">
              
              <header className="px-2 border-b border-white/40 pb-4">
                <h4 className="text-2xl font-black text-zinc-900 m-0 tracking-tight uppercase leading-none">
                  {exGroup.exercise_name}
                </h4>
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mt-1.5 font-mono select-none">
                  Cross-Trainee Aggregate Target Metric Sheets
                </p>
              </header>

              {/* Trainees Performance Stack List Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {exGroup.membersPerformances.map((memberPerf, mIdx) => (
                  <div key={`${memberPerf.userId}-${mIdx}`} className="bg-white/70 border border-white/90 p-5 rounded-2xl shadow-sm space-y-4 hover:bg-white hover:scale-[1.02] transition-all duration-300">
                    
                    {/* Trainee Node Identity */}
                    <div className="flex items-center gap-3 border-b border-zinc-100/60 pb-3 select-none">
                      <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-black text-xs font-mono uppercase">
                        {memberPerf.fullName?.[0] || '?'}
                      </div>
                      <span className="text-sm font-black text-zinc-900 tracking-tight truncate">
                        {memberPerf.fullName}
                      </span>
                    </div>

                    {/* Mapped Internal Metric Cells */}
                    <div className="space-y-2">
                      {memberPerf.metrics.map((mCell, cIdx) => (
                        <div key={`${mCell.parameter_id}-${cIdx}`} className="flex justify-between items-center text-xs">
                          <span className="font-bold text-zinc-400 uppercase select-none">{mCell.parameter_name}:</span>
                          <div className="flex items-baseline gap-1 font-mono font-black text-zinc-800">
                            <span>{mCell.computed_value}</span>
                            <span className="text-[9px] text-blue-500 font-sans uppercase font-normal">{mCell.unit}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>
                ))}
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white/20 backdrop-blur-sm rounded-[2.5rem] border-2 border-dashed border-white/40 select-none pointer-events-none">
          <span className="text-3xl block mb-2 opacity-30">🏋️‍♂️</span>
          <p className="text-xs font-black text-zinc-400 uppercase tracking-widest italic m-0">לא נמצאו רשומות ביצוע קבוצתיות בטווח הנוכחי</p>
        </div>
      )}
    </div>
  );
};

export default CrossTraineeExerciseView;