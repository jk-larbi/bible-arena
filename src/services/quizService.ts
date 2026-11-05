import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Quiz, Question } from '../types/bibleArena';

export const quizService = {
  /**
   * Save a newly created quiz along with all questions, options, and secure answer keys
   */
  async saveQuiz(quiz: Quiz, userId?: string): Promise<string> {
    if (!isSupabaseConfigured) {
      // Store locally
      try {
        const saved = localStorage.getItem('biblearena_custom_quizzes');
        const list = saved ? JSON.parse(saved) : [];
        list.unshift(quiz);
        localStorage.setItem('biblearena_custom_quizzes', JSON.stringify(list));
      } catch (err) {
        console.error('Local save error:', err);
      }
      return quiz.id;
    }

    // 1. Insert quiz row
    const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        title: quiz.title,
        description: quiz.description || null,
        category: quiz.category,
        difficulty: quiz.difficulty,
        estimated_minutes: quiz.estimatedMinutes || 5,
        question_count: quiz.questions.length,
        author_id: userId || null,
        author_name: quiz.authorName || 'Community Author',
        is_public: true,
      })
      .select('id')
      .single();

    if (quizError || !quizData) {
      throw new Error(`Failed to save quiz: ${quizError?.message}`);
    }

    const newQuizId = quizData.id;

    // 2. Insert questions sequentially with their options and answer keys
    for (let i = 0; i < quiz.questions.length; i++) {
      const q = quiz.questions[i];

      const { data: qData, error: qError } = await supabase
        .from('questions')
        .insert({
          quiz_id: newQuizId,
          question_order: i,
          text: q.text,
          scripture_reference: q.scriptureReference || null,
          explanation: q.explanation || null,
          time_limit_seconds: 20,
        })
        .select('id')
        .single();

      if (qError || !qData) {
        console.error('Error inserting question:', qError);
        continue;
      }

      const questionId = qData.id;

      // Insert 4 options
      for (let optIdx = 0; optIdx < q.options.length; optIdx++) {
        await supabase.from('question_options').insert({
          question_id: questionId,
          option_index: optIdx,
          option_text: q.options[optIdx],
        });
      }

      // Insert secure answer key
      await supabase.from('answer_keys').insert({
        question_id: questionId,
        correct_option_index: q.correctAnswerIndex,
      });
    }

    return newQuizId;
  },

  /**
   * Fetch all public quizzes from Supabase
   */
  async getQuizzes(): Promise<Quiz[]> {
    if (!isSupabaseConfigured) {
      return [];
    }

    const { data: quizzesData, error } = await supabase
      .from('quizzes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !quizzesData) {
      console.error('Failed to fetch quizzes:', error);
      return [];
    }

    // For each quiz, fetch questions
    const results: Quiz[] = [];

    for (const qRow of quizzesData) {
      const { data: questionsData } = await supabase
        .from('questions')
        .select(`
          id,
          text,
          scripture_reference,
          explanation,
          question_options (
            option_index,
            option_text
          )
        `)
        .eq('quiz_id', qRow.id)
        .order('question_order', { ascending: true });

      const parsedQuestions: Question[] = (questionsData || []).map((qd: any) => {
        const sortedOptions = (qd.question_options || [])
          .sort((a: any, b: any) => a.option_index - b.option_index)
          .map((o: any) => o.option_text);

        return {
          id: qd.id,
          text: qd.text,
          options: sortedOptions,
          correctAnswerIndex: 0, // answer key is hidden from public select by RLS
          scriptureReference: qd.scripture_reference || '',
          explanation: qd.explanation || '',
        };
      });

      results.push({
        id: qRow.id,
        title: qRow.title,
        description: qRow.description,
        category: qRow.category,
        difficulty: qRow.difficulty,
        questionCount: qRow.question_count,
        estimatedMinutes: qRow.estimated_minutes,
        authorName: qRow.author_name,
        questions: parsedQuestions,
        playsCount: qRow.plays_count || 0,
        isCustom: true,
      });
    }

    return results;
  },
};
