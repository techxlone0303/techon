import axios from 'axios';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

export interface ScoutingReportInput {
  playerId: string;
  playerName?: string;
  stats: {
    gamesPlayed: number;
    wins: number;
    losses: number;
    winRate: number;
    killsPerGame: number;
    deathsPerGame: number;
    assistsPerGame: number;
    kdaRatio: number;
    headshotPercentage?: number;
    clutchRate?: number;
  };
  role: {
    role: string;
    confidence: number;
  };
  eloRating: {
    rating: number;
    rank: number;
    peakRating: number;
  };
  cluster: {
    clusterId: number;
    clusterName: string;
    description: string;
    confidence: number;
  };
  synergy?: {
    topTeammates: Array<{ playerId: string; synergyScore: number }>;
    centrality: number;
  };
}

export interface ScoutingReportOutput {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  tacticalValue: string;
  futurePotential: string;
  recommendedRole?: string;
  developmentAreas: string[];
  generatedAt: string;
}

export async function generateScoutingReport(input: ScoutingReportInput): Promise<ScoutingReportOutput> {
  const prompt = buildScoutingPrompt(input);

  try {
    const response = await axios.post(
      `${OLLAMA_BASE_URL}/api/generate`,
      {
        model: 'mistral',
        prompt,
        stream: false,
      },
      { timeout: 120000 }
    );

    const responseText: string = response.data?.response || '';

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    let reportData: any;

    if (jsonMatch) {
      try {
        reportData = JSON.parse(jsonMatch[0]);
      } catch {
        reportData = parseNaturalLanguageReport(responseText);
      }
    } else {
      reportData = parseNaturalLanguageReport(responseText);
    }

    return formatReport(reportData, input);
  } catch (error) {
    console.error('Error generating scouting report:', error);
    return generateFallbackReport(input);
  }
}

function buildScoutingPrompt(input: ScoutingReportInput): string {
  const statsText = `
Player Statistics:
- Games Played: ${input.stats.gamesPlayed}
- Record: ${input.stats.wins}W - ${input.stats.losses}L
- Win Rate: ${(input.stats.winRate * 100).toFixed(1)}%
- K/D/A: ${input.stats.killsPerGame.toFixed(1)} / ${input.stats.deathsPerGame.toFixed(1)} / ${input.stats.assistsPerGame.toFixed(1)}
- KDA Ratio: ${input.stats.kdaRatio.toFixed(2)}
${input.stats.headshotPercentage ? `- Headshot %: ${(input.stats.headshotPercentage * 100).toFixed(1)}%` : ''}
${input.stats.clutchRate ? `- Clutch Rate: ${(input.stats.clutchRate * 100).toFixed(1)}%` : ''}
`.trim();

  const roleText = `
AI-Detected Role: ${input.role.role}
Role Confidence: ${(input.role.confidence * 100).toFixed(0)}%
`.trim();

  const eloText = `
Elo Rating: ${input.eloRating.rating}
Rank: #${input.eloRating.rank}
Peak Rating: ${input.eloRating.peakRating}
`.trim();

  const clusterText = `
Playstyle Cluster: ${input.cluster.clusterName}
Cluster Description: ${input.cluster.description}
Cluster Confidence: ${(input.cluster.confidence * 100).toFixed(0)}%
`.trim();

  const synergyText = input.synergy ? `
Synergy Analysis:
- Network Centrality: ${(input.synergy.centrality * 100).toFixed(1)}%
- Top Teammates: ${input.synergy.topTeammates.slice(0, 3).map(t => t.playerId).join(', ') || 'None'}
`.trim() : '';

  return `You are a professional esports analyst and scout. Generate a detailed scouting report for the following player.

${statsText}

${roleText}

${eloText}

${clusterText}

${synergyText}

Generate a JSON scouting report with the following structure:

{
  "summary": "2-3 sentence overview of the player",
  "strengths": ["3-5 key strengths"],
  "weaknesses": ["3-4 areas for improvement"],
  "tacticalValue": "How this player fits into a team composition",
  "futurePotential": "Projection of player's ceiling and development trajectory",
  "recommendedRole": "Optional role adjustment recommendation",
  "developmentAreas": ["2-3 specific areas to focus on"]
}

Focus on actionable intelligence. Consider statistical indicators, role-specific expectations, and team synergy implications.

JSON Output:`;
}

