// ============================================================================
// BIBLEARENA — BIBLE CHARACTERS & BIBLICAL QUALITIES DATA TYPES
// Comprehensive types for 55+ Bible Characters, 20 Biblical Qualities & Learning
// ============================================================================

export type CharacterTestament = 'Old' | 'New';

export type BiblicalQualityName =
  | 'Faith'
  | 'Courage'
  | 'Wisdom'
  | 'Patience'
  | 'Humility'
  | 'Obedience'
  | 'Forgiveness'
  | 'Love'
  | 'Compassion'
  | 'Integrity'
  | 'Perseverance'
  | 'Leadership'
  | 'Self-control'
  | 'Generosity'
  | 'Loyalty'
  | 'Discernment'
  | 'Responsibility'
  | 'Repentance'
  | 'Kindness'
  | 'Faithfulness';

export interface CharacterLearningQuestion {
  id: string;
  characterId: string;
  type:
    | 'who_was'
    | 'what_did'
    | 'quality_demonstrated'
    | 'mistake_made'
    | 'lesson_learned'
    | 'associated_person'
    | 'event_order'
    | 'scripture_reference';
  prompt: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  scriptureReference: string;
  difficulty: 'Beginner' | 'Easy' | 'Intermediate' | 'Advanced' | 'Expert';
}

export interface BibleCharacterProfile {
  id: string;
  name: string;
  testament: CharacterTestament;
  role: string;
  era: string; // e.g. "Patriarchal Era", "Exodus & Conquest", "United Monarchy", "Exile", "Gospels", "Early Church"
  background: string; // 1. Biblical background
  familyRelationships: string; // 2. Family or important relationships
  majorAccomplishments: string[]; // 3. What they did
  importantEvents: string[]; // 4. Important events in their lives
  positiveQualities: BiblicalQualityName[]; // 5. Their positive qualities
  weaknessesOrMistakes: string[]; // 6. Their weaknesses or mistakes
  growthAndDevelopment: string; // 7. What they learned or how their story developed
  lifeLessons: string[]; // 8. Lessons people can learn from their lives
  keyScriptureReferences: string[]; // 9. Relevant Bible references
  famousQuote?: {
    quote: string;
    reference: string;
  };
  sampleQuestions: CharacterLearningQuestion[]; // 10. Questions testing this character
}

export interface QualityExemplar {
  characterId: string;
  characterName: string;
  scriptureReference: string;
  contextAndDemonstration: string;
}

export interface BiblicalQualityProfile {
  id: string;
  name: BiblicalQualityName;
  definition: string;
  scripturalFoundations: string[];
  primaryExemplars: QualityExemplar[];
  practicalLifeApplication: string;
  reflectionQuestions: string[];
}

export interface CharacterMasteryRecord {
  characterId: string;
  questionsAttempted: number;
  questionsCorrect: number;
  masteryPercentage: number;
  lastStudiedAt: string;
}
