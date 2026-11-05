import React, { useState, useEffect } from 'react';
import type { GameModeInfo } from '../../types/gameModes';
import type {
  MultiplayerMatchConfig,
  MultiplayerParticipant,
} from '../../types/multiplayerGame';
import { multiplayerGameService } from '../../services/multiplayerGameService';
import { QRCode } from '../ui/QRCode';
import { AvatarDisplay } from '../ui/AvatarDisplay';
import { Button } from '../ui/Button';
import {
  Users,
  Copy,
  Check,
  Share2,
  Play,
  X,
  Zap,
  Coffee,
  ArrowRight,
} from 'lucide-react';

interface GameMultiplayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: GameModeInfo;
  selectedLevel: number;
  onStartSolo: (level: number) => void;
  onStartMultiplayer: (
    session: MultiplayerMatchConfig,
    participants: MultiplayerParticipant[]
  ) => void;
  onOpenJoinPin?: () => void;
}

type ModalTab = 'choose_mode' | 'host_lobby';

export const GameMultiplayerModal: React.FC<GameMultiplayerModalProps> = ({
  isOpen,
  onClose,
  game,
  selectedLevel,
  onStartSolo,
  onStartMultiplayer,
  onOpenJoinPin,
}) => {
  const [tab, setTab] = useState<ModalTab>('choose_mode');
  const [levelNumber, setLevelNumber] = useState<number>(selectedLevel || 1);
  const [isRanked, setIsRanked] = useState<boolean>(true);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // Active Session State
  const [session, setSession] = useState<MultiplayerMatchConfig | null>(null);
  const [participants, setParticipants] = useState<MultiplayerParticipant[]>([]);
  const [universalUrl, setUniversalUrl] = useState<string>('');
  const [shareMessage, setShareMessage] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);

  // Guest identity
  const guest = multiplayerGameService.getGuestIdentity();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTab('choose_mode');
      setLevelNumber(selectedLevel || 1);
      setSession(null);
      setParticipants([]);
    }
  }, [isOpen, selectedLevel]);

  // Realtime subscription during host lobby
  useEffect(() => {
    if (!session || tab !== 'host_lobby') return;

    const unsubscribe = multiplayerGameService.subscribeToGameSession(session.pin, {
      onParticipantsUpdate: (updatedList) => {
        setParticipants(updatedList);
      },
    });

    return () => {
      unsubscribe();
    };
  }, [session, tab]);

  // Handle Create Host Session
  const handleCreateLobby = async () => {
    setIsCreatingSession(true);
    try {
      const result = await multiplayerGameService.createGameModeSession({
        gameModeId: game.id,
        levelNumber,
        isRanked,
        hostName: guest.nickname,
        hostAvatar: guest.avatar,
        hostId: guest.id,
      });

      setSession(result.session);
      setUniversalUrl(result.universalUrl);
      setShareMessage(result.shareMessage);
      setParticipants(multiplayerGameService.getParticipants(result.session.pin));
      setTab('host_lobby');
    } catch (err) {
      console.error('Failed to create game lobby:', err);
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleCopyLink = () => {
    if (!universalUrl) return;
    navigator.clipboard.writeText(universalUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyPin = () => {
    if (!session) return;
    navigator.clipboard.writeText(session.pin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share && universalUrl) {
      try {
        await navigator.share({
          title: `Join ${game.title} Match on BibleArena`,
          text: shareMessage,
          url: universalUrl,
        });
      } catch {}
    } else {
      handleCopyLink();
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(shareMessage);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleTelegramShare = () => {
    const text = encodeURIComponent(shareMessage);
    const url = encodeURIComponent(universalUrl);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
  };

  // Host launches game
  const handleLaunchGame = () => {
    if (!session) return;
    const started = multiplayerGameService.startGameMatch(session.pin);
    onStartMultiplayer(started, participants);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl border-2 border-purple-200 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50 via-white to-indigo-50">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl ${game.badgeBg} text-white flex items-center justify-center text-xl shadow-md shrink-0`}>
              {game.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-[#0F172A] font-outfit">
                  {game.title}
                </h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-outfit">
                  Level {levelNumber}
                </span>
              </div>
              <p className="text-xs text-[#64748B] font-inter">
                {tab === 'choose_mode' ? 'Choose how you want to play' : 'Host Multiplayer Lobby'}
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

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {tab === 'choose_mode' && (
            <div className="space-y-4">
              {/* Option 1: Play Solo */}
              <button
                onClick={() => {
                  onStartSolo(levelNumber);
                  onClose();
                }}
                className="w-full text-left p-4 rounded-2xl border-2 border-slate-200 hover:border-[#2563EB] hover:bg-blue-50/50 transition-all flex items-center justify-between group cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#2563EB] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <Play className="w-6 h-6 ml-0.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#0F172A] font-outfit flex items-center gap-2">
                      Play Solo
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        Solo Progression
                      </span>
                    </h3>
                    <p className="text-xs text-[#64748B] font-inter mt-0.5">
                      Play alone, earn stars, and unlock subsequent levels at your own pace.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-[#2563EB] group-hover:translate-x-1 transition-all shrink-0" />
              </button>

              {/* Option 2: Play with Friends (Host) */}
              <div className="p-4 rounded-2xl border-2 border-purple-200 bg-purple-50/40 space-y-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2563EB] to-[#7C3AED] text-white flex items-center justify-center shadow-sm shrink-0">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#0F172A] font-outfit flex items-center gap-2">
                      Play with Friends
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-outfit">
                        Multiplayer
                      </span>
                    </h3>
                    <p className="text-xs text-[#64748B] font-inter mt-0.5">
                      Generate a room code & QR to challenge friends in real time.
                    </p>
                  </div>
                </div>

                {/* Match Options: Ranked vs Casual */}
                <div className="pt-2 border-t border-purple-100 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRanked(true)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isRanked
                        ? 'border-purple-600 bg-white shadow-xs'
                        : 'border-purple-200 hover:bg-white/60'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-black text-purple-700 font-outfit">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span>Ranked Match</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-inter mt-0.5">
                      Counts toward Elo & global ranking.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsRanked(false)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      !isRanked
                        ? 'border-purple-600 bg-white shadow-xs'
                        : 'border-purple-200 hover:bg-white/60'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 font-outfit">
                      <Coffee className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Casual Match</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-inter mt-0.5">
                      Friendly practice; no rating changes.
                    </p>
                  </button>
                </div>

                {/* Level selector */}
                <div className="flex items-center justify-between pt-1">
                  <label className="text-xs font-bold text-slate-700 font-outfit">
                    Challenge Level:
                  </label>
                  <select
                    value={levelNumber}
                    onChange={(e) => setLevelNumber(Number(e.target.value))}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-outfit font-black text-xs text-[#0F172A] focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    {Array.from({ length: 60 }, (_, i) => i + 1).map((lvl) => (
                      <option key={lvl} value={lvl}>
                        Level {lvl}
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleCreateLobby}
                  disabled={isCreatingSession}
                  className="font-black font-outfit mt-1"
                >
                  {isCreatingSession ? 'Generating Room...' : 'Create Match & Invite Friends'}
                </Button>
              </div>

              {/* Option 3: Join with PIN */}
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-800 font-outfit">
                    Have an invitation code?
                  </h4>
                  <p className="text-[11px] text-slate-500 font-inter">
                    Enter friend's PIN or scan their QR code to join.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onClose();
                    if (onOpenJoinPin) onOpenJoinPin();
                  }}
                  className="font-bold text-xs"
                >
                  Enter PIN / Scan
                </Button>
              </div>
            </div>
          )}

          {tab === 'host_lobby' && session && (
            <div className="space-y-5">
              {/* Room Code & Share Hero Card */}
              <div className="bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#2563EB] text-white rounded-3xl p-5 sm:p-6 text-center space-y-3.5 shadow-md">
                <div className="flex items-center justify-between text-xs text-purple-200">
                  <span className="font-extrabold uppercase tracking-widest font-outfit">
                    Multiplayer Room PIN
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    session.isRanked ? 'bg-amber-400 text-slate-900' : 'bg-white/20 text-white'
                  }`}>
                    {session.isRanked ? '⚡ Ranked Match' : '☕ Casual Match'}
                  </span>
                </div>

                <div className="font-outfit font-black text-5xl sm:text-6xl text-amber-300 tracking-[0.25em] drop-shadow-sm">
                  {session.pin}
                </div>

                {/* QR Code Presentation */}
                <div className="bg-white rounded-2xl p-4 max-w-[220px] mx-auto shadow-md">
                  <QRCode
                    value={universalUrl}
                    size={180}
                    title={`${game.title} (Level ${session.levelNumber})`}
                    pin={session.pin}
                    showActions={false}
                  />
                  <p className="text-[10px] font-bold text-slate-500 font-inter mt-1.5">
                    Scan with camera to join
                  </p>
                </div>

                {/* Action Buttons: Copy Link & Share */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="gold"
                    onClick={handleNativeShare}
                    leftIcon={<Share2 className="w-3.5 h-3.5" />}
                    className="font-black text-xs"
                  >
                    Share Invite
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyLink}
                    leftIcon={copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    className="border-white/30 text-white hover:bg-white/10 font-bold text-xs"
                  >
                    {copiedLink ? 'Link Copied!' : 'Copy Link'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyPin}
                    leftIcon={copiedPin ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    className="border-white/30 text-white hover:bg-white/10 font-bold text-xs"
                  >
                    {copiedPin ? 'PIN Copied!' : 'Copy PIN'}
                  </Button>
                </div>

                {/* Direct Messengers Shortcut */}
                <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-purple-100">
                  <span>Send via:</span>
                  <button
                    onClick={handleWhatsAppShare}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer transition-colors"
                  >
                    WhatsApp
                  </button>
                  <button
                    onClick={handleTelegramShare}
                    className="px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-bold cursor-pointer transition-colors"
                  >
                    Telegram
                  </button>
                </div>
              </div>

              {/* Connected Participants List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-black text-slate-800 font-outfit uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-purple-600" />
                    Connected Players ({participants.length})
                  </span>
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                    Lobby Ready
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {participants.map((p) => (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-2xl border border-slate-200 bg-white shadow-xs flex items-center gap-2.5"
                    >
                      <AvatarDisplay avatar={p.avatar} size="xs" />
                      <div className="truncate text-left">
                        <p className="text-xs font-black text-slate-800 font-outfit truncate">
                          {p.nickname}
                        </p>
                        <p className="text-[10px] text-slate-400 font-inter">
                          {p.isHost ? '👑 Host' : 'Player'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Launch Match Button */}
              <div className="pt-2">
                <Button
                  variant="gold"
                  size="lg"
                  fullWidth
                  onClick={handleLaunchGame}
                  rightIcon={<Play className="w-5 h-5 ml-1" />}
                  className="font-black font-outfit shadow-md text-base"
                >
                  Start Match ({participants.length} {participants.length === 1 ? 'Player' : 'Players'})
                </Button>
                <p className="text-center text-[11px] text-slate-400 font-inter mt-2">
                  All players will receive the exact same challenges simultaneously.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
