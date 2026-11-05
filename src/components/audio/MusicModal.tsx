import React, { useState, useEffect } from 'react';
import { musicService, MUSIC_TRACKS } from '../../services/musicService';
import { Volume2, VolumeX, Music, Play, Pause, Sparkles, X, Check } from 'lucide-react';

interface MusicModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MusicModal: React.FC<MusicModalProps> = ({ isOpen, onClose }) => {
  const [state, setState] = useState(() => musicService.getState());

  useEffect(() => {
    return musicService.subscribe(() => {
      setState(musicService.getState());
    });
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#0F172A] font-outfit">
                Faith Sounds & Ambient Hymns
              </h3>
              <p className="text-xs text-[#64748B] font-inter">
                Relaxing peaceful harmonies for Bible study & gaming
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master Play/Pause Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-tr from-purple-50 via-indigo-50 to-blue-50 border border-purple-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => musicService.toggleMusic()}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white transition-all shadow-md active:scale-95 cursor-pointer ${
                state.isPlaying
                  ? 'bg-gradient-to-tr from-[#7C3AED] to-[#2563EB] ring-4 ring-purple-200'
                  : 'bg-slate-700 hover:bg-slate-800'
              }`}
            >
              {state.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-[#7C3AED] block">
                {state.isPlaying ? 'Now Playing' : 'Ambient Music Paused'}
              </span>
              <span className="text-sm font-black text-[#0F172A]">
                {MUSIC_TRACKS.find((t) => t.id === state.currentTrack)?.name}
              </span>
            </div>
          </div>

          {/* Animated Equalizer Waves */}
          {state.isPlaying && (
            <div className="flex items-end gap-1 h-6 pr-2">
              <span className="w-1 bg-[#7C3AED] rounded-full animate-bounce h-4" />
              <span className="w-1 bg-[#2563EB] rounded-full animate-bounce h-6 [animation-delay:150ms]" />
              <span className="w-1 bg-[#7C3AED] rounded-full animate-bounce h-3 [animation-delay:300ms]" />
              <span className="w-1 bg-[#2563EB] rounded-full animate-bounce h-5 [animation-delay:450ms]" />
            </div>
          )}
        </div>

        {/* Track Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider block">
            Select Ambient Soundscape
          </label>
          <div className="space-y-1.5">
            {MUSIC_TRACKS.map((track) => {
              const isSelected = track.id === state.currentTrack;
              return (
                <button
                  key={track.id}
                  onClick={() => musicService.setTrack(track.id)}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-50/70 border-[#7C3AED] text-[#0F172A]'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles
                      className={`w-4 h-4 ${
                        isSelected ? 'text-[#7C3AED]' : 'text-slate-400'
                      }`}
                    />
                    <div>
                      <span className="text-xs font-extrabold block">{track.name}</span>
                      <span className="text-[11px] text-[#64748B] block">{track.description}</span>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#7C3AED] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Volume Controls & Sound FX */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5">
              {state.volume === 0 ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-[#7C3AED]" />}
              Music Volume ({Math.round(state.volume * 100)}%)
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={state.volume}
            onChange={(e) => musicService.setVolume(parseFloat(e.target.value))}
            className="w-full accent-[#7C3AED] h-1.5 bg-slate-200 rounded-lg cursor-pointer"
          />

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div>
              <span className="text-xs font-extrabold text-[#0F172A] block">Game Sound Effects</span>
              <span className="text-[11px] text-[#64748B] block">Chimes for correct answers & level-up</span>
            </div>
            <button
              onClick={() => musicService.toggleSfx()}
              className={`px-3 py-1 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                state.sfxEnabled
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
            >
              {state.sfxEnabled ? 'Enabled' : 'Muted'}
            </button>
          </div>
        </div>

        {/* Done Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-extrabold text-sm transition-colors cursor-pointer shadow-xs active:scale-98"
        >
          Done
        </button>
      </div>
    </div>
  );
};
