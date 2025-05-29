import { useRef, useCallback, useEffect, useState } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SoundConfig {
  volume: number;
  enabled: boolean;
  musicVolume: number;
  sfxVolume: number;
  ambientVolume: number;
  masterVolume: number;
}

interface SoundStore {
  config: SoundConfig;
  updateConfig: (config: Partial<SoundConfig>) => void;
  toggleSound: () => void;
  setMasterVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;
  setMusicVolume: (volume: number) => void;
  setAmbientVolume: (volume: number) => void;
}

const useSoundStore = create<SoundStore>()(
  persist(
    (set, get) => ({
      config: {
        volume: 0.7,
        enabled: true,
        musicVolume: 0.6,
        sfxVolume: 0.8,
        ambientVolume: 0.4,
        masterVolume: 0.7,
      },
      updateConfig: (newConfig) => set((state) => ({
        config: { ...state.config, ...newConfig }
      })),
      toggleSound: () => set((state) => ({
        config: { ...state.config, enabled: !state.config.enabled }
      })),
      setMasterVolume: (volume) => set((state) => ({
        config: { ...state.config, masterVolume: volume }
      })),
      setSfxVolume: (volume) => set((state) => ({
        config: { ...state.config, sfxVolume: volume }
      })),
      setMusicVolume: (volume) => set((state) => ({
        config: { ...state.config, musicVolume: volume }
      })),
      setAmbientVolume: (volume) => set((state) => ({
        config: { ...state.config, ambientVolume: volume }
      })),
    }),
    {
      name: 'casino-sound-settings',
    }
  )
);

interface SoundEffect {
  id: string;
  audio: HTMLAudioElement;
  type: 'sfx' | 'music' | 'ambient';
  loop: boolean;
  volume: number;
  isPlaying: boolean;
}

const SOUND_LIBRARY = {
  // Game Sounds
  coinFlip: '/sounds/coin-flip.mp3',
  coinLand: '/sounds/coin-land.mp3',
  diceRoll: '/sounds/dice-roll.mp3',
  slotSpin: '/sounds/slot-spin.mp3',
  slotStop: '/sounds/slot-stop.mp3',
  
  // Win Sounds
  smallWin: '/sounds/small-win.mp3',
  bigWin: '/sounds/big-win.mp3',
  jackpot: '/sounds/jackpot.mp3',
  megaWin: '/sounds/mega-win.mp3',
  
  // UI Sounds
  buttonClick: '/sounds/button-click.mp3',
  buttonHover: '/sounds/button-hover.mp3',
  notification: '/sounds/notification.mp3',
  error: '/sounds/error.mp3',
  success: '/sounds/success.mp3',
  
  // Ambient Sounds
  casinoAmbient: '/sounds/casino-ambient.mp3',
  slotMachineAmbient: '/sounds/slot-ambient.mp3',
  
  // Music
  backgroundMusic: '/sounds/background-music.mp3',
  winMusic: '/sounds/win-music.mp3',
  jackpotMusic: '/sounds/jackpot-music.mp3',
};