function parseNaturalLanguageReport(text: string): any {
  const lines = text.split('\n').filter(l => l.trim());
  const result: any = {
    summary: '',
    strengths: [],
    weaknesses: [],
    tacticalValue: '',
    futurePotential: '',
    developmentAreas: [],
  };

  let currentSection = '';
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes('summary') || lower.includes('overview')) {
      currentSection = 'summary';
    } else if (lower.includes('strength')) {
      currentSection = 'strengths';
    } else if (lower.includes('weakness') || lower.includes('area for improvement')) {
      currentSection = 'weaknesses';
    } else if (lower.includes('tactical') || lower.includes('value')) {
      currentSection = 'tacticalValue';
    } else if (lower.includes('future') || lower.includes('potential')) {
      currentSection = 'futurePotential';
    } else if (lower.includes('development') || lower.includes('focus')) {
      currentSection = 'developmentAreas';
    } else if (line.startsWith('-') || line.startsWith('*')) {
      const content = line.replace(/^[-*]\s*/, '').trim();
      if (currentSection && Array.isArray(result[currentSection])) {
        result[currentSection].push(content);
      } else if (currentSection === 'summary') {
        result.summary += (result.summary ? ' ' : '') + content;
      } else if (currentSection === 'tacticalValue') {
        result.tacticalValue += (result.tacticalValue ? ' ' : '') + content;
      } else if (currentSection === 'futurePotential') {
        result.futurePotential += (result.futurePotential ? ' ' : '') + content;
      }
    }
  }

  return result;
}

function formatReport(data: any, input: ScoutingReportInput): ScoutingReportOutput {
  return {
    summary: data.summary || `${input.playerName || input.playerId} is a ${input.role.role.toLowerCase()} with a ${(input.stats.winRate * 100).toFixed(0)}% win rate and ${input.stats.kdaRatio.toFixed(2)} KDA.`,
    strengths: data.strengths || [
      `Strong ${input.role.role.toLowerCase()} performance`,
      `Consistent ${input.stats.winRate > 0.5 ? 'winning' : 'competitive'} record`,
      `KDA of ${input.stats.kdaRatio.toFixed(2)} indicates impact`,
    ],
    weaknesses: data.weaknesses || [
      'Room for improvement in clutch situations',
      'Could increase consistency across matches',
    ],
    tacticalValue: data.tacticalValue || `Fits well as a ${input.role.role.toLowerCase()} with ${input.cluster.clusterName.toLowerCase()} playstyle.`,
    futurePotential: data.futurePotential || `With current trajectory, expected to maintain or improve ratings.`,
    recommendedRole: data.recommendedRole,
    developmentAreas: data.developmentAreas || [
      'Improve clutch conversion rate',
      'Increase map awareness',
    ],
    generatedAt: new Date().toISOString(),
  };
}

function generateFallbackReport(input: ScoutingReportInput): ScoutingReportOutput {
  return {
    summary: `${input.playerName || input.playerId} is a ${input.role.role.toLowerCase()} player with ${input.stats.gamesPlayed} games played and a ${(input.stats.winRate * 100).toFixed(1)}% win rate.`,
    strengths: [
      `AI-detected ${input.role.role} role with ${(input.role.confidence * 100).toFixed(0)}% confidence`,
      `${input.stats.kdaRatio.toFixed(2)} KDA ratio across ${input.stats.gamesPlayed} games`,
      `Elo rating of ${input.eloRating.rating} (Rank #${input.eloRating.rank})`,
    ],
    weaknesses: [
      'Limited historical data available',
      'Performance consistency could improve',
    ],
    tacticalValue: `Best utilized as ${input.role.role.toLowerCase()} in structured team compositions.`,
    futurePotential: `Player has ${input.cluster.clusterName.toLowerCase()} characteristics with room for growth.`,
    developmentAreas: [
      'Continue accumulating match experience',
      'Focus on role-specific skill development',
    ],
    generatedAt: new Date().toISOString(),
  };
}

