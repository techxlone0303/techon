/**
 * ScoutIQ - Team Data Service
 * 
 * Retrieves team data from GRID Central API
 */

import { centralQuery } from "../grid/central/grid.central.client";
import { executeStatsQuery } from "../grid/stats/grid.stats.client";

export interface TeamData {
  team: {
    id: string;
    name: string;
  };
  stats: {
    gamesPlayed: number;
    wins: number;
    losses: number;
    winRate: number;
  };
}

export interface TeamStatsResponse {
  teamStatistics: {
    game: {
      count: number;
      wins: {
        value: number;
        percentage: number;
      };
    };
  };
}

export async function getTeamData(teamId: string): Promise<TeamData | null> {
  // Get team info
  const teamQuery = `
    query GetTeam($id: ID!) {
      team(id: $id) {
        id
        name
      }
    }
  `;

  // Get team stats
  const statsQuery = `
    query TeamStats($teamId: ID!) {
      teamStatistics(
        teamId: $teamId,
        filter: { timeWindow: LAST_3_MONTHS }
      ) {
        game {
          count
          wins {
            value
            percentage
          }
        }
      }
    }
  `;

  try {
    const [teamRes, statsRes] = await Promise.all([
      centralQuery(teamQuery, { id: teamId }),
      executeStatsQuery<TeamStatsResponse>("TeamStats", statsQuery, { teamId }).catch(() => null),
    ]);

    const team = teamRes?.data?.team;
    if (!team) {
      console.warn(`[TEAM DATA] Team not found: ${teamId}`);
      return null;
    }

    const stats = statsRes?.teamStatistics?.game || { count: 0, wins: { value: 0, percentage: 0 } };
    const wins = stats.wins?.value || 0;
    const gamesPlayed = stats.count || 0;
    const losses = gamesPlayed - wins;
    const winRate = stats.wins?.percentage ?? (gamesPlayed > 0 ? wins / gamesPlayed : 0);

    return {
      team: {
        id: team.id,
        name: team.name,
      },
      stats: {
        gamesPlayed,
        wins,
        losses,
        winRate,
      },
    };
  } catch (error) {
    console.error(`[TEAM DATA] Error fetching data for team ${teamId}:`, error);
    return null;
  }
}

export default {
  getTeamData,
};
