import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import type { AppPage } from './components/layout/Navbar';
import { AppNavigation } from './components/layout/AppNavigation';
import { MusicModal } from './components/audio/MusicModal';
import { Footer } from './components/layout/Footer';
import { Toast } from './components/ui/Toast';
import { HomePage } from './components/home/HomePage';
import { LiveArenaView } from './components/live-arena/LiveArenaView';
import { CreateArenaView } from './components/create-arena/CreateArenaView';
import { QuizLibraryView } from './components/quizzes/QuizLibraryView';
import { QuizTakingView } from './components/quizzes/QuizTakingView';
import { LeaderboardView } from './components/leaderboard/LeaderboardView';
import { ProfileView } from './components/profile/ProfileView';
import { QuizBuilderView } from './components/create-quiz/QuizBuilderView';
import { ChampionshipView } from './components/championship/ChampionshipView';
import { InteractiveGameHub } from './components/game-modes/InteractiveGameHub';
import { mockQuizzes } from './data/mockQuizzes';
import type { Quiz } from './types/bibleArena';
import type { MultiplayerMatchConfig, MultiplayerParticipant } from './types/multiplayerGame';

export function BibleArenaApp() {
  const { customQuizzes, showToast } = useAuth();

  const [currentPage, setCurrentPage] = useState<AppPage>('home');
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [liveArenaPin, setLiveArenaPin] = useState<string>('');
  const [activeMultiplayerSession, setActiveMultiplayerSession] = useState<{
    session: MultiplayerMatchConfig;
    participant: MultiplayerParticipant;
  } | null>(null);
  const [isLiveArenaQuizActive, setIsLiveArenaQuizActive] = useState(false);
  const [isInteractiveGameActive, setIsInteractiveGameActive] = useState(false);
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);

  // Sync routing from URL path and hash
  useEffect(() => {
    const handleRouting = () => {
      // 1. Check pathname for direct /join/123456 routes
      const pathname = window.location.pathname;
      const pathMatch = pathname.match(/\/join\/(\d{6})/i);
      if (pathMatch) {
        setLiveArenaPin(pathMatch[1]);
        setCurrentPage('join-arena');
        setActiveQuizId(null);
        return;
      }

      // 2. Check hash routing
      const rawHash = window.location.hash.replace('#', '').trim();
      const [hash, query] = rawHash.split('?');

      // Check for #join/123456 or #join-arena/123456
      const hashJoinMatch = hash.match(/^join(?:-arena)?\/(\d{6})/i);
      if (hashJoinMatch) {
        setLiveArenaPin(hashJoinMatch[1]);
        setCurrentPage('join-arena');
        setActiveQuizId(null);
        return;
      }

      // Check for PIN query param e.g. #join-arena?pin=842915 or ?pin=842915 (universal WhatsApp/SMS links)
      const searchParams = new URLSearchParams(window.location.search);
      const queryParams = new URLSearchParams(query || '');
      const pinParam = queryParams.get('pin') || searchParams.get('pin');
      const gameParam = queryParams.get('game') || searchParams.get('game');
      if (pinParam && /^\d{6}$/.test(pinParam)) {
        setLiveArenaPin(pinParam);
        if (gameParam) {
          setCurrentPage('game-modes');
        } else {
          setCurrentPage('join-arena');
        }
        setActiveQuizId(null);
        return;
      }

      const lowerHash = hash.toLowerCase();
      if (lowerHash === 'join-arena' || lowerHash === 'live-arena' || lowerHash === 'join') {
        setCurrentPage('join-arena');
        setActiveQuizId(null);
      } else if (lowerHash === 'create-arena' || lowerHash === 'host') {
        setCurrentPage('create-arena');
        setActiveQuizId(null);
      } else if (lowerHash === 'explore' || lowerHash === 'quizzes') {
        setCurrentPage('explore');
        setActiveQuizId(null);
      } else if (lowerHash === 'leaderboard') {
        setCurrentPage('leaderboard');
        setActiveQuizId(null);
      } else if (lowerHash === 'profile' || lowerHash === 'my-progress' || lowerHash === 'progress') {
        setCurrentPage('profile');
        setActiveQuizId(null);
      } else if (lowerHash === 'create-quiz' || lowerHash === 'create') {
        setCurrentPage('create-quiz');
        setActiveQuizId(null);
      } else if (lowerHash === 'championship') {
        setCurrentPage('championship');
        setActiveQuizId(null);
      } else if (lowerHash === 'game-modes' || lowerHash === 'games' || lowerHash === 'hub') {
        setCurrentPage('game-modes');
        setActiveQuizId(null);
      } else if (lowerHash === 'home' || !lowerHash) {
        setCurrentPage('home');
        setActiveQuizId(null);
      }
    };

    handleRouting();
    window.addEventListener('hashchange', handleRouting);
    window.addEventListener('popstate', handleRouting);
    return () => {
      window.removeEventListener('hashchange', handleRouting);
      window.removeEventListener('popstate', handleRouting);
    };
  }, []);

  const handleNavigate = (page: AppPage, extraParams?: { quizId?: string; pin?: string }) => {
    setCurrentPage(page);
    window.location.hash = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (extraParams?.quizId) {
      setActiveQuizId(extraParams.quizId);
    } else {
      setActiveQuizId(null);
    }

    if (extraParams?.pin) {
      setLiveArenaPin(extraParams.pin);
    }
  };

  const handlePlayQuiz = (quizId: string) => {
    setActiveQuizId(quizId);
    setCurrentPage('explore');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleJoinLivePin = (pin: string) => {
    setLiveArenaPin(pin);
    setCurrentPage('join-arena');
    window.location.hash = `join-arena?pin=${pin}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`Joining Arena with PIN: ${pin}`);
  };

  // Find active quiz if playing
  const allQuizzes = [...customQuizzes, ...mockQuizzes];
  const activeQuiz: Quiz | undefined = activeQuizId
    ? allQuizzes.find((q) => q.id === activeQuizId)
    : undefined;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      {/* Global Header */}
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onQuickJoinPin={handleJoinLivePin}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-32 sm:pb-36">
        {/* If taking a quiz */}
        {activeQuiz ? (
          <QuizTakingView
            quiz={activeQuiz}
            onExit={() => setActiveQuizId(null)}
            onRetry={() => {
              setActiveQuizId(activeQuiz.id);
            }}
          />
        ) : (
          <>
            {currentPage === 'home' && (
              <HomePage
                onNavigate={handleNavigate}
                onPlayQuiz={handlePlayQuiz}
                onJoinLivePin={handleJoinLivePin}
              />
            )}

            {currentPage === 'championship' && (
              <ChampionshipView
                onBackToHome={() => handleNavigate('home')}
                onGameplayStateChange={setIsInteractiveGameActive}
              />
            )}

            {currentPage === 'game-modes' && (
              <InteractiveGameHub
                onBackToHome={() => handleNavigate('home')}
                onGameplayStateChange={setIsInteractiveGameActive}
                initialMultiplayerSession={activeMultiplayerSession}
                initialGamePin={liveArenaPin}
                onClearInitialSession={() => {
                  setActiveMultiplayerSession(null);
                  setLiveArenaPin('');
                }}
              />
            )}

            {currentPage === 'join-arena' && (
              <LiveArenaView
                initialPin={liveArenaPin}
                onNavigateQuizzes={() => handleNavigate('explore')}
                onNavigateHome={() => handleNavigate('home')}
                onGameplayStateChange={setIsLiveArenaQuizActive}
                onJoinGameMode={(session, participant) => {
                  setActiveMultiplayerSession({ session, participant });
                  setCurrentPage('game-modes');
                  window.location.hash = `game-modes?pin=${session.pin}`;
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  showToast(`🎮 Joined ${session.gameTitle} match!`);
                }}
              />
            )}

            {currentPage === 'create-arena' && (
              <CreateArenaView
                onNavigateExplore={() => handleNavigate('explore')}
                onNavigateJoinPin={handleJoinLivePin}
                onCreateCustomQuiz={() => handleNavigate('create-quiz')}
              />
            )}

            {currentPage === 'explore' && (
              <QuizLibraryView
                onPlayQuiz={handlePlayQuiz}
                onCreateQuiz={() => handleNavigate('create-quiz')}
                onGameplayStateChange={setIsInteractiveGameActive}
              />
            )}

            {currentPage === 'leaderboard' && (
              <LeaderboardView onExploreQuizzes={() => handleNavigate('explore')} />
            )}

            {(currentPage === 'profile' || currentPage === 'my-progress') && (
              <ProfileView
                onExploreQuizzes={() => handleNavigate('explore')}
                onHostArena={() => handleNavigate('create-arena')}
              />
            )}

            {currentPage === 'create-quiz' && (
              <QuizBuilderView
                onQuizPublished={(newId) => {
                  handlePlayQuiz(newId);
                }}
                onCancel={() => handleNavigate('explore')}
              />
            )}
          </>
        )}
      </main>

      {/* Global Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Application-Wide Dock Navigation */}
      <AppNavigation
        currentPage={currentPage}
        onNavigate={handleNavigate}
        isGameplayActive={Boolean(activeQuiz) || isLiveArenaQuizActive || isInteractiveGameActive}
      />

      {/* Faith Audio & Ambient Hymns Controller */}
      <MusicModal
        isOpen={isMusicModalOpen}
        onClose={() => setIsMusicModalOpen(false)}
      />

      {/* Global Notification Toast */}
      <Toast />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <BibleArenaApp />
    </AuthProvider>
  );
}

export default App;
