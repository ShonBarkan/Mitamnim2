import React from 'react';
import SubExerciseCreator from './TrainerControls/SubExerciseCreator';
import ParameterLinker from './TrainerControls/ParameterLinker';

const TrainerControls = ({ 
    isTrainer, 
    hasParameters, 
    hasSubExercises, 
    parameters, 
    onLinkParam, 
    onAfterCreate,
    newSubExName, 
    setNewSubExName, 
    onAddSub 
}) => {
    if (!isTrainer) return null;

    // הגדרת פריסה דינמית: אם שניהם מוצגים, הם יהיו זה לצד זה ב-Desktop
    const gridCols = (!hasParameters && !hasSubExercises) ? 'lg:grid-cols-2' : 'grid-cols-1';

    return (
        <section className="mt-16 space-y-6 font-sans" dir="rtl">
            {/* Header for Trainer Area */}
            <div className="flex items-center gap-4 px-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-zinc-900 text-white shadow-lg shadow-zinc-200">
                    <span className="text-lg">🛠️</span>
                </div>
                <div>
                    <h3 className="text-xl font-black text-zinc-900 leading-none">ניהול מאמן</h3>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mt-1">Trainer Control Panel</p>
                </div>
                <div className="h-px flex-1 bg-gradient-to-l from-zinc-100 to-transparent mr-4" />
            </div>

            {/* Controls Grid */}
            <div className={`grid ${gridCols} gap-8 p-8 bg-slate-50/50 border border-zinc-100 rounded-[3rem] relative overflow-hidden`}>
                
                {/* Decorative background element */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-zinc-900 opacity-20" />

                {!hasSubExercises && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                        <ParameterLinker 
                            parameters={parameters}
                            onLinkParam={onLinkParam}
                            onAfterCreate={onAfterCreate}
                        />
                    </div>
                )}

                {!hasParameters && (
                    <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                        <SubExerciseCreator
                            newSubExName={newSubExName}
                            setNewSubExName={setNewSubExName}
                            onAddSub={onAddSub}
                        />
                    </div>
                )}

                {/* Empty State / All Linked Warning */}
                {hasParameters && hasSubExercises && (
                    <div className="py-10 text-center col-span-full">
                        <div className="inline-block p-4 bg-white rounded-3xl border border-zinc-100 shadow-sm">
                            <p className="text-sm font-bold text-zinc-400 italic">
                                התרגיל מוגדר במלואו (כולל תתי-תרגילים ופרמטרים)
                            </p>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Context Notice */}
            <p className="text-center text-[9px] font-black text-zinc-300 uppercase tracking-widest">
                * Only visible to authorized coaching staff
            </p>
        </section>
    );
};

export default TrainerControls;