import React, { useState, useEffect } from 'react';
import type { Quiz, Question, BibleCategory, QuizDifficulty } from '../../types/bibleArena';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import {
  PlusCircle,
  Trash2,
  Save,
  Send,
  BookOpen,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Copy,
  Eye,
  CheckCircle2,
  Layers,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface QuizBuilderViewProps {
  onQuizPublished: (quizId: string) => void;
  onCancel: () => void;
}

export const QuizBuilderView: React.FC<QuizBuilderViewProps> = ({
  onQuizPublished,
  onCancel,
}) => {
  const { currentUser, publishCustomQuiz, showToast } = useAuth();

  // Quiz Metadata (NO description required or displayed!)
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<BibleCategory>('New Testament');
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('Medium');

  // Dynamic Unlimited Questions List
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: 'q-init-1',
      text: '',
      options: ['', '', '', ''],
      correctAnswerIndex: 0,
      scriptureReference: '',
      explanation: '',
    },
    {
      id: 'q-init-2',
      text: '',
      options: ['', '', '', ''],
      correctAnswerIndex: 0,
      scriptureReference: '',
      explanation: '',
    },
    {
      id: 'q-init-3',
      text: '',
      options: ['', '', '', ''],
      correctAnswerIndex: 0,
      scriptureReference: '',
      explanation: '',
    },
  ]);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [draftSavedTime, setDraftSavedTime] = useState<string | null>(null);

  // Preview Modal State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewQIndex, setPreviewQIndex] = useState(0);

  // Option shape & color mappings (Funkwiz-inspired tactile cues)
  const optionMeta = [
    { label: 'A', shape: '▲', color: 'bg-[#DC2626]', text: 'text-[#DC2626]', border: 'border-[#DC2626]', lightBg: 'bg-red-50' },
    { label: 'B', shape: '◆', color: 'bg-[#2563EB]', text: 'text-[#2563EB]', border: 'border-[#2563EB]', lightBg: 'bg-blue-50' },
    { label: 'C', shape: '●', color: 'bg-[#D97706]', text: 'text-[#D97706]', border: 'border-[#D97706]', lightBg: 'bg-amber-50' },
    { label: 'D', shape: '◼', color: 'bg-[#059669]', text: 'text-[#059669]', border: 'border-[#059669]', lightBg: 'bg-emerald-50' },
  ];

  // Restore draft from localStorage if present
  useEffect(() => {
    try {
      const draft = localStorage.getItem('biblearena_quiz_draft');
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.category) setCategory(parsed.category);
        if (parsed.difficulty) setDifficulty(parsed.difficulty);
        if (parsed.questions && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
          setQuestions(parsed.questions);
        }
        setDraftSavedTime('Restored previous draft from browser storage');
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Save Draft to Local Storage
  const handleSaveDraft = () => {
    const draftData = {
      title,
      category,
      difficulty,
      questions,
    };
    try {
      localStorage.setItem('biblearena_quiz_draft', JSON.stringify(draftData));
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setDraftSavedTime(`Draft saved at ${now}`);
      showToast(`Quiz draft saved locally (${questions.length} questions)!`);
    } catch {
      showToast('Could not save draft to local storage.');
    }
  };

  // Add new question (Unlimited!)
  const handleAddQuestion = () => {
    const newQ: Question = {
      id: `q-${Date.now()}-${questions.length + 1}`,
      text: '',
      options: ['', '', '', ''],
      correctAnswerIndex: 0,
      scriptureReference: '',
      explanation: '',
    };
    setQuestions((prev) => [...prev, newQ]);
    showToast(`Added Question #${questions.length + 1}`);
  };

  // Duplicate an existing question
  const handleDuplicateQuestion = (index: number) => {
    const target = questions[index];
    const duplicated: Question = {
      ...target,
      id: `q-${Date.now()}-${questions.length + 1}`,
      text: target.text ? `${target.text} (Copy)` : '',
    };
    const updated = [...questions];
    updated.splice(index + 1, 0, duplicated);
    setQuestions(updated);
    showToast(`Duplicated Question #${index + 1}`);
  };

  // Reorder: Move Question Up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...questions];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    setQuestions(updated);
  };

  // Reorder: Move Question Down
  const handleMoveDown = (index: number) => {
    if (index === questions.length - 1) return;
    const updated = [...questions];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    setQuestions(updated);
  };

  // Remove question
  const handleRemoveQuestion = (index: number) => {
    if (questions.length <= 1) {
      showToast('A quiz must contain at least one question.');
      return;
    }
    setQuestions((prev) => prev.filter((_, idx) => idx !== index));
    showToast(`Removed Question #${index + 1}`);
  };

  // Field change handlers
  const handleQuestionTextChange = (index: number, text: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], text };
      return updated;
    });
    if (errors[`q_${index}_text`]) {
      setErrors((prev) => ({ ...prev, [`q_${index}_text`]: '' }));
    }
  };

  const handleOptionChange = (qIndex: number, optIndex: number, text: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const newOptions = [...updated[qIndex].options];
      newOptions[optIndex] = text;
      updated[qIndex] = { ...updated[qIndex], options: newOptions };
      return updated;
    });
    if (errors[`q_${qIndex}_opt_${optIndex}`]) {
      setErrors((prev) => ({ ...prev, [`q_${qIndex}_opt_${optIndex}`]: '' }));
    }
  };

  const handleCorrectOptionChange = (qIndex: number, optIndex: number) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIndex] = { ...updated[qIndex], correctAnswerIndex: optIndex };
      return updated;
    });
  };

  const handleScriptureRefChange = (index: number, scriptureReference: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], scriptureReference };
      return updated;
    });
  };

  const handleExplanationChange = (index: number, explanation: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], explanation };
      return updated;
    });
  };

  // Load Scripture template (Philippians 5-question study pack)
  const handleLoadSampleTemplate = () => {
    setTitle('Walk in Joy: The Epistle to the Philippians');
    setCategory('New Testament');
    setDifficulty('Medium');
    setQuestions([
      {
        id: 'q-phil-1',
        text: 'According to Philippians 4:13, through whom can believers do all things?',
        options: ['Christ who strengthens me', 'Our own righteous deeds', 'The high priest of the temple', 'Angels sent from heaven'],
        correctAnswerIndex: 0,
        scriptureReference: 'Philippians 4:13',
        explanation: 'Paul emphasizes that divine power and endurance come solely through Christ.',
      },
      {
        id: 'q-phil-2',
        text: 'In Philippians 2, what attitude are believers exhorted to adopt?',
        options: ['Selfish ambition', 'The humble mind of Christ Jesus', 'Desire for earthly titles', 'Boasting in spiritual knowledge'],
        correctAnswerIndex: 1,
        scriptureReference: 'Philippians 2:5-7',
        explanation: 'Christ emptied Himself, taking the form of a servant and humbling Himself unto death.',
      },
      {
        id: 'q-phil-3',
        text: 'Where was the Apostle Paul when he penned this joyful letter to the church at Philippi?',
        options: ['On a missionary ship to Rome', 'In Roman imprisonment / chains', 'In the palace in Jerusalem', 'On the Isle of Patmos'],
        correctAnswerIndex: 1,
        scriptureReference: 'Philippians 1:12-14',
        explanation: 'Paul wrote from prison, rejoicing that his chains advanced the gospel message.',
      },
      {
        id: 'q-phil-4',
        text: 'What kind of peace does Philippians 4 promise will guard the hearts and minds of those who pray?',
        options: ['The temporary peace of the world', 'Peace that surpasses all understanding', 'Peace only during peaceful times', 'Political peace among nations'],
        correctAnswerIndex: 1,
        scriptureReference: 'Philippians 4:6-7',
        explanation: 'God’s peace transcends human comprehension and guards our hearts in Christ Jesus.',
      },
      {
        id: 'q-phil-5',
        text: 'According to Philippians 1:6, who will bring the good work started in you to completion?',
        options: ['The local magistrate', 'God who began it, until the day of Jesus Christ', 'Our own wisdom and willpower', 'Our church council'],
        correctAnswerIndex: 1,
        scriptureReference: 'Philippians 1:6',
        explanation: 'Being confident of this very thing, that He who began a good work in you will complete it.',
      },
    ]);
    showToast('Loaded 5-question Philippians Scripture pack!');
  };

  // Validate and publish quiz
  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Please provide a title for your Bible quiz.';
    }

    if (questions.length < 1) {
      newErrors.questions = 'Add at least one question to your quiz.';
    }

    // Check each question
    questions.forEach((q, idx) => {
      if (!q.text.trim()) {
        newErrors[`q_${idx}_text`] = `Question ${idx + 1} text cannot be empty.`;
      }
      q.options.forEach((opt, oIdx) => {
        if (!opt.trim()) {
          newErrors[`q_${idx}_opt_${oIdx}`] = `Option ${['A', 'B', 'C', 'D'][oIdx]} is required for Question ${idx + 1}.`;
        }
      });
      if (!q.scriptureReference.trim()) {
        newErrors[`q_${idx}_ref`] = `Scripture citation for Question ${idx + 1} is required.`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('Please fill in the required question fields before publishing.');
      const firstErrorKey = Object.keys(newErrors)[0];
      const el = document.getElementById(firstErrorKey);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setErrors({});

    const estimatedMinutes = Math.max(2, Math.ceil(questions.length * 0.75));
    const newQuizId = `custom-quiz-${Date.now()}`;
    const newQuiz: Quiz = {
      id: newQuizId,
      title: title.trim(),
      description: `${title.trim()} — ${category} Scripture Quiz featuring ${questions.length} questions.`,
      category,
      difficulty,
      questionCount: questions.length,
      estimatedMinutes,
      authorName: currentUser.name || 'BibleArena Member',
      questions,
      isCustom: true,
      tags: [category, 'Community Quiz', `${questions.length} Questions`],
    };

    publishCustomQuiz(newQuiz);

    // Clear saved draft
    try {
      localStorage.removeItem('biblearena_quiz_draft');
    } catch {
      // Ignore
    }

    showToast(`Published "${newQuiz.title}" with ${questions.length} questions!`);
    onQuizPublished(newQuizId);
  };

  const previewQuestion = questions[previewQIndex] || questions[0];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* 1. Header & Controls Bar */}
      <div className="bg-white rounded-3xl border border-[#CBD5E1] p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#234E91] flex items-center gap-1.5 bg-[#EAF1FA] px-3 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-[#E9B44C]" /> BibleArena Question Builder
            </span>
            <span className="text-xs font-black bg-[#EDE9FE] text-[#7C3AED] px-3 py-1 rounded-full">
              {questions.length} {questions.length === 1 ? 'Question' : 'Questions'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#14213D]">
            Create a Bible Quiz
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Add as many Scripture questions as you wish with no arbitrary limits.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleLoadSampleTemplate}
            title="Pre-fill with 5-question Philippians study pack"
          >
            Load 5-Question Pack
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setPreviewQIndex(0);
              setIsPreviewOpen(true);
            }}
            leftIcon={<Eye className="w-4 h-4 text-[#234E91]" />}
          >
            Preview Quiz
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleSaveDraft}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Draft
          </Button>
        </div>
      </div>

      {draftSavedTime && (
        <div className="bg-[#EAF1FA] text-[#234E91] text-xs font-semibold px-4 py-2.5 rounded-2xl border border-[#234E91]/20 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#234E91]" />
            <span>{draftSavedTime}</span>
          </span>
          <span className="text-[11px] text-[#64748B]">Browser storage safe</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handlePublish} className="space-y-8">
        {/* 2. Streamlined Metadata Card (Immediate, NO description required!) */}
        <div className="bg-white rounded-3xl border border-[#CBD5E1] p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
            <h2 className="text-base font-bold text-[#14213D] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#234E91]" />
              <span>Quiz Setup</span>
            </h2>
            <span className="text-xs text-[#64748B]">
              Ready to write Scripture questions immediately
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Quiz Title */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#14213D] mb-1.5">
                Quiz Title *
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
                }}
                placeholder="e.g. The Parables of Jesus in Luke & Matthew"
                className={`w-full px-4 py-3 rounded-2xl border text-sm font-bold text-[#14213D] focus:outline-none focus:ring-2 transition-all ${
                  errors.title ? 'border-red-500 focus:ring-red-200' : 'border-[#CBD5E1] focus:ring-[#234E91]/20 focus:border-[#234E91]'
                }`}
              />
              {errors.title && (
                <p className="text-xs text-red-600 mt-1 font-semibold">{errors.title}</p>
              )}
            </div>

            {/* Category & Difficulty side-by-side */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#14213D] mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as BibleCategory)}
                  className="w-full px-3 py-3 rounded-2xl border border-[#CBD5E1] text-xs font-bold text-[#14213D] bg-white focus:outline-none focus:ring-2 focus:ring-[#234E91]/20"
                >
                  <option value="New Testament">New Testament</option>
                  <option value="Old Testament">Old Testament</option>
                  <option value="People of the Bible">People of the Bible</option>
                  <option value="Bible History">Bible History</option>
                  <option value="Scripture Challenge">Scripture Challenge</option>
                  <option value="Christian Living">Christian Living</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#14213D] mb-1.5">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as QuizDifficulty)}
                  className="w-full px-3 py-3 rounded-2xl border border-[#CBD5E1] text-xs font-bold text-[#14213D] bg-white focus:outline-none focus:ring-2 focus:ring-[#234E91]/20"
                >
                  <option value="Easy">Easy (Beginner)</option>
                  <option value="Medium">Medium (Regular)</option>
                  <option value="Hard">Hard (Scholar)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Question Navigation Strip (For 5, 20, 50, 100+ questions) */}
        <div className="bg-white rounded-2xl border border-[#CBD5E1] p-4 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none flex-1">
            <span className="text-xs font-bold text-[#64748B] shrink-0 mr-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-[#234E91]" /> Jump to:
            </span>
            {questions.map((_, qIdx) => (
              <a
                key={qIdx}
                href={`#question-card-${qIdx}`}
                className="w-8 h-8 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-xs font-black text-[#14213D] flex items-center justify-center hover:bg-[#234E91] hover:text-white hover:border-[#234E91] transition-all shrink-0 cursor-pointer"
              >
                {qIdx + 1}
              </a>
            ))}
          </div>

          <Button
            type="button"
            variant="gold"
            size="sm"
            onClick={handleAddQuestion}
            leftIcon={<PlusCircle className="w-4 h-4" />}
            className="shrink-0 font-extrabold shadow-xs"
          >
            + Add Question
          </Button>
        </div>

        {/* 4. Unlimited Questions List */}
        <div className="space-y-6">
          {questions.map((q, qIdx) => (
            <div
              key={q.id || qIdx}
              id={`question-card-${qIdx}`}
              className="bg-white rounded-3xl border-2 border-[#CBD5E1] p-6 sm:p-8 shadow-xs space-y-5 relative hover:border-[#234E91]/40 transition-all scroll-mt-24"
            >
              {/* Question Header & Ordering Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F1F5F9]">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-[#EDE9FE] text-[#7C3AED] font-black text-xs flex items-center justify-center">
                    {qIdx + 1}
                  </span>
                  <span className="text-sm font-extrabold text-[#14213D]">
                    Question {qIdx + 1} of {questions.length}
                  </span>
                  {q.text.trim() && (
                    <span className="text-xs text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                    </span>
                  )}
                </div>

                {/* Question Actions: Move Up, Move Down, Duplicate, Delete */}
                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleMoveUp(qIdx)}
                    disabled={qIdx === 0}
                    title="Move Question Up"
                    className="p-1.5 rounded-xl border border-[#CBD5E1] text-[#64748B] hover:bg-[#EAF1FA] hover:text-[#234E91] disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveDown(qIdx)}
                    disabled={qIdx === questions.length - 1}
                    title="Move Question Down"
                    className="p-1.5 rounded-xl border border-[#CBD5E1] text-[#64748B] hover:bg-[#EAF1FA] hover:text-[#234E91] disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDuplicateQuestion(qIdx)}
                    title="Duplicate Question"
                    className="p-1.5 rounded-xl border border-[#CBD5E1] text-[#64748B] hover:bg-[#EAF1FA] hover:text-[#234E91] cursor-pointer transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(qIdx)}
                    disabled={questions.length <= 1}
                    title="Remove Question"
                    className="p-1.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#14213D] mb-1.5">
                  Question Text *
                </label>
                <input
                  id={`q_${qIdx}_text`}
                  type="text"
                  value={q.text}
                  onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                  placeholder="e.g. Which disciple walked on the water toward Jesus before beginning to sink?"
                  className={`w-full px-4 py-3 rounded-2xl border text-sm font-semibold text-[#14213D] focus:outline-none focus:ring-2 transition-all ${
                    errors[`q_${qIdx}_text`]
                      ? 'border-red-500 focus:ring-red-200 bg-red-50/20'
                      : 'border-[#CBD5E1] bg-[#F8FAFC] focus:bg-white focus:ring-[#234E91]/20 focus:border-[#234E91]'
                  }`}
                />
                {errors[`q_${qIdx}_text`] && (
                  <p className="text-xs text-red-600 mt-1 font-semibold">{errors[`q_${qIdx}_text`]}</p>
                )}
              </div>

              {/* 4 Multiple-Choice Options with Funkwiz Visual Coding */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-[#14213D]">
                    Four Answer Options (Select the correct answer) *
                  </label>
                  <span className="text-[11px] text-[#64748B]">Click radio button to mark correct answer</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {q.options.map((opt, oIdx) => {
                    const meta = optionMeta[oIdx];
                    const isCorrect = q.correctAnswerIndex === oIdx;

                    return (
                      <div
                        key={oIdx}
                        className={`p-3 rounded-2xl border-2 transition-all flex items-center gap-3 ${
                          isCorrect
                            ? 'border-emerald-500 bg-emerald-50/40 shadow-xs ring-2 ring-emerald-200'
                            : errors[`q_${qIdx}_opt_${oIdx}`]
                            ? 'border-red-400 bg-red-50/30'
                            : 'border-[#CBD5E1] bg-[#F8FAFC] hover:border-[#94A3B8]'
                        }`}
                      >
                        {/* Radio selection to mark as correct */}
                        <label className="cursor-pointer flex items-center">
                          <input
                            type="radio"
                            name={`correct-answer-${q.id || qIdx}`}
                            checked={isCorrect}
                            onChange={() => handleCorrectOptionChange(qIdx, oIdx)}
                            className="sr-only"
                          />
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-xs transition-transform ${
                              meta.color
                            } ${isCorrect ? 'scale-110 ring-2 ring-emerald-500' : 'opacity-85'}`}
                          >
                            <span>{meta.shape} {meta.label}</span>
                          </div>
                        </label>

                        {/* Option text input */}
                        <input
                          id={`q_${qIdx}_opt_${oIdx}`}
                          type="text"
                          value={opt}
                          onChange={(e) => handleOptionChange(qIdx, oIdx, e.target.value)}
                          placeholder={`Option ${meta.label}`}
                          className="flex-1 bg-transparent text-sm font-semibold text-[#14213D] focus:outline-none"
                        />

                        {isCorrect && (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                            Correct
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Scripture Reference and Explanation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-[#14213D] mb-1">
                    Scripture Citation *
                  </label>
                  <input
                    id={`q_${qIdx}_ref`}
                    type="text"
                    value={q.scriptureReference}
                    onChange={(e) => handleScriptureRefChange(qIdx, e.target.value)}
                    placeholder="e.g. Matthew 14:28-31"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold text-[#14213D] focus:outline-none focus:ring-2 ${
                      errors[`q_${qIdx}_ref`]
                        ? 'border-red-500 bg-red-50/20'
                        : 'border-[#CBD5E1] bg-white focus:ring-[#234E91]/20'
                    }`}
                  />
                  {errors[`q_${qIdx}_ref`] && (
                    <p className="text-[11px] text-red-600 mt-1">{errors[`q_${qIdx}_ref`]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-[#14213D] mb-1">
                    Biblical Explanation / Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={q.explanation}
                    onChange={(e) => handleExplanationChange(qIdx, e.target.value)}
                    placeholder="e.g. Peter took steps of faith until he looked at the waves..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-xs font-semibold text-[#14213D] focus:outline-none focus:ring-2 focus:ring-[#234E91]/20"
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Bottom + Add Question Card */}
          <div className="p-6 rounded-3xl border-2 border-dashed border-[#CBD5E1] text-center space-y-3 bg-[#F8FAFC]">
            <Button
              type="button"
              variant="gold"
              size="lg"
              onClick={handleAddQuestion}
              leftIcon={<PlusCircle className="w-5 h-5" />}
              className="font-extrabold shadow-sm"
            >
              + Add Another Question (Question #{questions.length + 1})
            </Button>
            <p className="text-xs text-[#64748B]">
              Add 5, 20, 50, 100 or more questions without limit. Your quiz is saved in local browser storage.
            </p>
          </div>
        </div>

        {/* Action Bottom Bar */}
        <div className="pt-4 border-t border-[#CBD5E1] flex flex-col sm:flex-row items-center justify-between gap-4">
          <Button type="button" variant="ghost" size="md" onClick={onCancel}>
            Cancel and Return
          </Button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => {
                setPreviewQIndex(0);
                setIsPreviewOpen(true);
              }}
              leftIcon={<Eye className="w-5 h-5 text-[#234E91]" />}
              className="flex-1 sm:flex-none font-bold"
            >
              Preview Quiz
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={handleSaveDraft}
              leftIcon={<Save className="w-4 h-4" />}
              className="flex-1 sm:flex-none font-bold"
            >
              Save Draft
            </Button>
            <Button
              type="submit"
              variant="gold"
              size="lg"
              leftIcon={<Send className="w-4 h-4" />}
              className="flex-1 sm:flex-none font-extrabold shadow-md"
            >
              Publish Bible Quiz ({questions.length} Qs)
            </Button>
          </div>
        </div>
      </form>

      {/* 5. Interactive Quiz Preview Modal */}
      {isPreviewOpen && (
        <Modal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title={`Preview: ${title || 'Untitled Quiz'} (${previewQIndex + 1} of ${questions.length})`}
          maxWidth="lg"
        >
          <div className="space-y-6 py-2">
            {/* Header HUD */}
            <div className="flex items-center justify-between bg-gradient-to-r from-[#7C3AED] to-[#2563EB] text-white p-4 rounded-2xl">
              <span className="font-mono text-xs font-extrabold text-[#E9B44C]">
                Question {previewQIndex + 1} of {questions.length}
              </span>
              <span className="text-xs text-[#CBD5E1]">
                Scripture: {previewQuestion?.scriptureReference || 'Unspecified'}
              </span>
            </div>

            {/* Question Text */}
            <h3 className="text-lg sm:text-xl font-extrabold text-[#14213D] text-center px-4">
              {previewQuestion?.text || '(Question text has not been written yet)'}
            </h3>

            {/* 4 Answer Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {previewQuestion?.options.map((opt, idx) => {
                const meta = optionMeta[idx];
                const isCorrect = previewQuestion.correctAnswerIndex === idx;

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all ${
                      isCorrect
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold'
                        : 'border-[#CBD5E1] bg-white text-[#14213D]'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl ${meta.color} text-white font-black text-xs flex items-center justify-center shrink-0`}>
                      {meta.shape} {meta.label}
                    </div>
                    <span className="text-sm font-semibold flex-1">{opt || `(Option ${meta.label})`}</span>
                    {isCorrect && (
                      <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                        Correct Answer
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Explanation card */}
            {previewQuestion?.explanation && (
              <div className="p-4 rounded-2xl bg-[#EAF1FA] border border-[#234E91]/20 text-xs text-[#1E293B]">
                <span className="font-bold text-[#234E91] block mb-1">Biblical Note:</span>
                <p>{previewQuestion.explanation}</p>
              </div>
            )}

            {/* Preview Navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-[#F1F5F9]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewQIndex((prev) => Math.max(0, prev - 1))}
                disabled={previewQIndex === 0}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
              >
                Previous
              </Button>
              <span className="text-xs font-bold text-[#64748B]">
                {previewQIndex + 1} / {questions.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewQIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                disabled={previewQIndex === questions.length - 1}
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                Next
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
