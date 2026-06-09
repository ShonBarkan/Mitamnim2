import { useState, useEffect, useRef, useCallback } from 'react';

let audioCtx = null;

const playBeep = (type) => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  if (type === 'warning') {
    oscillator.frequency.value = 600; 
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
  } else if (type === 'transition') {
    oscillator.frequency.value = 1000;
    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.5);
  }
};

const generateIntervals = (config) => {
  const intervals = [];
  const { 
    workDuration, 
    numSets, 
    numParticipants, 
    rotationMode, 
    restBetweenSets,
    restFrequency 
  } = config;

  if (rotationMode === 'sequential') {
    for (let p = 1; p <= numParticipants; p++) {
      for (let s = 1; s <= numSets; s++) {
        intervals.push({ type: 'WORK', duration: workDuration, participant: p, set: s });
        
        if (restBetweenSets > 0) {
          if (restFrequency === 'after_each') {
            if (!(p === numParticipants && s === numSets)) {
              intervals.push({ type: 'REST', duration: restBetweenSets, participant: null, set: null });
            }
          } else if (restFrequency === 'after_round') {
            if (s === numSets && p < numParticipants) {
              intervals.push({ type: 'REST', duration: restBetweenSets, participant: null, set: null });
            }
          }
        }
      }
    }
  } else {
    for (let s = 1; s <= numSets; s++) {
      for (let p = 1; p <= numParticipants; p++) {
        intervals.push({ type: 'WORK', duration: workDuration, participant: p, set: s });
        
        if (restBetweenSets > 0) {
          if (restFrequency === 'after_each') {
            if (!(s === numSets && p === numParticipants)) {
              intervals.push({ type: 'REST', duration: restBetweenSets, participant: null, set: null });
            }
          } else if (restFrequency === 'after_round') {
            if (p === numParticipants && s < numSets) {
              intervals.push({ type: 'REST', duration: restBetweenSets, participant: null, set: null });
            }
          }
        }
      }
    }
  }
  
  return intervals;
};

export const useIntervalMachine = (initialConfig) => {
  const [config, setConfig] = useState(initialConfig || {
    workDuration: 30,
    numSets: 3,
    numParticipants: 1,
    rotationMode: 'alternating',
    restBetweenSets: 10,
    restFrequency: 'after_round' 
  });

  const [status, setStatus] = useState('setup'); 
  const [intervals, setIntervals] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const expectedEndTimeRef = useRef(null);
  const timerIdRef = useRef(null);
  const lastBeepTimeRef = useRef(null);

  const advanceInterval = useCallback((index, generatedIntervals) => {
    const arr = generatedIntervals || intervals;
    if (index >= arr.length) {
      setStatus('finished');
      setTimeRemaining(0);
      playBeep('transition');
      return;
    }
    
    setCurrentIndex(index);
    setTimeRemaining(arr[index].duration);
    expectedEndTimeRef.current = Date.now() + arr[index].duration * 1000;
    playBeep('transition');
  }, [intervals]);

  const handleStart = () => {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    const flatIntervals = generateIntervals(config);
    setIntervals(flatIntervals);
    setStatus('running');
    advanceInterval(0, flatIntervals);
  };

  const handlePause = () => {
    setStatus('paused');
    if (timerIdRef.current) clearInterval(timerIdRef.current);
    expectedEndTimeRef.current = null;
  };

  const handleResume = () => {
    setStatus('running');
    expectedEndTimeRef.current = Date.now() + timeRemaining * 1000;
  };

  const handleReset = () => {
    setStatus('setup');
    if (timerIdRef.current) clearInterval(timerIdRef.current);
    setIntervals([]);
    setCurrentIndex(0);
    setTimeRemaining(0);
  };

  const handleSkip = () => {
    advanceInterval(currentIndex + 1);
  };

  useEffect(() => {
    if (status !== 'running') {
      if (timerIdRef.current) clearInterval(timerIdRef.current);
      return;
    }

    timerIdRef.current = setInterval(() => {
      const now = Date.now();
      const driftCorrectedRemaining = Math.max(0, Math.ceil((expectedEndTimeRef.current - now) / 1000));

      if (driftCorrectedRemaining <= 3 && driftCorrectedRemaining > 0 && driftCorrectedRemaining !== lastBeepTimeRef.current) {
        playBeep('warning');
        lastBeepTimeRef.current = driftCorrectedRemaining;
      }

      if (driftCorrectedRemaining <= 0) {
        clearInterval(timerIdRef.current);
        advanceInterval(currentIndex + 1);
      } else {
        setTimeRemaining(driftCorrectedRemaining);
      }
    }, 100);

    return () => clearInterval(timerIdRef.current);
  }, [status, currentIndex, advanceInterval]);

  // Expose the current and next intervals reliably without re-calculating in the UI
  const currentInterval = intervals[currentIndex] || null;
  const nextInterval = currentIndex + 1 < intervals.length ? intervals[currentIndex + 1] : null;

  return {
    config,
    setConfig,
    status,
    currentInterval,
    nextInterval, // <-- Exported here so UI can just read it directly
    timeRemaining,
    handleStart,
    handlePause,
    handleResume,
    handleReset,
    handleSkip,
    totalIntervals: intervals.length,
    currentIndex
  };
};