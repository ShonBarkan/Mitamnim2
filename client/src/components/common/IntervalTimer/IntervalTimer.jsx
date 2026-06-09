import React, { useState, useEffect, useRef } from 'react';
import { useIntervalMachine } from './useIntervalMachine';

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const getBgColor = (type, status, participant) => {
  if (status === 'finished') return 'bg-blue-600';
  if (status === 'paused') return 'bg-zinc-600';
  
  if (type === 'REST') return 'bg-rose-500'; 

  switch (participant) {
    case 1: return 'bg-blue-500';    
    case 2: return 'bg-amber-500';  
    case 3: return 'bg-violet-500';   
    case 4: return 'bg-emerald-500'; 
    case 5: return 'bg-pink-500';    
    default: return 'bg-blue-500';   
  }
};

const getTypeLabel = (type) => {
  switch (type) {
    case 'WORK': return 'עבודה';
    case 'REST': return 'מנוחה';
    default: return type;
  }
};

// --- Compact Setup UI Components ---

const TimeController = ({ title, value, onChange, presets }) => {
  const add = (amount) => onChange(Math.max(0, value + amount));
  
  return (
    <div className="flex flex-col gap-2 bg-white rounded-xl">
      <div className="flex justify-between items-end border-b border-zinc-200 pb-1">
        <span className="font-bold text-zinc-700">{title}</span>
        <span className="text-xl font-black text-zinc-900 font-mono" dir="ltr">
          {formatTime(value)}
        </span>
      </div>
      
      <div className="flex flex-col gap-1 w-full mt-1">
        <div className="flex gap-1 w-full">
          <button onClick={() => add(1)} className="py-1.5 flex-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-bold transition-colors" dir="ltr">+1s</button>
          <button onClick={() => add(10)} className="py-1.5 flex-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-bold transition-colors" dir="ltr">+10s</button>
          <button onClick={() => add(30)} className="py-1.5 flex-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-bold transition-colors" dir="ltr">+30s</button>
          <button onClick={() => add(60)} className="py-1.5 flex-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-bold transition-colors" dir="ltr">+1m</button>
        </div>
        <div className="flex gap-1 w-full">
          <button onClick={() => add(-1)} className="py-1.5 flex-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-sm font-bold transition-colors" dir="ltr">-1s</button>
          <button onClick={() => add(-10)} className="py-1.5 flex-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-sm font-bold transition-colors" dir="ltr">-10s</button>
          <button onClick={() => add(-30)} className="py-1.5 flex-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-sm font-bold transition-colors" dir="ltr">-30s</button>
          <button onClick={() => add(-60)} className="py-1.5 flex-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-sm font-bold transition-colors" dir="ltr">-1m</button>
        </div>
      </div>

      <div className="flex gap-1 mt-1">
        {presets.map((p, i) => (
          <button 
            key={i} 
            onClick={() => onChange(p.val)}
            className="flex-1 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md text-xs font-bold transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
};


const IntervalTimer = () => {
  const {
    config,
    setConfig,
    status,
    currentInterval,
    nextInterval, 
    timeRemaining,
    handleStart,
    handlePause,
    handleResume,
    handleReset,
    handleSkip,
    totalIntervals,
    currentIndex
  } = useIntervalMachine();

  // TTS (Text-to-Speech) State & Ref
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const lastSpokenIndex = useRef(-1);

  const updateConfig = (key, val) => setConfig(prev => ({ ...prev, [key]: val }));

  // Helper to trigger speech synthesis
  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); // Stop any currently reading text
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'he-IL';
    window.speechSynthesis.speak(utterance);
  };

  // Reset speech tracker when entering setup
  useEffect(() => {
    if (status === 'setup') {
      lastSpokenIndex.current = -1;
    }
  }, [status]);

  const nextParticipant = nextInterval?.participant;

  // Trigger speech when interval changes
  useEffect(() => {
    if (status === 'running' && isSpeechEnabled && currentInterval) {
      if (lastSpokenIndex.current !== currentIndex) {
        
        if (currentInterval.type === 'WORK') {
          if (config.numParticipants > 1) {
            speakText(`עבודה. מספר ${currentInterval.participant}`);
          } else {
            speakText(`עבודה`);
          }
        } else if (currentInterval.type === 'REST') {
          if (nextInterval) {
            if (config.numParticipants > 1) {
              speakText(`מנוחה. מספר ${nextParticipant} תתכונן`);
            } else {
              speakText(`מנוחה.`);
            }
          } else {
            speakText(`מנוחה`);
          }
        }
        
        lastSpokenIndex.current = currentIndex;
      }
    }
  }, [currentIndex, status, isSpeechEnabled, currentInterval, nextInterval, config.numParticipants, nextParticipant]);


  if (status === 'setup') {
    return (
      <div dir="rtl" className="w-full mx-auto pb-4">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-6">
          
          {/* Column 1: Times */}
          <div className="space-y-6">
            <TimeController 
              title="זמן עבודה" 
              value={config.workDuration} 
              onChange={(v) => updateConfig('workDuration', v)} 
              presets={[
                { label: '30s', val: 30 },
                { label: '45s', val: 45 },
                { label: '1m', val: 60 },
                { label: '2m', val: 120 }
              ]}
            />
            
            <TimeController 
              title="זמן מנוחה" 
              value={config.restBetweenSets} 
              onChange={(v) => updateConfig('restBetweenSets', v)} 
              presets={[
                { label: '10s', val: 10 },
                { label: '20s', val: 20 },
                { label: '30s', val: 30 },
                { label: '1m', val: 60 }
              ]}
            />
          </div>

          {/* Column 2: Sets and Participants */}
          <div className="space-y-6">
            
            {/* Sets Configuration */}
            <div>
              <div className="flex justify-between items-end border-b border-zinc-200 pb-1 mb-2">
                <span className="font-bold text-zinc-700">מספר סטים לאחד</span>
                <span className="text-xl font-black text-zinc-900 font-mono">{config.numSets}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => updateConfig('numSets', Math.max(1, config.numSets - 1))} className="flex-1 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-bold">-1</button>
                <button onClick={() => updateConfig('numSets', config.numSets + 1)} className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-bold">+1</button>
                <div className="w-px bg-zinc-200 mx-1"></div>
                <button onClick={() => updateConfig('numSets', 3)} className="flex-1 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-bold">3</button>
                <button onClick={() => updateConfig('numSets', 5)} className="flex-1 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-bold">5</button>
                <button onClick={() => updateConfig('numSets', 10)} className="flex-1 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-bold">10</button>
              </div>
            </div>

            {/* Participants Configuration */}
            <div>
              <span className="font-bold text-zinc-700 border-b border-zinc-200 pb-1 mb-2 block">מספר משתתפים</span>
              <div className="flex gap-2 w-full">
                {[1, 2, 3, 4, 5].map(n => (
                  <button 
                    key={n} 
                    onClick={() => updateConfig('numParticipants', n)}
                    className={`flex-1 py-2 rounded-lg font-black transition-colors ${
                      config.numParticipants === n 
                        ? 'bg-zinc-900 text-white' 
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Multi-participant specific options */}
            {config.numParticipants > 1 && (
              <div className="flex flex-col gap-3 animate-in fade-in duration-300 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                
                {/* Rotation Mode */}
                <div>
                  <span className="text-xs font-bold text-zinc-500 mb-1 block">איך עובדים?</span>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => updateConfig('rotationMode', 'alternating')}
                      className={`flex-1 py-1.5 px-2 rounded-md text-xs font-bold transition-colors border ${
                        config.rotationMode === 'alternating' 
                          ? 'bg-zinc-800 text-white border-zinc-800' 
                          : 'bg-white text-zinc-600 hover:bg-zinc-100 border-zinc-200'
                      }`}
                    >
                      לסירוגין
                    </button>
                    <button 
                      onClick={() => updateConfig('rotationMode', 'sequential')}
                      className={`flex-1 py-1.5 px-2 rounded-md text-xs font-bold transition-colors border ${
                        config.rotationMode === 'sequential' 
                          ? 'bg-zinc-800 text-white border-zinc-800' 
                          : 'bg-white text-zinc-600 hover:bg-zinc-100 border-zinc-200'
                      }`}
                    >
                      ברצף 
                    </button>
                  </div>
                </div>

                {/* Rest Frequency */}
                {config.restBetweenSets > 0 && (
                  <div>
                    <span className="text-xs font-bold text-zinc-500 mb-1 block">מתי נחים?</span>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => updateConfig('restFrequency', 'after_each')}
                        className={`flex-1 py-1.5 px-2 rounded-md text-xs font-bold transition-colors border ${
                          config.restFrequency === 'after_each' 
                            ? 'bg-zinc-800 text-white border-zinc-800' 
                            : 'bg-white text-zinc-600 hover:bg-zinc-100 border-zinc-200'
                        }`}
                      >
                        אחרי כל סט
                      </button>
                      <button 
                        onClick={() => updateConfig('restFrequency', 'after_round')}
                        className={`flex-1 py-1.5 px-2 rounded-md text-xs font-bold transition-colors border ${
                          config.restFrequency === 'after_round' 
                            ? 'bg-zinc-800 text-white border-zinc-800' 
                            : 'bg-white text-zinc-600 hover:bg-zinc-100 border-zinc-200'
                        }`}
                      >
                        אחרי סבב מלא
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
          </div>
        </div>

        <button 
          onClick={handleStart}
          className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-black py-4 rounded-xl text-lg transition-colors flex items-center justify-center gap-2"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          התחל טיימר 
        </button>
      </div>
    );
  }

  const isFinished = status === 'finished';
  const bgColor = getBgColor(currentInterval?.type, status, currentInterval?.participant);

  return (
    <div dir="rtl" className={`relative w-full min-h-[450px] flex flex-col items-center justify-center p-6 rounded-2xl transition-colors duration-500 text-white ${bgColor}`}>
      
      {/* TTS Toggle Button */}
      <button 
        onClick={() => setIsSpeechEnabled(!isSpeechEnabled)}
        className="absolute top-4 left-4 p-3 bg-black/10 hover:bg-black/20 backdrop-blur-md rounded-full transition-colors z-10"
        title={isSpeechEnabled ? 'השתק הקראה קולית' : 'הפעל הקראה קולית'}
      >
        {isSpeechEnabled ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <line x1="23" y1="1" x2="1" y2="23"></line>
          </svg>
        )}
      </button>

      {!isFinished && currentInterval && (
        <div className="text-center mb-8 mt-4">
          <h3 className="text-3xl md:text-4xl font-black tracking-widest opacity-90">
            {getTypeLabel(currentInterval.type)}
          </h3>
          <p className="text-xl md:text-2xl mt-2 font-bold opacity-95">
            {currentInterval.type === 'WORK' && (
              <>
                {config.numParticipants > 1 && `מספר ${currentInterval.participant} • `}
                {`סט ${currentInterval.set} מתוך ${config.numSets}`}
              </>
            )}
            {currentInterval.type === 'REST' && nextInterval && (
              config.numParticipants > 1 
                ? `מספר ${nextParticipant} סט הבא... תתכונן!`
                : `סט הבא... תתכונן!`
            )}
          </p>
          <p className="text-sm mt-2 opacity-75 font-bold">
            אינטרוול {currentIndex + 1} מתוך {totalIntervals}
          </p>
        </div>
      )}

      {isFinished && (
        <div className="text-center mb-8 mt-4">
          <h3 className="text-4xl md:text-5xl font-black tracking-widest mb-3">זהו !</h3>
          <p className="text-xl md:text-2xl font-bold opacity-90">כל הכבוד, עבודה מעולה!</p>
        </div>
      )}

      <div className="text-[6rem] sm:text-[8rem] md:text-[10rem] font-mono font-black leading-none mb-10 tabular-nums drop-shadow-md" dir="ltr">
        {formatTime(timeRemaining)}
      </div>

      <div className="flex flex-wrap justify-center gap-3 w-full max-w-lg">
        {status === 'running' && (
          <button onClick={handlePause} className="flex-1 min-w-[120px] bg-white text-zinc-900 font-black py-3 px-4 rounded-xl hover:bg-zinc-100 transition-colors text-lg">
            השהה
          </button>
        )}
        
        {status === 'paused' && !isFinished && (
          <button onClick={handleResume} className="flex-1 min-w-[120px] bg-white text-zinc-900 font-black py-3 px-4 rounded-xl hover:bg-zinc-100 transition-colors text-lg">
            המשך
          </button>
        )}

        {!isFinished && (
          <button onClick={handleSkip} className="flex-1 min-w-[120px] bg-white/20 text-white font-black py-3 px-4 rounded-xl hover:bg-white/30 transition-colors text-lg">
            דלג הלאה
          </button>
        )}

        <button onClick={handleReset} className="flex-1 min-w-[120px] bg-black/30 text-white font-black py-3 px-4 rounded-xl hover:bg-black/40 transition-colors text-lg">
          איפוס
        </button>
      </div>

    </div>
  );
};

export default IntervalTimer;