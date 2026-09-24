export function buildScoutingPrompt(matches: any[], insights: any): string {
  return `
You are an Esports analyst. Analyze the following team data and output a JSON scouting report.

## Recent Matches
${matches.map((m: any) => 
  `${m.date}: vs ${m.opponent} - ${m.score} (${m.result})`
).join('\n')}

## Insights
- Early Game: ${insights.earlyGameWeakness}
- Mid Game: ${insights.midGameControl}
- Late Game: ${insights.lateGameStrength}

## Output Format (JSON)
{
  "teamName": "Team name from data",
  "overallRating": 1-100,
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "keyPlayers": [
    { "name": "Player", "role": "Role", "rating": 1-100 }
  ],
  "strategicAnalysis": "2-3 sentences",
  "recommendedApproach": "How to counter this team"
}

JSON Output:
`;
}

