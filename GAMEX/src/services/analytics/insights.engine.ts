export interface Insights {
  earlyGameWeakness: string;
  midGameControl: string;
  lateGameStrength: string;
}

export function getGamePhaseInsights() {
  return {
    earlyGame: 'Early game depends on team preparation and opening strategies',
    midGame: 'Mid game control determines map advantage and economy',
    lateGame: 'Late game requires clutch performance and decision making',
    summary: 'Analyze performance across all game phases for comprehensive strategy',
  };
}

export function generateInsights(matches: any[]): Insights {
  if (matches.length === 0) {
    return {
      earlyGameWeakness: 'No data available',
      midGameControl: 'No data available',
      lateGameStrength: 'No data available',
    };
  }

  const wins = matches.filter((m: any) => m.result === 'win');
  const losses = matches.filter((m: any) => m.result === 'loss');

  const winRate = matches.length > 0 ? (wins.length / matches.length) * 100 : 0;

  let earlyGameWeakness = 'Good early game execution';
  let midGameControl = 'Balanced mid game decisions';
  let lateGameStrength = 'Strong late game clutch ability';

  if (winRate < 40) {
    earlyGameWeakness = 'Struggles in early rounds';
    midGameControl = 'Poor mid game control';
  } else if (winRate < 60) {
    earlyGameWeakness = 'Inconsistent early game';
    midGameControl = 'Average mid game decisions';
  }

  if (losses.length > 0) {
    const closeLosses = losses.filter((m: any) => {
      const [a, b] = m.score.split(' - ');
      return Math.abs(Number(a) - Number(b)) <= 2;
    });
    if (closeLosses.length > 0) {
      lateGameStrength = 'Can close out close games';
    }
  }

  return { earlyGameWeakness, midGameControl, lateGameStrength };
}