export const useAdvancedSound = () => {
  const { config, updateConfig, toggleSound, setMasterVolume, setSfxVolume, setMusicVolume, setAmbientVolume } = useSoundStore();
  const soundEffectsRef = useRef<Map<string, SoundEffect>>(new Map());
  const [isInitialized, setIsInitialized] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio context and preload sounds
  const initializeAudio = useCallback(async () => {
    if (isInitialized) return;

    try {
      // Create audio context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Preload all sound effects
      const loadPromises = Object.entries(SOUND_LIBRARY).map(async ([key, url]) => {
        try {
          const audio = new Audio(url);
          audio.preload = 'auto';
          
          // Determine sound type
          let type: 'sfx' | 'music' | 'ambient' = 'sfx';
          if (key.includes('Music') || key.includes('background')) type = 'music';
          if (key.includes('Ambient') || key.includes('ambient')) type = 'ambient';
          
          const soundEffect: SoundEffect = {
            id: key,
            audio,
            type,
            loop: type === 'music' || type === 'ambient',
            volume: 1,
            isPlaying: false,
          };
          
          // Set loop property
          audio.loop = soundEffect.loop;
          
          soundEffectsRef.current.set(key, soundEffect);
          
          return new Promise<void>((resolve) => {
            audio.addEventListener('canplaythrough', () => resolve(), { once: true });
            audio.addEventListener('error', () => resolve(), { once: true });
          });
        } catch (error) {
          console.warn(`Failed to load sound: ${key}`, error);
        }
      });
      
      await Promise.all(loadPromises);
      setIsInitialized(true);
    } catch (error) {
      console.warn('Failed to initialize audio:', error);
    }
  }, [isInitialized]);

  // Calculate final volume based on type and settings
  const calculateVolume = useCallback((type: 'sfx' | 'music' | 'ambient', baseVolume: number = 1) => {
    if (!config.enabled) return 0;
    
    const typeVolume = {
      sfx: config.sfxVolume,
      music: config.musicVolume,
      ambient: config.ambientVolume,
    }[type];
    
    return config.masterVolume * typeVolume * baseVolume;
  }, [config]);

  // Play sound effect
  const playSound = useCallback(async (
    soundId: keyof typeof SOUND_LIBRARY,
    options: {
      volume?: number;
      loop?: boolean;
      fadeIn?: number;
      delay?: number;
    } = {}
  ) => {
    if (!config.enabled || !isInitialized) return;

    const soundEffect = soundEffectsRef.current.get(soundId);
    if (!soundEffect) {
      console.warn(`Sound not found: ${soundId}`);
      return;
    }

    try {
      // Resume audio context if suspended
      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const { audio, type } = soundEffect;
      const finalVolume = calculateVolume(type, options.volume);
      
      // Reset audio
      audio.currentTime = 0;
      audio.volume = finalVolume;
      
      if (options.loop !== undefined) {
        audio.loop = options.loop;
      }

      // Apply delay if specified
      if (options.delay) {
        setTimeout(() => {
          audio.play().catch(console.warn);
        }, options.delay);
      } else {
        // Fade in effect
        if (options.fadeIn) {
          audio.volume = 0;
          audio.play().catch(console.warn);
          
          const fadeSteps = 20;
          const fadeInterval = options.fadeIn / fadeSteps;
          const volumeStep = finalVolume / fadeSteps;
          
          let currentStep = 0;
          const fadeTimer = setInterval(() => {
            currentStep++;
            audio.volume = Math.min(volumeStep * currentStep, finalVolume);
            
            if (currentStep >= fadeSteps) {
              clearInterval(fadeTimer);
            }
          }, fadeInterval);
        } else {
          audio.play().catch(console.warn);
        }
      }
      
      soundEffect.isPlaying = true;
      
      // Handle audio end
      const handleEnded = () => {
        soundEffect.isPlaying = false;
        audio.removeEventListener('ended', handleEnded);
      };
      
      audio.addEventListener('ended', handleEnded, { once: true });
      
    } catch (error) {
      console.warn(`Failed to play sound: ${soundId}`, error);
    }
  }, [config.enabled, isInitialized, calculateVolume]);

  // Stop sound effect
  const stopSound = useCallback((
    soundId: keyof typeof SOUND_LIBRARY,
    fadeOut?: number
  ) => {
    const soundEffect = soundEffectsRef.current.get(soundId);
    if (!soundEffect || !soundEffect.isPlaying) return;

    const { audio } = soundEffect;
    
    if (fadeOut) {
      const fadeSteps = 20;
      const fadeInterval = fadeOut / fadeSteps;
      const volumeStep = audio.volume / fadeSteps;
      
      let currentStep = 0;
      const fadeTimer = setInterval(() => {
        currentStep++;
        audio.volume = Math.max(audio.volume - volumeStep, 0);
        
        if (currentStep >= fadeSteps || audio.volume <= 0) {
          clearInterval(fadeTimer);
          audio.pause();
          audio.currentTime = 0;
          soundEffect.isPlaying = false;
        }
      }, fadeInterval);
    } else {
      audio.pause();
      audio.currentTime = 0;
      soundEffect.isPlaying = false;
    }
  }, []);

  // Stop all sounds
  const stopAllSounds = useCallback((fadeOut?: number) => {
    soundEffectsRef.current.forEach((soundEffect, soundId) => {
      if (soundEffect.isPlaying) {
        stopSound(soundId as keyof typeof SOUND_LIBRARY, fadeOut);
      }
    });
  }, [stopSound]);

  // Update volumes for all playing sounds
  useEffect(() => {
    soundEffectsRef.current.forEach((soundEffect) => {
      if (soundEffect.isPlaying) {
        const newVolume = calculateVolume(soundEffect.type, soundEffect.volume);
        soundEffect.audio.volume = newVolume;
      }
    });
  }, [config, calculateVolume]);

  // Game-specific sound functions
  const playWinSound = useCallback((amount: number) => {
    if (amount >= 100) {
      playSound('jackpot', { volume: 1.2 });
    } else if (amount >= 10) {
      playSound('bigWin', { volume: 1.1 });
    } else {
      playSound('smallWin');
    }
  }, [playSound]);

  const playGameSound = useCallback((game: 'coinflip' | 'dice' | 'slots', action: 'start' | 'end') => {
    switch (game) {
      case 'coinflip':
        if (action === 'start') playSound('coinFlip');
        else playSound('coinLand');
        break;
      case 'dice':
        if (action === 'start') playSound('diceRoll');
        break;
      case 'slots':
        if (action === 'start') playSound('slotSpin');
        else playSound('slotStop');
        break;
    }
  }, [playSound]);

  const playUISound = useCallback((type: 'click' | 'hover' | 'success' | 'error' | 'notification') => {
    switch (type) {
      case 'click':
        playSound('buttonClick', { volume: 0.6 });
        break;
      case 'hover':
        playSound('buttonHover', { volume: 0.4 });
        break;
      case 'success':
        playSound('success');
        break;
      case 'error':
        playSound('error');
        break;
      case 'notification':
        playSound('notification');
        break;
    }
  }, [playSound]);

  // Initialize on first user interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      initializeAudio();
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [initializeAudio]);

  return {
    // Configuration
    config,
    updateConfig,
    toggleSound,
    setMasterVolume,
    setSfxVolume,
    setMusicVolume,
    setAmbientVolume,
    
    // Playback
    playSound,
    stopSound,
    stopAllSounds,
    
    // Game-specific
    playWinSound,
    playGameSound,
    playUISound,
    
    // State
    isInitialized,
    isEnabled: config.enabled,
  };
};

export default useAdvancedSound;
