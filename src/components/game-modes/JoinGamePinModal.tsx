import React, { useState, useEffect } from 'react';
import { multiplayerGameService } from '../../services/multiplayerGameService';
import type {
  MultiplayerMatchConfig,
  MultiplayerParticipant,
} from '../../types/multiplayerGame';
import { PinInput } from '../ui/PinInput';
import { QRScannerModal } from '../ui/QRScannerModal';
import { AvatarDisplay } from '../ui/AvatarDisplay';
import { Button } from '../ui/Button';
import { avatars } from '../../data/avatars.tsx';
import {
  Users,
  Camera,
  X,
  AlertCircle,
  Play,
  Radio,
} from 'lucide-react';

interface JoinGamePinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinSuccess: (
    session: MultiplayerMatchConfig,
    participant: MultiplayerParticipant
  ) => void;
  initialPin?: string;
}

export const JoinGamePinModal: React.FC<JoinGamePinModalProps> = ({
  isOpen,
  onClose,
  onJoinSuccess,
  initialPin = '',
}) => {
  const [pin, setPin] = useState(initialPin || '');
  const guest = multiplayerGameService.getGuestIdentity();
  const [nickname, setNickname] = useState(guest.nickname || '');
  const [selectedAvatar, setSelectedAvatar] = useState(guest.avatar || 'hero-david');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionPreview, setSessionPreview] = useState<MultiplayerMatchConfig | null>(null);
  const [activeRooms, setActiveRooms] = useState<Array<{ session: MultiplayerMatchConfig; participants: MultiplayerParticipant[] }>>([]);

  useEffect(() => {
    if (isOpen) {
      setPin(initialPin || '');
      setErrorMsg(null);
      setIsLoading(false);
      setSessionPreview(null);
      setActiveRooms(multiplayerGameService.getActiveRooms());
    }
  }, [isOpen, initialPin]);

  // Lookup session preview when 6 digits entered
  useEffect(() => {
    const clean = pin.trim().replace(/\D/g, '');
    if (clean.length === 6) {
      const sess = multiplayerGameService.getSessionByPin(clean);
      if (sess) {
        setSessionPreview(sess);
        setErrorMsg(null);
      } else {
        // Connect to room channel over WebSocket to discover host's session in real time
        const unsub = multiplayerGameService.subscribeToGameSession(clean, {
          onSessionUpdate: (s) => {
            setSessionPreview(s);
            setErrorMsg(null);
          },
        });
        return () => unsub();
      }
    } else {
      setSessionPreview(null);
    }
  }, [pin]);

  const handleQrScanSuccess = (scannedPin: string) => {
    setPin(scannedPin);
    setIsScannerOpen(false);
    setErrorMsg(null);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pin.trim().replace(/\D/g, '');
    if (cleanPin.length !== 6) {
      setErrorMsg('Please enter a valid 6-digit room PIN.');
      return;
    }
    const cleanNick = nickname.trim();
    if (!cleanNick) {
      setErrorMsg('Please choose a player nickname.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      multiplayerGameService.saveGuestIdentity(cleanNick, selectedAvatar);
      const res = await multiplayerGameService.joinGameModeSession({
        pin: cleanPin,
        nickname: cleanNick,
        avatar: selectedAvatar,
      });

      onJoinSuccess(res.session, res.participant);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to join game session. Please check the PIN.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl border-2 border-purple-200 overflow-hidden flex flex-col max-h-[92vh] my-auto animate-scale-in">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50 via-white to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center text-xl shadow-md shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#0F172A] font-outfit">
                Join Game Room
              </h2>
              <p className="text-xs text-[#64748B]">
                Enter a 6-digit PIN or scan a QR code
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleJoin} className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {/* Active Live Rooms List (Quick Join) */}
          {activeRooms.length > 0 && (
            <div className="space-y-2 pb-2 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#7C3AED] flex items-center gap-1.5 font-outfit">
                  <Radio className="w-3 h-3 text-red-500 animate-pulse" />
                  Live Games Happening Now
                </span>
                <span className="text-[10px] text-slate-400 font-bold">
                  Tap to Join
                </span>
              </div>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {activeRooms.map(({ session: rSess, participants: rParts }) => (
                  <button
                    key={rSess.pin}
                    type="button"
                    onClick={() => {
                      setPin(rSess.pin);
                      setSessionPreview(rSess);
                      setErrorMsg(null);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                      pin === rSess.pin
                        ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-200'
                        : 'bg-slate-50 hover:bg-purple-50/50 border-slate-200'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-900 truncate font-outfit">
                          {rSess.gameTitle}
                        </span>
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-700">
                          Lvl {rSess.levelNumber}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate">
                        Host: {rSess.hostName} • PIN: <strong className="text-purple-600">{rSess.pin}</strong>
                      </p>
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5 ml-2">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <Users className="w-2.5 h-2.5" />
                        {rParts.length} {rSess.status === 'active' ? 'playing' : 'joined'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PIN Input & Scan Button */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-[#475569] font-outfit">
                Room 6-Digit PIN
              </label>
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7C3AED] hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg border border-purple-200 transition-colors cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Scan QR Code</span>
              </button>
            </div>

            <div className="flex justify-center py-1">
              <PinInput
                value={pin}
                onChange={(v) => {
                  setPin(v);
                  setErrorMsg(null);
                }}
                hasError={Boolean(errorMsg)}
              />
            </div>
          </div>

          {/* Session Preview if PIN found */}
          {sessionPreview && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 flex items-center gap-3 animate-fade-in">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center text-lg font-black shadow-xs shrink-0">
                🎮
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-[#0F172A] truncate font-outfit">
                    {sessionPreview.gameTitle}
                  </span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-200 text-purple-800">
                    Lvl {sessionPreview.levelNumber}
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B]">
                  Hosted by <strong>{sessionPreview.hostName}</strong> • {sessionPreview.isRanked ? 'Ranked' : 'Casual'}
                </p>
              </div>
            </div>
          )}

          {/* Nickname Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-[#475569] font-outfit">
              Your Player Nickname
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. David Disciple"
              maxLength={20}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold text-[#0F172A] focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
            />
          </div>

          {/* Avatar Choices */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-[#475569] font-outfit">
              Select Faith Avatar
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
              {avatars.slice(0, 8).map((av) => (
                <button
                  type="button"
                  key={av.id}
                  onClick={() => setSelectedAvatar(av.id)}
                  className={`p-1 rounded-2xl border-2 shrink-0 transition-transform cursor-pointer ${
                    selectedAvatar === av.id
                      ? 'border-purple-600 bg-purple-50 scale-105 ring-2 ring-purple-200'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <AvatarDisplay avatar={av.id} size="sm" />
                </button>
              ))}
            </div>
          </div>

          {/* Error Message Banner */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Join Submit Button */}
          <Button
            type="submit"
            variant="gold"
            size="lg"
            fullWidth
            disabled={isLoading || pin.length !== 6 || !nickname.trim()}
            rightIcon={<Play className="w-4 h-4 fill-current" />}
            className="font-black text-sm shadow-md cursor-pointer"
          >
            {isLoading ? 'Joining Match...' : 'Join Game Session'}
          </Button>
        </form>
      </div>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleQrScanSuccess}
      />
    </div>
  );
};
