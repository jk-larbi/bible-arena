// ============================================================================
// BIBLEARENA GAME MODE PROGRESSION LEVELS GENERATOR
// Provides 10 authentic, specialized questions for all 18 Game Modes x 200 Levels
// ============================================================================

import type { GameModeId, GameRoundData, GameDifficulty } from '../types/gameModes';
import type { GameModeLevelData } from '../types/gameModeProgression';
import { getStageForLevel, ALL_CHAMPIONSHIP_STAGES } from '../services/championshipService';
import { getChampionshipLevel } from './championship';

// Import specialized data banks
import { SCRAMBLE_VERSES_BANK } from './gameModes/scrambleVerses';
import { EMOJI_PUZZLES_BANK } from './gameModes/emojiPuzzles';
import { ANAGRAMS_CROSSWORDS_BANK } from './gameModes/anagramsAndCrosswords';
import { CHARACTERS_QUOTES_BANK } from './gameModes/characterAndQuotes';
import { CHRONOLOGICAL_SEQUENCES_BANK, CHARACTER_MATCH_BANK } from './gameModes/sequencesAndMatches';
import { TRUE_FALSE_BANK, FINISH_STORY_BANK, BIBLE_CONNECTIONS_BANK } from './gameModes/theologyAndPlaces';

export function getGameModeLevelData(
  modeId: GameModeId,
  levelNumber: number
): GameModeLevelData {
  const stage = getStageForLevel(levelNumber);
  const stageMeta = ALL_CHAMPIONSHIP_STAGES.find((s) => s.id === stage) || ALL_CHAMPIONSHIP_STAGES[0];
  const difficulty: GameDifficulty =
    stageMeta.stageNumber <= 2
      ? 'Beginner'
      : stageMeta.stageNumber <= 4
      ? 'Intermediate'
      : stageMeta.stageNumber <= 7
      ? 'Advanced'
      : stageMeta.stageNumber <= 9
      ? 'Expert'
      : 'Master';

  // 1. Bible Trivia: Leverage the 2,000 authentic championship questions directly
  if (modeId === 'trivia') {
    const champLevel = getChampionshipLevel(levelNumber);
    if (champLevel && champLevel.questions && champLevel.questions.length === 10) {
      const qList: GameRoundData[] = champLevel.questions.map((q, idx) => ({
        id: `trivia-lvl${levelNumber}-q${idx + 1}`,
        gameMode: 'trivia',
        difficulty,
        prompt: q.text,
        options: q.options,
        correctOptionIndex: q.correctAnswerIndex,
        scriptureReference: q.scriptureReference,
        explanation: q.explanation,
        timeLimitSeconds: 20,
      }));

      return {
        levelNumber,
        gameModeId: 'trivia',
        stage,
        title: `${stage} Level ${levelNumber}`,
        theme: stageMeta.theme,
        questions: qList,
      };
    }
  }

  // 2. Synthesize 10 diverse questions tailored for the specific game mechanic
  const questions: GameRoundData[] = [];

  for (let qIdx = 0; qIdx < 10; qIdx++) {
    const qId = `${modeId}-l${levelNumber}-q${qIdx + 1}`;
    const vIndex = ((levelNumber - 1) * 3 + qIdx) % SCRAMBLE_VERSES_BANK.length;
    const emIndex = ((levelNumber - 1) * 3 + qIdx) % EMOJI_PUZZLES_BANK.length;
    const anIndex = ((levelNumber - 1) * 3 + qIdx) % ANAGRAMS_CROSSWORDS_BANK.length;
    const chIndex = ((levelNumber - 1) * 3 + qIdx) % CHARACTERS_QUOTES_BANK.length;
    const seqIndex = ((levelNumber - 1) * 2 + qIdx) % CHRONOLOGICAL_SEQUENCES_BANK.length;
    const matIndex = ((levelNumber - 1) * 2 + qIdx) % CHARACTER_MATCH_BANK.length;
    const tfIndex = ((levelNumber - 1) * 3 + qIdx) % TRUE_FALSE_BANK.length;
    const finIndex = ((levelNumber - 1) * 2 + qIdx) % FINISH_STORY_BANK.length;
    const connIndex = (levelNumber - 1 + qIdx) % BIBLE_CONNECTIONS_BANK.length;

    const verseItem = SCRAMBLE_VERSES_BANK[vIndex];
    const emojiItem = EMOJI_PUZZLES_BANK[emIndex];
    const anItem = ANAGRAMS_CROSSWORDS_BANK[anIndex];
    const charItem = CHARACTERS_QUOTES_BANK[chIndex];
    const seqItem = CHRONOLOGICAL_SEQUENCES_BANK[seqIndex];
    const matItem = CHARACTER_MATCH_BANK[matIndex];
    const tfItem = TRUE_FALSE_BANK[tfIndex];
    const finItem = FINISH_STORY_BANK[finIndex];
    const connItem = BIBLE_CONNECTIONS_BANK[connIndex];

    switch (modeId) {
      // MECHANIC: Complete the Scripture
      case 'complete-scripture': {
        const opts = [verseItem.missingAnswer, ...verseItem.distractors].sort();
        questions.push({
          id: qId,
          gameMode: 'complete-scripture',
          difficulty,
          prompt: `Complete the canonical Scripture: "${verseItem.missingPart}"`,
          options: opts,
          correctOptionIndex: opts.indexOf(verseItem.missingAnswer),
          scriptureReference: verseItem.reference,
          explanation: verseItem.explanation,
          timeLimitSeconds: 25,
        });
        break;
      }

      // MECHANIC: Scripture Scramble
      case 'scripture-scramble': {
        const scrambled = [...verseItem.words].sort(() => 0.5 - ((vIndex + qIdx) % 3 ? 0.3 : 0.7));
        questions.push({
          id: qId,
          gameMode: 'scripture-scramble',
          difficulty,
          prompt: `Reassemble this foundational verse from ${verseItem.book}:`,
          scrambledWords: scrambled,
          correctSentence: verseItem.words.join(' '),
          scriptureReference: verseItem.reference,
          explanation: verseItem.explanation,
          timeLimitSeconds: 45,
        });
        break;
      }

      // MECHANIC: Emoji Bible Challenge
      case 'emoji-challenge': {
        const opts = [emojiItem.answer, ...emojiItem.distractors].sort();
        questions.push({
          id: qId,
          gameMode: 'emoji-challenge',
          difficulty,
          prompt: `Decipher this biblical miracle or historical narrative: ${emojiItem.emoji}`,
          options: opts,
          correctOptionIndex: opts.indexOf(emojiItem.answer),
          scriptureReference: emojiItem.scriptureReference,
          explanation: emojiItem.explanation,
          timeLimitSeconds: 20,
        });
        break;
      }

      // MECHANIC: Who Said It?
      case 'who-said-it': {
        const opts = [charItem.quoteSpeaker, ...charItem.distractors].sort();
        questions.push({
          id: qId,
          gameMode: 'who-said-it',
          difficulty,
          prompt: `Who declared these words in Scripture: ${charItem.quote}?`,
          options: opts,
          correctOptionIndex: opts.indexOf(charItem.quoteSpeaker),
          scriptureReference: charItem.quoteReference,
          explanation: `${charItem.quoteSpeaker} spoke this: ${charItem.role}.`,
          timeLimitSeconds: 20,
        });
        break;
      }

      // MECHANIC: Where in the Bible?
      case 'where-in-bible': {
        const canonicalBooks = [charItem.whereBook, 'Leviticus', 'Acts', 'Proverbs', 'Romans', 'Genesis', '1 Kings'].filter(
          (b, idx, self) => self.indexOf(b) === idx
        );
        const distractors = canonicalBooks.filter((b) => b !== charItem.whereBook).slice(0, 3);
        const opts = [charItem.whereBook, ...distractors].sort();
        questions.push({
          id: qId,
          gameMode: 'where-in-bible',
          difficulty,
          prompt: `In which book of the Bible does this historical event occur: "${charItem.whereEvent}"?`,
          options: opts,
          correctOptionIndex: opts.indexOf(charItem.whereBook),
          scriptureReference: charItem.quoteReference,
          explanation: `The event "${charItem.whereEvent}" is recorded in ${charItem.whereBook}.`,
          timeLimitSeconds: 20,
        });
        break;
      }

      // MECHANIC: True or False
      case 'true-false': {
        questions.push({
          id: qId,
          gameMode: 'true-false',
          difficulty,
          prompt: tfItem.prompt,
          options: ['True', 'False'],
          correctOptionIndex: tfItem.isTrue ? 0 : 1,
          isTrue: tfItem.isTrue,
          scriptureReference: tfItem.reference,
          explanation: tfItem.explanation,
          timeLimitSeconds: 15,
        });
        break;
      }

      // MECHANIC: Sequence Challenge
      case 'sequence-challenge': {
        questions.push({
          id: qId,
          gameMode: 'sequence-challenge',
          difficulty,
          prompt: seqItem.prompt,
          sequenceItems: seqItem.items,
          scriptureReference: seqItem.reference,
          explanation: seqItem.explanation,
          timeLimitSeconds: 35,
        });
        break;
      }

      // MECHANIC: Character Match
      case 'character-match': {
        questions.push({
          id: qId,
          gameMode: 'character-match',
          difficulty,
          prompt: `Match each biblical figure to their calling or deed (${matItem.title}):`,
          matchPairs: matItem.pairs,
          scriptureReference: matItem.reference,
          explanation: matItem.explanation,
          timeLimitSeconds: 40,
        });
        break;
      }

      // MECHANIC: Who Am I?
      case 'who-am-i': {
        const clueIndex = qIdx % 3;
        const opts = [charItem.name, ...charItem.distractors].sort();
        questions.push({
          id: qId,
          gameMode: 'who-am-i',
          difficulty,
          prompt: `Deduce the mystery character from this clue: "${charItem.clues[clueIndex]}"`,
          mysteryClues: charItem.clues,
          mysteryCharacter: charItem.name,
          options: opts,
          correctOptionIndex: opts.indexOf(charItem.name),
          scriptureReference: charItem.quoteReference,
          explanation: `The mystery figure is ${charItem.name}: ${charItem.role}.`,
          timeLimitSeconds: 25,
        });
        break;
      }

      // MECHANIC: Bible Anagram
      case 'bible-anagram': {
        const opts = [anItem.word, ...anItem.distractors].sort();
        questions.push({
          id: qId,
          gameMode: 'bible-anagram',
          difficulty,
          prompt: `Unscramble these letters [ ${anItem.letters.join(' ')} ]: "${anItem.clue}"`,
          anagramLetters: anItem.letters,
          solvedWord: anItem.word,
          options: opts,
          correctOptionIndex: opts.indexOf(anItem.word),
          scriptureReference: anItem.scriptureReference,
          explanation: `${anItem.word} (${anItem.category}): ${anItem.explanation}`,
          timeLimitSeconds: 30,
        });
        break;
      }

      // MECHANIC: Bible Word Cross
      case 'word-cross': {
        const opts = [anItem.word, ...anItem.distractors].sort();
        questions.push({
          id: qId,
          gameMode: 'word-cross',
          difficulty,
          prompt: `Crossword Clue (${anItem.word.length} Letters): "${anItem.clue}"`,
          solvedWord: anItem.word,
          options: opts,
          correctOptionIndex: opts.indexOf(anItem.word),
          scriptureReference: anItem.scriptureReference,
          explanation: `${anItem.word} solves the clue: ${anItem.explanation}`,
          timeLimitSeconds: 35,
        });
        break;
      }

      // MECHANIC: Bible Word Search
      case 'word-search': {
        const opts = [anItem.word, ...anItem.distractors].sort();
        questions.push({
          id: qId,
          gameMode: 'word-search',
          difficulty,
          prompt: `Identify the target Scripture keyword for: "${anItem.clue}"`,
          targetWords: [anItem.word],
          options: opts,
          correctOptionIndex: opts.indexOf(anItem.word),
          scriptureReference: anItem.scriptureReference,
          explanation: `Target word was ${anItem.word}. ${anItem.explanation}`,
          timeLimitSeconds: 30,
        });
        break;
      }

      // MECHANIC: Finish the Story
      case 'finish-story': {
        questions.push({
          id: qId,
          gameMode: 'finish-story',
          difficulty,
          prompt: finItem.prompt,
          options: finItem.climaxChoices,
          correctOptionIndex: finItem.correctChoiceIndex,
          scriptureReference: finItem.reference,
          explanation: finItem.explanation,
          timeLimitSeconds: 30,
        });
        break;
      }

      // MECHANIC: Identify Bible Place
      case 'identify-place': {
        const altPlaces = ['Mount Sinai', 'Jerusalem', 'Capernaum', 'Babylon', 'Jordan River', 'Hebron', 'Bethlehem'].filter(
          (p) => p !== charItem.placeName
        );
        const opts = [charItem.placeName, altPlaces[0], altPlaces[1], altPlaces[2]].sort();
        questions.push({
          id: qId,
          gameMode: 'identify-place',
          difficulty,
          prompt: `Identify this biblical location: "${charItem.placeClues}"`,
          options: opts,
          correctOptionIndex: opts.indexOf(charItem.placeName),
          scriptureReference: charItem.quoteReference,
          explanation: `${charItem.placeName}: ${charItem.explanation}`,
          timeLimitSeconds: 20,
        });
        break;
      }

      // MECHANIC: Memory Challenge
      case 'memory-challenge': {
        const opts = [verseItem.missingAnswer, ...verseItem.distractors].sort();
        questions.push({
          id: qId,
          gameMode: 'memory-challenge',
          difficulty,
          prompt: `Memorize this passage from ${verseItem.reference}: "${verseItem.verse}". Which key word completes: "${verseItem.missingPart}"?`,
          options: opts,
          correctOptionIndex: opts.indexOf(verseItem.missingAnswer),
          scriptureReference: verseItem.reference,
          explanation: `Verse recalled: "${verseItem.verse}". ${verseItem.explanation}`,
          timeLimitSeconds: 25,
        });
        break;
      }

      // MECHANIC: Bible Categories
      case 'bible-categories': {
        const catGroup = connItem.groups[qIdx % connItem.groups.length];
        const correctItem = catGroup.items[0];
        const otherItems = connItem.groups
          .filter((g) => g.category !== catGroup.category)
          .map((g) => g.items[0])
          .slice(0, 3);
        const opts = [correctItem, ...otherItems].sort();
        questions.push({
          id: qId,
          gameMode: 'bible-categories',
          difficulty,
          prompt: `Which of these belongs to the category: "${catGroup.category}"?`,
          options: opts,
          correctOptionIndex: opts.indexOf(correctItem),
          scriptureReference: 'Canonical Classification',
          explanation: `${correctItem} belongs to the category "${catGroup.category}" (alongside ${catGroup.items.slice(1).join(', ')}).`,
          timeLimitSeconds: 25,
        });
        break;
      }

      // MECHANIC: Bible Connections
      case 'bible-connections': {
        const catGroup = connItem.groups[qIdx % connItem.groups.length];
        const opts = [
          catGroup.category,
          'Minor Prophets of Judah',
          'Cities of the Decapolis',
          'Weapons of King Saul',
        ].sort();
        questions.push({
          id: qId,
          gameMode: 'bible-connections',
          difficulty,
          prompt: `What common biblical thread unites these four items: [ ${catGroup.items.join(', ')} ]?`,
          options: opts,
          correctOptionIndex: opts.indexOf(catGroup.category),
          scriptureReference: 'Thematic Scripture Harmony',
          explanation: `The common biblical link is "${catGroup.category}".`,
          timeLimitSeconds: 30,
        });
        break;
      }

      // DEFAULT
      default: {
        const opts = [charItem.name, ...charItem.distractors].sort();
        questions.push({
          id: qId,
          gameMode: modeId,
          difficulty,
          prompt: `Who is associated with: "${charItem.role}"?`,
          options: opts,
          correctOptionIndex: opts.indexOf(charItem.name),
          scriptureReference: charItem.quoteReference,
          explanation: `${charItem.name} played a prominent role in Scripture: ${charItem.role}`,
          timeLimitSeconds: 20,
        });
        break;
      }
    }
  }

  return {
    levelNumber,
    gameModeId: modeId,
    stage,
    title: `${stage} Level ${levelNumber}`,
    theme: stageMeta.theme,
    questions,
  };
}
