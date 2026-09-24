import { PlayerStatistics } from '../grid/playerStats.service';

export type PlayerRole = 'AGGRESSOR' | 'SUPPORT' | 'STRATEGIST' | 'CARRY' | 'ANCHOR' | 'LURKER' | 'INITIATOR';

export interface RolePrediction {
  role: PlayerRole;
  confidence: number;
  scores: Record<PlayerRole, number>;
}

const ROLE_THRESHOLDS = {
  AGGRESSOR: { killsMin: 0.7, aggressionMin: 0.6, kdaMin: 0.5 },
  SUPPORT: { assistsMin: 0.6, deathsMax: 0.5, impactMin: 0.4 },
  STRATEGIST: { winRateMin: 0.55, clutchMin: 0.5, consistencyMin: 0.6 },
  CARRY: { kdaMin: 0.7, killsMin: 0.6, winRateMin: 0.5 },
  ANCHOR: { deathsMax: 0.4, consistencyMin: 0.6, winRateMin: 0.5 },
  LURKER: { killsMin: 0.4, aggressionMin: 0.3, impactMin: 0.5 },
  INITIATOR: { assistsMin: 0.5, firstBloodMin: 0.4, impactMin: 0.5 },
};

function normalizeStat(value: number, min: number, max: number): number {
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

function computeRoleScores(stats: PlayerStatistics): Record<PlayerRole, number> {
  const killsNorm = normalizeStat(stats.killsPerGame, 0, 25);
  const deathsNorm = 1 - normalizeStat(stats.deathsPerGame, 0, 20);
  const assistsNorm = normalizeStat(stats.assistsPerGame, 0, 15);
  const kdaNorm = normalizeStat(stats.kdaRatio, 0, 3);
  const winRateNorm = stats.winRate;
  const clutchNorm = stats.clutchesWon && (stats.clutchesWon + (stats.clutchesLost || 0)) > 0
    ? stats.clutchesWon / (stats.clutchesWon + (stats.clutchesLost || 0))
    : 0.5;
  const consistencyNorm = kdaNorm * 0.5 + winRateNorm * 0.5;
  const aggressionNorm = killsNorm * 0.6 + kdaNorm * 0.3 + deathsNorm * 0.1;
  const impactNorm = normalizeStat(
    (stats.kdaRatio * 0.3 + winRateNorm * 0.4 + (stats.headshotPercentage || 0) * 2 + (stats.firstBloodContribution || 0) * 5),
    0,
    2
  );
  const firstBloodNorm = (stats.firstBloodContribution || 0) * 5;

  const scores: Record<PlayerRole, number> = {
    AGGRESSOR: killsNorm * 0.4 + aggressionNorm * 0.3 + kdaNorm * 0.2 + winRateNorm * 0.1,
    SUPPORT: assistsNorm * 0.4 + deathsNorm * 0.2 + impactNorm * 0.2 + winRateNorm * 0.2,
    STRATEGIST: winRateNorm * 0.3 + clutchNorm * 0.25 + consistencyNorm * 0.25 + impactNorm * 0.2,
    CARRY: kdaNorm * 0.3 + killsNorm * 0.3 + winRateNorm * 0.25 + impactNorm * 0.15,
    ANCHOR: deathsNorm * 0.3 + consistencyNorm * 0.3 + winRateNorm * 0.25 + impactNorm * 0.15,
    LURKER: killsNorm * 0.25 + aggressionNorm * 0.25 + impactNorm * 0.3 + winRateNorm * 0.2,
    INITIATOR: assistsNorm * 0.3 + firstBloodNorm * 0.25 + impactNorm * 0.25 + winRateNorm * 0.2,
  };

  return scores;
}

export function detectRole(stats: PlayerStatistics | null): RolePrediction {
  if (!stats || stats.gamesPlayed === 0) {
    return {
      role: 'STRATEGIST',
      confidence: 0.3,
      scores: {
        AGGRESSOR: 0.14,
        SUPPORT: 0.14,
        STRATEGIST: 0.14,
        CARRY: 0.14,
        ANCHOR: 0.14,
        LURKER: 0.14,
        INITIATOR: 0.14,
      },
    };
  }

  const scores = computeRoleScores(stats);

  let bestRole: PlayerRole = 'STRATEGIST';
  let maxScore = 0;
  let secondMaxScore = 0;

  for (const [role, score] of Object.entries(scores) as [PlayerRole, number][]) {
    if (score > maxScore) {
      secondMaxScore = maxScore;
      maxScore = score;
      bestRole = role;
    } else if (score > secondMaxScore) {
      secondMaxScore = score;
    }
  }

  const confidence = maxScore > 0 ? Math.min(0.95, maxScore) : 0.5;

  return {
    role: bestRole,
    confidence: Math.round(confidence * 1000) / 1000,
    scores,
  };
}

export function getRoleDescription(role: PlayerRole): string {
  const descriptions: Record<PlayerRole, string> = {
    AGGRESSOR: 'High-impact fragger who creates space through aggressive plays and entry fragging.',
    SUPPORT: 'Team-oriented player who enables teammates through utility and setup plays.',
    STRATEGIST: 'Game-sense focused player who excels at mid-round decisions and setups.',
    CARRY: 'Star player who accumulates kills and carries the team through individual brilliance.',
    ANCHOR: 'Defensive specialist who holds sites and provides stability for the team.',
    LURKER: 'Unpredictable player who creates map pressure and catches opponents off-guard.',
    INITIATOR: 'Utility-focused player who sets up plays for teammates with flashes and smokes.',
  };
  return descriptions[role];
}

export function getRoleRecommendations(role: PlayerRole): string[] {
  const recommendations: Record<PlayerRole, string[]> = {
    AGGRESSOR: [
      'Continue aggressive entry and space creation',
      'Work on trade efficiency with teammates',
      'Maintain high utility usage on attack',
    ],
    SUPPORT: [
      'Focus on teammate utility setup',
      'Improve trade mechanics after supporting',
      'Study opponent utility patterns',
    ],
    STRATEGIST: [
      'Continue smart mid-round rotations',
      'Work on clutch conversions',
      'Analyze opponent tendencies',
    ],
    CARRY: [
      'Maintain high fragging output',
      'Focus on closing out rounds',
      'Improve in 1vX situations',
    ],
    ANCHOR: [
      'Continue holding site discipline',
      'Work on retake coordination',
      'Improve post-plant decision making',
    ],
    LURKER: [
      'Continue creating map pressure',
      'Work on timing and information gathering',
      'Improve escape routes',
    ],
    INITIATOR: [
      'Continue utility setup for teammates',
      'Work on flash/Smol timing',
      'Improve entry after utility',
    ],
  };
  return recommendations[role];
}

