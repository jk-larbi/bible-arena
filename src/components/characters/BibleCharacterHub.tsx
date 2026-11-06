// ============================================================================
// BIBLEARENA — BIBLE CHARACTER & QUALITIES LEARNING HUB
// Interactive character encyclopedia, 20 biblical qualities, 10-point profiles & mastery
// ============================================================================

import React, { useState } from 'react';
import type { BibleCharacterProfile, BiblicalQualityProfile, CharacterLearningQuestion } from '../../types/bibleCharacters';
import { ALL_BIBLE_CHARACTERS } from '../../data/characters/bibleCharactersData';
import { ALL_BIBLICAL_QUALITIES } from '../../data/characters/bibleQualitiesData';
import { characterLearningService } from '../../services/characterLearningService';
import { multiplayerGameService } from '../../services/multiplayerGameService';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import {
  Users,
  Sparkles,
  BookOpen,
  CheckCircle2,
  XCircle,
  Shield,
  Award,
  Search,
  Quote,
  Clock,
} from 'lucide-react';

interface BibleCharacterHubProps {
  onBack?: () => void;
  onSelectCharacterQuiz?: (character: BibleCharacterProfile) => void;
}

export const BibleCharacterHub: React.FC<BibleCharacterHubProps> = ({
  onBack,
  onSelectCharacterQuiz,
}) => {
  const guest = multiplayerGameService.getGuestIdentity();
  const playerId = guest.id;

  const [activeTab, setActiveTab] = useState<'characters' | 'qualities'>('characters');
  const [selectedTestament, setSelectedTestament] = useState<'All' | 'Old' | 'New'>('All');
  const [selectedQualityFilter, setSelectedQualityFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Character Detail Modal
  const [inspectedCharacter, setInspectedCharacter] = useState<BibleCharacterProfile | null>(null);
  // Selected Quality Detail Modal
  const [inspectedQuality, setInspectedQuality] = useState<BiblicalQualityProfile | null>(null);

  // Quick Practice Quiz Modal State
  const [activeQuizQuestion, setActiveQuizQuestion] = useState<CharacterLearningQuestion | null>(null);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Player Mastery Data
  const playerMastery = characterLearningService.getPlayerMastery(playerId);

  // Filter Characters
  const filteredCharacters = ALL_BIBLE_CHARACTERS.filter((c) => {
    const matchesTestament = selectedTestament === 'All' || c.testament === selectedTestament;
    const matchesQuality =
      selectedQualityFilter === 'All' ||
      c.positiveQualities.some((q) => q.toLowerCase() === selectedQualityFilter.toLowerCase());
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.background.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTestament && matchesQuality && matchesSearch;
  });

  // Filter Qualities
  const filteredQualities = ALL_BIBLICAL_QUALITIES.filter((q) => {
    return (
      q.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.definition.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleStartCharacterPractice = (char: BibleCharacterProfile) => {
    const questions = characterLearningService.getQuestionsForCharacter(char.id, playerId, 5);
    if (questions.length > 0) {
      setActiveQuizQuestion(questions[0]);
      setSelectedOptionIdx(null);
      setIsAnswerRevealed(false);
      setQuizScore(0);
    } else if (onSelectCharacterQuiz) {
      onSelectCharacterQuiz(char);
    }
  };

  const handleSelectQuizOption = (idx: number) => {
    if (isAnswerRevealed || !activeQuizQuestion) return;

    setSelectedOptionIdx(idx);
    setIsAnswerRevealed(true);

    const isCorrect = idx === activeQuizQuestion.correctAnswerIndex;
    if (isCorrect) {
      setQuizScore((prev) => prev + 1);
    }

    characterLearningService.recordCharacterAttempt({
      playerId,
      characterId: activeQuizQuestion.characterId,
      questionId: activeQuizQuestion.id,
      isCorrect,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in text-[#0F172A]">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#1E1B4B] via-[#312E81] to-[#2563EB] text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-indigo-400/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-black tracking-wide uppercase font-outfit">
            <Sparkles className="w-3.5 h-3.5" /> Bible Character Learning System & 20 Biblical Qualities
          </div>
          <h1 className="text-3xl sm:text-5xl font-black font-outfit tracking-tight text-white">
            Heroes, Matriarchs & Apostles
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed font-medium font-inter">
            Journey into the lives of 55+ canonical figures across the Old and New Testaments. Discover what they did, examine their faithful choices and tragic mistakes, explore 20 biblical character qualities, and learn timeless spiritual lessons with verified Scripture references.
          </p>
        </div>

        {onBack && (
          <Button
            variant="outline"
            size="md"
            onClick={onBack}
            className="self-start md:self-auto shrink-0 font-black border-indigo-300 text-white hover:bg-white/10"
          >
            Back to Curriculums
          </Button>
        )}
      </div>

      {/* Main Tabs Strip: Characters vs Qualities */}
      <div className="flex items-center gap-3 border-b-2 border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('characters')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-sm font-outfit transition-all cursor-pointer ${
            activeTab === 'characters'
              ? 'bg-[#2563EB] text-white shadow-md'
              : 'text-slate-600 hover:text-[#0F172A] hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Bible Characters ({ALL_BIBLE_CHARACTERS.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('qualities')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-sm font-outfit transition-all cursor-pointer ${
            activeTab === 'qualities'
              ? 'bg-[#2563EB] text-white shadow-md'
              : 'text-slate-600 hover:text-[#0F172A] hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>20 Biblical Qualities</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border-2 border-[#CBD5E1] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 font-outfit">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={activeTab === 'characters' ? 'Search characters by name, role...' : 'Search qualities...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-inter focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          />
        </div>

        {activeTab === 'characters' && (
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Testament Filter */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
              {(['All', 'Old', 'New'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTestament(t)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    selectedTestament === t
                      ? 'bg-white text-[#2563EB] shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t === 'All' ? 'All Testaments' : `${t} Testament`}
                </button>
              ))}
            </div>

            {/* Quality Dropdown Filter */}
            <select
              value={selectedQualityFilter}
              onChange={(e) => setSelectedQualityFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="All">All Character Qualities</option>
              {ALL_BIBLICAL_QUALITIES.map((q) => (
                <option key={q.id} value={q.name}>
                  {q.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* VIEW 1: CHARACTERS GRID */}
      {activeTab === 'characters' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCharacters.map((char) => {
            const mastery = playerMastery[char.id];
            const percent = mastery ? mastery.masteryPercentage : 0;

            return (
              <div
                key={char.id}
                className="bg-white rounded-3xl border-2 border-[#CBD5E1] p-6 shadow-xs hover:border-[#2563EB] hover:shadow-xl transition-all flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        char.testament === 'Old'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                      }`}
                    >
                      {char.testament} Testament
                    </span>

                    <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 font-outfit">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> {char.era}
                    </span>
                  </div>

                  {/* Character Name & Role */}
                  <div>
                    <h3 className="text-xl font-black text-[#0F172A] font-outfit group-hover:text-[#2563EB] transition-colors">
                      {char.name}
                    </h3>
                    <p className="text-xs font-bold text-[#2563EB] font-outfit mt-0.5">
                      {char.role}
                    </p>
                    <p className="text-xs text-slate-600 font-inter line-clamp-2 mt-2 leading-relaxed">
                      {char.background}
                    </p>
                  </div>

                  {/* Qualities Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {char.positiveQualities.map((qual) => (
                      <span
                        key={qual}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200"
                      >
                        {qual}
                      </span>
                    ))}
                  </div>

                  {/* Mastery Progress Bar */}
                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 font-outfit">
                      <span>Study Mastery</span>
                      <span className={percent > 0 ? 'text-emerald-700 font-black' : ''}>
                        {percent}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#2563EB] to-emerald-500 rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInspectedCharacter(char)}
                    className="flex-1 font-black text-xs cursor-pointer border-slate-300"
                  >
                    View 10-Pt Profile
                  </Button>

                  <Button
                    variant="gold"
                    size="sm"
                    onClick={() => handleStartCharacterPractice(char)}
                    leftIcon={<BookOpen className="w-3.5 h-3.5" />}
                    className="font-black text-xs cursor-pointer shadow-xs"
                  >
                    Practice
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: 20 BIBLICAL QUALITIES GRID */}
      {activeTab === 'qualities' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredQualities.map((qual) => (
            <div
              key={qual.id}
              className="bg-white rounded-3xl border-2 border-[#CBD5E1] p-6 shadow-xs hover:border-[#7C3AED] hover:shadow-xl transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-purple-100 text-[#7C3AED] flex items-center justify-center font-black">
                    <Award className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500 font-outfit">
                    Biblical Trait
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-black text-[#0F172A] font-outfit">
                    {qual.name}
                  </h3>
                  <p className="text-xs text-slate-600 font-inter line-clamp-3 mt-1.5 leading-relaxed">
                    {qual.definition}
                  </p>
                </div>

                {/* Primary Exemplars */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block font-outfit">
                    Key Biblical Exemplars
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {qual.primaryExemplars.map((ex) => (
                      <span
                        key={ex.characterId}
                        className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-purple-50 text-purple-900 border border-purple-200"
                      >
                        {ex.characterName}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInspectedQuality(qual)}
                  className="w-full font-black text-xs cursor-pointer border-purple-300 text-purple-900 hover:bg-purple-50"
                >
                  Explore Quality & Scripture
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CHARACTER 10-POINT DETAIL MODAL */}
      {inspectedCharacter && (
        <Modal
          isOpen={Boolean(inspectedCharacter)}
          onClose={() => setInspectedCharacter(null)}
          title={`${inspectedCharacter.name} — Full Biblical Profile`}
          maxWidth="xl"
        >
          <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-2 text-xs sm:text-sm font-inter text-[#0F172A]">
            {/* Header Badge Strip */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800">
                {inspectedCharacter.testament} Testament
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                Era: {inspectedCharacter.era}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                {inspectedCharacter.role}
              </span>
            </div>

            {/* Quote if available */}
            {inspectedCharacter.famousQuote && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 italic space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-black text-[#2563EB] not-italic font-outfit">
                  <Quote className="w-3.5 h-3.5" /> Key Spoken Words ({inspectedCharacter.famousQuote.reference})
                </div>
                <p className="text-slate-800 leading-relaxed font-serif">
                  {inspectedCharacter.famousQuote.quote}
                </p>
              </div>
            )}

            {/* 1. Background & Family */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#2563EB] font-outfit">
                1. Biblical Background & Lineage
              </h4>
              <p className="leading-relaxed text-slate-700">{inspectedCharacter.background}</p>
              <p className="text-xs text-slate-500 font-medium">
                <strong>Family & Relationships:</strong> {inspectedCharacter.familyRelationships}
              </p>
            </div>

            {/* 2. What they did */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#2563EB] font-outfit">
                2. What They Did (Major Accomplishments)
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-slate-700">
                {inspectedCharacter.majorAccomplishments.map((acc, i) => (
                  <li key={i}>{acc}</li>
                ))}
              </ul>
            </div>

            {/* 3. Important Events */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#2563EB] font-outfit">
                3. Critical Events in Their Lives
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-slate-700">
                {inspectedCharacter.importantEvents.map((ev, i) => (
                  <li key={i}>{ev}</li>
                ))}
              </ul>
            </div>

            {/* 4. Qualities & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800 font-outfit flex items-center gap-1.5">
                  <Shield className="w-4 h-4" /> Positive Qualities Demonstrated
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {inspectedCharacter.positiveQualities.map((q) => (
                    <span
                      key={q}
                      className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white text-emerald-900 border border-emerald-300"
                    >
                      {q}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-rose-800 font-outfit flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" /> Weaknesses & Mistakes
                </h4>
                <ul className="list-disc pl-4 space-y-1 text-xs text-rose-950">
                  {inspectedCharacter.weaknessesOrMistakes.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 5. Growth & Development */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#2563EB] font-outfit">
                4. Growth, Maturity & Story Development
              </h4>
              <p className="leading-relaxed text-slate-700">
                {inspectedCharacter.growthAndDevelopment}
              </p>
            </div>

            {/* 6. Lessons for Believers Today */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 font-outfit flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" /> Life Lessons for Believers Today
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-slate-800">
                {inspectedCharacter.lifeLessons.map((l, i) => (
                  <li key={i}>{l}</li>
                ))}
              </ul>
            </div>

            {/* 7. Key Scripture References */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#2563EB] font-outfit">
                5. Relevant Bible References
              </h4>
              <div className="flex flex-wrap gap-2">
                {inspectedCharacter.keyScriptureReferences.map((ref) => (
                  <span
                    key={ref}
                    className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold font-outfit"
                  >
                    <BookOpen className="w-3 h-3 inline mr-1 text-[#2563EB]" />
                    {ref}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
              <Button
                variant="outline"
                size="md"
                onClick={() => setInspectedCharacter(null)}
              >
                Close
              </Button>
              <Button
                variant="gold"
                size="md"
                onClick={() => {
                  const char = inspectedCharacter;
                  setInspectedCharacter(null);
                  handleStartCharacterPractice(char);
                }}
                leftIcon={<BookOpen className="w-4 h-4" />}
              >
                Start Practice Challenge
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* QUALITY DETAIL MODAL */}
      {inspectedQuality && (
        <Modal
          isOpen={Boolean(inspectedQuality)}
          onClose={() => setInspectedQuality(null)}
          title={`Biblical Quality: ${inspectedQuality.name}`}
          maxWidth="xl"
        >
          <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-2 text-xs sm:text-sm font-inter text-[#0F172A]">
            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200">
              <h4 className="text-xs font-black uppercase tracking-wider text-purple-900 font-outfit">
                Biblical Definition
              </h4>
              <p className="mt-1 leading-relaxed text-purple-950 font-medium">
                {inspectedQuality.definition}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#2563EB] font-outfit">
                Scriptural Foundations
              </h4>
              <div className="flex flex-wrap gap-2">
                {inspectedQuality.scripturalFoundations.map((ref) => (
                  <span
                    key={ref}
                    className="px-3 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold font-outfit"
                  >
                    <BookOpen className="w-3.5 h-3.5 inline mr-1 text-[#2563EB]" />
                    {ref}
                  </span>
                ))}
              </div>
            </div>

            {/* Primary Exemplars */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#2563EB] font-outfit">
                Primary Biblical Exemplars
              </h4>
              <div className="space-y-2">
                {inspectedQuality.primaryExemplars.map((ex) => (
                  <div
                    key={ex.characterId}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm text-[#0F172A] font-outfit">
                        {ex.characterName}
                      </span>
                      <span className="text-xs font-bold text-[#2563EB] font-outfit">
                        {ex.scriptureReference}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {ex.contextAndDemonstration}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Practical Application */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900 font-outfit">
                Practical Life Application
              </h4>
              <p className="text-emerald-950 leading-relaxed">
                {inspectedQuality.practicalLifeApplication}
              </p>
            </div>

            {/* Reflection Questions */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#2563EB] font-outfit">
                Reflection Questions
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-slate-700">
                {inspectedQuality.reflectionQuestions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <Button
                variant="outline"
                size="md"
                onClick={() => setInspectedQuality(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* QUICK PRACTICE QUESTION MODAL (AUTOMATIC PROGRESSION) */}
      {activeQuizQuestion && (
        <Modal
          isOpen={Boolean(activeQuizQuestion)}
          onClose={() => setActiveQuizQuestion(null)}
          title={`Character Learning Challenge (Score: ${quizScore})`}
          maxWidth="lg"
        >
          <div className="space-y-5 text-xs sm:text-sm font-inter text-[#0F172A]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#2563EB] font-outfit">
                Question Challenge
              </span>
              <span className="text-xs font-bold text-slate-500 font-outfit">
                <BookOpen className="w-3.5 h-3.5 inline mr-1 text-[#2563EB]" />
                {activeQuizQuestion.scriptureReference}
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black font-outfit text-[#0F172A] leading-snug">
              {activeQuizQuestion.prompt}
            </h3>

            {/* Options */}
            <div className="space-y-2.5">
              {activeQuizQuestion.options.map((opt, idx) => {
                const isSelected = selectedOptionIdx === idx;
                const isCorrect = idx === activeQuizQuestion.correctAnswerIndex;

                let btnStyle = 'border-slate-200 bg-slate-50 hover:bg-slate-100/70 text-[#0F172A]';
                if (isAnswerRevealed) {
                  if (isCorrect) {
                    btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/30';
                  } else if (isSelected && !isCorrect) {
                    btnStyle = 'border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-500/30';
                  } else {
                    btnStyle = 'border-slate-200 bg-slate-50 opacity-60 text-slate-400';
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={isAnswerRevealed}
                    onClick={() => handleSelectQuizOption(idx)}
                    className={`w-full p-3.5 rounded-2xl border-2 text-left font-semibold text-xs sm:text-sm transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {isAnswerRevealed && isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 ml-2" />
                    )}
                    {isAnswerRevealed && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Answer Explanation */}
            {isAnswerRevealed && (
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-1 animate-fade-in">
                <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider text-[#2563EB] font-outfit">
                  <BookOpen className="w-4 h-4" /> Scripture Context: {activeQuizQuestion.scriptureReference}
                </div>
                <p className="leading-relaxed text-blue-950 font-normal">{activeQuizQuestion.explanation}</p>
              </div>
            )}

            {isAnswerRevealed && (
              <div className="pt-2 flex justify-end">
                <Button
                  variant="gold"
                  size="md"
                  onClick={() => setActiveQuizQuestion(null)}
                >
                  Done
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
