// store/index.ts

import { create } from "zustand";

interface TimerState {
  isActive: boolean;
  isPaused: boolean;
  startTime: number | null; // epoch timestamp
  pausedTime: number | null; // epoch timestamp when paused
  elapsedSeconds: number;
  clientId: string;
  clientName: string;
  description: string;
  rate: number;
  
  // Actions
  startTimer: (clientId: string, clientName: string, description: string, rate?: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => { clientId: string; description: string; hours: number; rate: number } | null;
  tick: () => void;
  resetTimer: () => void;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  isActive: false,
  isPaused: false,
  startTime: null,
  pausedTime: null,
  elapsedSeconds: 0,
  clientId: "",
  clientName: "",
  description: "",
  rate: 1500, // Default billing rate in INR

  startTimer: (clientId, clientName, description, rate = 1500) => {
    set({
      isActive: true,
      isPaused: false,
      startTime: Date.now(),
      pausedTime: null,
      elapsedSeconds: 0,
      clientId,
      clientName,
      description,
      rate,
    });
  },

  pauseTimer: () => {
    const { isActive, isPaused, startTime } = get();
    if (!isActive || isPaused || !startTime) return;
    set({
      isPaused: true,
      pausedTime: Date.now(),
    });
  },

  resumeTimer: () => {
    const { isActive, isPaused, startTime, pausedTime, elapsedSeconds } = get();
    if (!isActive || !isPaused || !startTime || !pausedTime) return;
    const additionalElapsed = Math.floor((Date.now() - pausedTime) / 1000);
    set({
      isPaused: false,
      pausedTime: null,
      // Adjust startTime forward so the elapsed calculation matches
      startTime: startTime + (Date.now() - pausedTime),
    });
  },

  tick: () => {
    const { isActive, isPaused, startTime } = get();
    if (!isActive || isPaused || !startTime) return;
    set({
      elapsedSeconds: Math.floor((Date.now() - startTime) / 1000),
    });
  },

  stopTimer: () => {
    const { isActive, clientId, description, elapsedSeconds, rate } = get();
    if (!isActive) return null;
    
    // Calculate fractional hours (rounded to 2 decimal places, min 0.1)
    const hours = Math.max(0.1, parseFloat((elapsedSeconds / 3600).toFixed(2)));
    
    const result = {
      clientId,
      description: description || "Time Logged via Timer",
      hours,
      rate,
    };
    
    get().resetTimer();
    return result;
  },

  resetTimer: () => {
    set({
      isActive: false,
      isPaused: false,
      startTime: null,
      pausedTime: null,
      elapsedSeconds: 0,
      clientId: "",
      clientName: "",
      description: "",
    });
  },
}));
