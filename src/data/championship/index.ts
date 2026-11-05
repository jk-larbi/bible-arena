import type { ChampionshipLevel } from '../../types/championship';
import { championshipLevels1to20 } from './levels1to20';
import { championshipLevels21to40 } from './levels21to40';
import { championshipLevels41to60 } from './levels41to60';
import { championshipLevels61to80 } from './levels61to80';
import { championshipLevels81to100 } from './levels81to100';
import { championshipLevels101to120 } from './levels101to120';
import { championshipLevels121to140 } from './levels121to140';
import { championshipLevels141to160 } from './levels141to160';
import { championshipLevels161to180 } from './levels161to180';
import { championshipLevels181to200 } from './levels181to200';

export const allChampionshipLevels: ChampionshipLevel[] = [
  ...championshipLevels1to20,
  ...championshipLevels21to40,
  ...championshipLevels41to60,
  ...championshipLevels61to80,
  ...championshipLevels81to100,
  ...championshipLevels101to120,
  ...championshipLevels121to140,
  ...championshipLevels141to160,
  ...championshipLevels161to180,
  ...championshipLevels181to200
];

export const TOTAL_CHAMPIONSHIP_QUESTIONS = allChampionshipLevels.length * 10; // Exactly 2,000 Questions
export const TOTAL_CHAMPIONSHIP_LEVELS = allChampionshipLevels.length; // 200 Levels

export function getChampionshipLevel(levelNumber: number): ChampionshipLevel | undefined {
  return allChampionshipLevels.find((lvl) => lvl.levelNumber === levelNumber);
}
