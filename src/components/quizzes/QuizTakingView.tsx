import React, { useState, useEffect } from 'react';
import type { Quiz, Question } from '../../types/bibleArena';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { DifficultyBadge, CategoryBadge } from '../ui/Badge';
import { AnswerOptionButton } from '../ui/AnswerOptionButton';
import {
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  BookOpen,
  BookMarked,
  Trophy,
} from 'lucide-react';

interface QuizTakingViewProps {
  quiz: Quiz;
  onExit: () => void;
  onRetry: () => void;
}

type QuizFlowState = 'instructions' | 'taking' | 'results' | 'review';

export const QuizTakingView: React.FC<QuizTakingViewProps> = ({
  quiz,
  onExit,
  onRetry,
}) => {
  const { recordAttempt } = useAuth();

  const [flowState, setFlowState] = useState<QuizFlowState>('instructions');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qIndex: number]: number }>({});
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [instantFeedback, setInstantFeedback] = useState(true);

  // Stopwatch timer while taking quiz
  useEffect(() => {
    let interval: any = null;
    if (flowState === 'taking' && timerRunning) {
      interval = setInterval(() => {
        setTimeSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [flowState, timerRunning]);

  const handleStart = () => {
    setFlowState('taking');
    setTimerRunning(true);
    setTimeSeconds(0);
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
  };

  const handleSelectOption = (optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: optionIndex,
    }));
  };

  // Submit quiz & compute score
  const handleSubmitQuiz = () => {
    setTimerRunning(false);

    let correctCount = 0;
    quiz.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswerIndex) {
        correctCount += 1;
      }
    });

    const percentage = Math.round((correctCount / quiz.questions.length) * 100);

    // Save to user history dynamically
    recordAttempt({
      quizId: quiz.id,
      quizTitle: quiz.title,
      category: quiz.category,
      score: correctCount,
      totalQuestions: quiz.questions.length,
      percentage,
      timeSpentSeconds: timeSeconds,
      userAnswers: selectedAnswers,
    });

    setFlowState('results');
  };

  // Score calculations
  const totalQuestions = quiz.questions.length;
  let correctCount = 0;
  quiz.questions.forEach((q, idx) => {
    if (selectedAnswers[idx] === q.correctAnswerIndex) {
      correctCount += 1;
    }
  });
  const percentage = Math.round((correctCount / totalQuestions) * 100);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentQ: Question = quiz.questions[currentQuestionIndex];
  const isCurrentAnswered = selectedAnswers[currentQuestionIndex] !== undefined;

  // ============================================================
  // 1. INSTRUCTIONS SCREEN
  // ============================================================
  if (flowState === 'instructions') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
        <div className="bg-white rounded-3xl border border-[#CBD5E1] shadow-lg p-6 sm:p-10 space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <CategoryBadge category={quiz.category} />
              <DifficultyBadge difficulty={quiz.difficulty} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#14213D] leading-tight">
              {quiz.title}
            </h1>

            <p className="text-sm text-[#64748B] leading-relaxed">
              {quiz.description}
            </p>
          </div>

          <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-[#EAF1FA] grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
            <div>
              <span className="block text-xs text-[#64748B]">Questions</span>
              <span className="text-xl font-bold text-[#14213D]">{quiz.questionCount}</span>
            </div>
            <div>
              <span className="block text-xs text-[#64748B]">Estimated Time</span>
              <span className="text-xl font-bold text-[#14213D]">~{quiz.estimatedMinutes} mins</span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="block text-xs text-[#64748B]">Scripture Grounded</span>
              <span className="text-xs font-bold text-[#234E91] block mt-1">Citations Included</span>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="p-4 rounded-2xl bg-[#EAF1FA]/60 border border-[#234E91]/20 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-[#14213D] block">
                Instant Scripture Explanation
              </span>
              <p className="text-[11px] text-[#64748B]">
                Reveal Scripture references and theological notes after each question.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setInstantFeedback(!instantFeedback)}
              className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                instantFeedback ? 'bg-[#234E91]' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  instantFeedback ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="pt-4 border-t border-[#F1F5F9] flex flex-col sm:flex-row gap-3">
            <Button variant="outline" size="lg" onClick={onExit} className="sm:flex-1">
              Back to Library
            </Button>
            <Button
              variant="gold"
              size="lg"
              onClick={handleStart}
              className="sm:flex-2 font-bold shadow-md"
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              Start Quiz Now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // 2. TAKING QUIZ SCREEN (FUNKWIZ 4-COLOUR ANSWER PAD INTERFACE)
  // ============================================================
  if (flowState === 'taking') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
        {/* Top Header HUD */}
        <div className="bg-white rounded-2xl border border-[#CBD5E1] p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onExit}
              className="text-xs font-bold text-[#64748B] hover:text-[#14213D] p-1.5 rounded-lg hover:bg-[#F1F5F9] cursor-pointer"
            >
              Exit Quiz
            </button>
            <span className="h-4 w-px bg-[#CBD5E1]" />
            <span className="text-xs sm:text-sm font-bold text-[#14213D] truncate max-w-[180px] sm:max-w-xs">
              {quiz.title}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-[#64748B]">
              <Clock className="w-4 h-4 text-[#234E91]" />
              <span className="font-mono text-sm text-[#14213D]">{formatTime(timeSeconds)}</span>
            </span>
            <span className="bg-[#EAF1FA] text-[#234E91] px-3 py-1 rounded-full font-bold">
              Q {currentQuestionIndex + 1} / {totalQuestions}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#E2E8F0] h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-[#234E91] h-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>

        {/* Active Question Box */}
        <div className="bg-white rounded-3xl border-2 border-[#E2E8F0] p-6 sm:p-10 shadow-md text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#EDE9FE] text-[#7C3AED] text-xs font-black uppercase tracking-wider font-outfit">
            <BookMarked className="w-3.5 h-3.5" /> {quiz.category} • Question {currentQuestionIndex + 1}
          </span>
          <h2 className="quiz-question text-xl sm:text-3xl font-bold text-[#0F172A] leading-snug max-w-2xl mx-auto font-inter">
            {currentQ.text}
          </h2>
        </div>

        {/* Four Colourful Answer Options Grid (Funkwiz Inspired) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {currentQ.options.map((opt, optIdx) => {
            const isSelected = selectedAnswers[currentQuestionIndex] === optIdx;
            const isCorrect = optIdx === currentQ.correctAnswerIndex;
            const isRevealed = instantFeedback && isCurrentAnswered;

            return (
              <AnswerOptionButton
                key={optIdx}
                index={optIdx}
                text={opt}
                isSelected={isSelected}
                isCorrect={isCorrect}
                isRevealed={isRevealed}
                disabled={isRevealed}
                onClick={() => handleSelectOption(optIdx)}
              />
            );
          })}
        </div>

        {/* Instant Feedback Explanation Box */}
        {instantFeedback && isCurrentAnswered && (
          <div className="p-5 rounded-2xl bg-white border border-[#CBD5E1] shadow-sm space-y-2 animate-scale-in">
            <div className="flex items-center gap-2">
              {selectedAnswers[currentQuestionIndex] === currentQ.correctAnswerIndex ? (
                <div className="flex items-center gap-1.5 text-emerald-700 font-extrabold text-xs uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4" /> Correct
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-red-600 font-extrabold text-xs uppercase tracking-wider">
                  <XCircle className="w-4 h-4" /> Incorrect
                </div>
              )}
              <span className="text-xs text-[#64748B]">•</span>
              <span className="text-xs font-bold text-[#234E91]">
                Scripture: {currentQ.scriptureReference}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#1E293B] leading-relaxed">
              {currentQ.explanation}
            </p>
          </div>
        )}

        {/* Navigation & Submit Controls */}
        <div className="flex items-center justify-between gap-4 pt-2">
          <Button
            variant="outline"
            size="md"
            onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {currentQuestionIndex < totalQuestions - 1 ? (
              <Button
                variant="primary"
                size="md"
                onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                disabled={!isCurrentAnswered}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Next Question
              </Button>
            ) : (
              <Button
                variant="gold"
                size="md"
                onClick={handleSubmitQuiz}
                disabled={!isCurrentAnswered}
                rightIcon={<CheckCircle2 className="w-4 h-4" />}
                className="font-extrabold shadow-sm"
              >
                Submit Quiz
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // 3. RESULTS & CELEBRATION SCREEN
  // ============================================================
  if (flowState === 'results') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
        <div className="bg-white rounded-3xl border border-[#CBD5E1] shadow-xl p-6 sm:p-10 space-y-8 text-center">
          <div className="space-y-3">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#E9B44C]/30 to-[#E9B44C] text-[#14213D] flex items-center justify-center mx-auto shadow-md">
              <Trophy className="w-10 h-10" />
            </div>

            <span className="text-xs font-extrabold uppercase tracking-widest text-[#234E91] bg-[#EAF1FA] px-3.5 py-1 rounded-full">
              Quiz Completed
            </span>

            <h2 className="text-3xl sm:text-4xl font-black text-[#14213D]">
              {percentage >= 80 ? 'Glory to God! Outstanding!' : 'Great Work! Keep Growing!'}
            </h2>

            <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto">
              Your results have been recorded in your personal Scripture progress dashboard.
            </p>
          </div>

          {/* Performance Summary Cards */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-[#CBD5E1]">
              <span className="text-xs font-semibold text-[#64748B] block">Score</span>
              <span className="text-xl sm:text-2xl font-black text-[#234E91] font-mono mt-1 block">
                {correctCount} / {totalQuestions}
              </span>
            </div>
            <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-[#CBD5E1]">
              <span className="text-xs font-semibold text-[#64748B] block">Accuracy</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-700 font-mono mt-1 block">
                {percentage}%
              </span>
            </div>
            <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-[#CBD5E1]">
              <span className="text-xs font-semibold text-[#64748B] block">Time</span>
              <span className="text-xl sm:text-2xl font-black text-[#E9B44C] font-mono mt-1 block">
                {formatTime(timeSeconds)}
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="gold"
                size="lg"
                fullWidth
                onClick={() => setFlowState('review')}
                leftIcon={<BookOpen className="w-5 h-5" />}
                className="font-extrabold shadow-md"
              >
                Review Scripture Explanations
              </Button>
              <Button
                variant="outline"
                size="lg"
                fullWidth
                onClick={onRetry}
                leftIcon={<RotateCcw className="w-5 h-5" />}
              >
                Try Again
              </Button>
            </div>

            <Button variant="ghost" size="md" onClick={onExit}>
              Return to Quiz Library
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // 4. REVIEW ALL QUESTIONS & EXPLANATIONS SCREEN
  // ============================================================
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between pb-4 border-b border-[#CBD5E1]">
        <div>
          <h2 className="text-2xl font-extrabold text-[#14213D]">
            Scripture Review & Explanations
          </h2>
          <p className="text-xs text-[#64748B]">
            {quiz.title} • Score: {correctCount}/{totalQuestions} ({percentage}%)
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setFlowState('results')}>
          Back to Results
        </Button>
      </div>

      <div className="space-y-6">
        {quiz.questions.map((q, idx) => {
          const userAns = selectedAnswers[idx];
          const isCorrect = userAns === q.correctAnswerIndex;

          return (
            <div
              key={q.id}
              className="bg-white rounded-3xl border border-[#CBD5E1] p-6 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
                <span className="text-xs font-bold text-[#64748B]">
                  Question {idx + 1}
                </span>
                <span
                  className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                    isCorrect
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {isCorrect ? 'Correct' : 'Incorrect'}
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-[#14213D]">
                {q.text}
              </h3>

              <div className="space-y-2">
                {q.options.map((opt, optIdx) => {
                  const isThisCorrect = optIdx === q.correctAnswerIndex;
                  const isThisUserPick = optIdx === userAns;

                  let optClass = 'bg-[#F8FAFC] border-[#CBD5E1] text-[#1E293B]';
                  if (isThisCorrect) {
                    optClass = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold';
                  } else if (isThisUserPick && !isThisCorrect) {
                    optClass = 'bg-red-50 border-red-400 text-red-950';
                  }

                  return (
                    <div
                      key={optIdx}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs sm:text-sm ${optClass}`}
                    >
                      <span>{opt}</span>
                      {isThisCorrect && (
                        <span className="text-[11px] font-bold text-emerald-700">Correct Answer</span>
                      )}
                      {isThisUserPick && !isThisCorrect && (
                        <span className="text-[11px] font-bold text-red-600">Your Answer</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="p-4 rounded-xl bg-[#EAF1FA] border border-[#234E91]/20 space-y-1 text-xs">
                <span className="font-bold text-[#234E91] block">
                  Scripture Reference: {q.scriptureReference}
                </span>
                <p className="text-[#1E293B] leading-relaxed">{q.explanation}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center pt-4">
        <Button variant="gold" size="lg" onClick={onExit} rightIcon={<ArrowRight className="w-5 h-5" />}>
          Finish Review & Explore More Quizzes
        </Button>
      </div>
    </div>
  );
};
