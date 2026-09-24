/**
 * GRID Normalizer - Normalizes GRID responses into unified format
 * 
 * Converts Central + Stats responses into:
 * - NormalizedTeam
 * - NormalizedPlayer
 * - NormalizedStats
 * 
 * Does NOT alter original responses, only creates normalized copies
 */

// ============================================================================
// Normalized Types
// ============================================================================

export interface NormalizedBase {
  id: string;
  source: 'central' | 'stats';
  raw: any;
}

export interface NormalizedTeam extends NormalizedBase {
  type: 'team';
  name: string;
  nameShortened?: string;
  logoUrl?: string;
  colorPrimary?: string;
  colorSecondary?: string;
  stats?: TeamStatsSummary;
}

export interface NormalizedPlayer extends NormalizedBase {
  type: 'player';
  nickname: string;
  teamId?: string;
  teamName?: string;
  title?: string;
  stats?: PlayerStatsSummary;
}

export interface TeamStatsSummary {
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  kills?: number;
  deaths?: number;
  assists?: number;
  kda?: number;
}

export interface PlayerStatsSummary {
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  kills?: number;
  deaths?: number;
  assists?: number;
  kda?: number;
}

export type NormalizedEntity = NormalizedTeam | NormalizedPlayer;

// ============================================================================
// Team Normalization
// ============================================================================

/**
 * Normalize a team from central-data response
 */
export function normalizeTeam(data: any, raw: any): NormalizedTeam {
  const team = data?.team || data?.node || data;
  
  return {
    id: team?.id || '',
    type: 'team',
    name: team?.name || '',
    nameShortened: team?.nameShortened,
    logoUrl: team?.logoUrl,
    colorPrimary: team?.colorPrimary,
    colorSecondary: team?.colorSecondary,
    source: 'central',
    raw: raw,
  };
}

/**
 * Normalize multiple teams from central-data response
 */
export function normalizeTeams(data: any, raw: any): NormalizedTeam[] {
  const edges = data?.teams?.edges || data?.edges || [];
  
  return edges.map((edge: any) => {
    const teamData = edge?.node || edge;
    return normalizeTeam(teamData, raw);
  });
}

/**
 * Normalize team statistics from stats-feed response
 */
export function normalizeTeamStats(data: any, raw: any): TeamStatsSummary {
  const stats = data?.teamStatistics || data || {};
  const game = stats?.game || {};
  const series = stats?.series || {};
  
  const gamesPlayed = game?.count || series?.count || 0;
  const wins = game?.wins?.value || 0;
  const losses = gamesPlayed - wins;
  const winRate = game?.wins?.percentage ?? (gamesPlayed > 0 ? wins / gamesPlayed : 0);
  
  return {
    gamesPlayed,
    wins,
    losses,
    winRate,
    kills: series?.kills?.avg,
    deaths: series?.deaths?.avg,
    assists: series?.assists?.avg,
  };
}

/**
 * Normalize team with combined central + stats data
 */
export function normalizeTeamWithStats(
  centralData: any,
  statsData: any,
  raw: any
): NormalizedTeam {
  const team = normalizeTeam(centralData, raw);
  
  if (statsData) {
    team.stats = normalizeTeamStats(statsData, raw);
  }
  
  return team;
}

// ============================================================================
// Player Normalization
// ============================================================================

/**
 * Normalize a player from central-data response
 */
export function normalizePlayer(data: any, raw: any): NormalizedPlayer {
  const player = data?.player || data?.node || data;
  
  return {
    id: player?.id || '',
    type: 'player',
    nickname: player?.nickname || '',
    teamId: player?.team?.id || player?.teamId,
    teamName: player?.team?.baseInfo?.name || player?.team?.name,
    title: player?.title?.name,
    source: 'central',
    raw: raw,
  };
}

/**
 * Normalize multiple players from central-data response
 */
export function normalizePlayers(data: any, raw: any): NormalizedPlayer[] {
  const edges = data?.players?.edges || data?.edges || [];
  
  return edges.map((edge: any) => {
    const playerData = edge?.node || edge;
    return normalizePlayer(playerData, raw);
  });
}

/**
 * Normalize player statistics from stats-feed response
 */
export function normalizePlayerStats(data: any, raw: any): PlayerStatsSummary {
  const stats = data?.playerStatistics || data || {};
  const game = stats?.game || {};
  const series = stats?.series || {};
  
  const gamesPlayed = game?.count || series?.count || 0;
  const wins = game?.wins?.value || 0;
  const losses = gamesPlayed - wins;
  const winRate = game?.wins?.percentage ?? (gamesPlayed > 0 ? wins / gamesPlayed : 0);
  
  const kills = series?.kills?.avg || 0;
  const deaths = series?.deaths?.avg || 0;
  const assists = series?.assists?.avg || 0;
  const kda = deaths > 0 ? (kills + assists) / deaths : (kills + assists);
  
  return {
    gamesPlayed,
    wins,
    losses,
    winRate,
    kills,
    deaths,
    assists,
    kda: Math.round(kda * 100) / 100,
  };
}

/**
 * Normalize player with combined central + stats data
 */
export function normalizePlayerWithStats(
  centralData: any,
  statsData: any,
  raw: any
): NormalizedPlayer {
  const player = normalizePlayer(centralData, raw);
  
  if (statsData) {
    player.stats = normalizePlayerStats(statsData, raw);
  }
  
  return player;
}

// ============================================================================
// Generic Normalization
// ============================================================================

/**
 * Normalize any GRID response based on its structure
 */
export function normalizeResponse(data: any, raw: any): NormalizedEntity | NormalizedEntity[] | null {
  if (!data) return null;
  
  // Check if it's a team
  if (data.team && (data.team.id || data.team.name)) {
    return normalizeTeam(data.team, raw);
  }
  
  // Check if it's a player
  if (data.player && (data.player.id || data.player.nickname)) {
    return normalizePlayer(data.player, raw);
  }
  
  // Check if it's a teams list
  if (data.teams?.edges) {
    return normalizeTeams(data, raw);
  }
  
  // Check if it's a players list
  if (data.players?.edges) {
    return normalizePlayers(data, raw);
  }
  
  // Return raw if unknown structure
  console.log("[GRID ROUTER] Unknown response structure, returning raw data");
  return null;
}

/**
 * Create a unified team profile combining all available data
 */
export function createTeamProfile(team: NormalizedTeam): TeamProfile {
  return {
    id: team.id,
    name: team.name,
    nameShortened: team.nameShortened,
    logoUrl: team.logoUrl,
    colors: {
      primary: team.colorPrimary,
      secondary: team.colorSecondary,
    },
    stats: team.stats || undefined,
    source: team.source,
  };
}

export interface TeamProfile {
  id: string;
  name: string;
  nameShortened?: string;
  logoUrl?: string;
  colors?: {
    primary?: string;
    secondary?: string;
  };
  stats?: TeamStatsSummary;
  source: 'central' | 'stats';
}

export default {
  normalizeTeam,
  normalizeTeams,
  normalizeTeamStats,
  normalizeTeamWithStats,
  normalizePlayer,
  normalizePlayers,
  normalizePlayerStats,
  normalizePlayerWithStats,
  normalizeResponse,
  createTeamProfile,
};

