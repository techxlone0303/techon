export interface TeamProfile {
  id: string;
  name: string;
  region?: string;
  gameTitle: string;
  createdAt: string;
  updatedAt: string;
}

export interface SeriesProfile {
  id: string;
  teams: string[];
  startTime: string;
  tournament: string;
  title?: string;
  status?: string;
}

export interface StatsProfile {
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  avgKillsPerSeries: number;
  seriesCount: number;
  seriesWinRate: number;
  timeWindow?: string;
}

export interface RawGridTeam {
  id: string;
  baseInfo?: { name: string; region?: string };
  gameTitle?: string;
}

export interface RawGridSeries {
  id: string;
  startTimeScheduled?: string;
  title?: { nameShortened?: string };
  tournament?: { nameShortened?: string };
  teams?: Array<{ baseInfo?: { name?: string } }>;
}

export interface RawGridStats {
  gamesPlayed?: number;
  wins?: number;
  losses?: number;
  winRate?: number | null;
  seriesKillAverage?: number | null;
}

export function normalizeTeam(raw: RawGridTeam): TeamProfile {
  return {
    id: raw.id,
    name: raw.baseInfo?.name || 'Unknown',
    region: raw.baseInfo?.region,
    gameTitle: raw.gameTitle || 'Unknown',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function normalizeSeries(raw: RawGridSeries): SeriesProfile {
  return {
    id: raw.id,
    teams: raw.teams?.map(t => t.baseInfo?.name).filter(Boolean) as string[] || [],
    startTime: raw.startTimeScheduled || '',
    tournament: raw.tournament?.nameShortened || 'Unknown',
    title: raw.title?.nameShortened,
  };
}

export function normalizeStats(raw: RawGridStats, timeWindow?: string): StatsProfile {
  return {
    gamesPlayed: raw.gamesPlayed || 0,
    wins: raw.wins || 0,
    losses: raw.losses || 0,
    winRate: typeof raw.winRate === 'number' ? raw.winRate : 0,
    avgKillsPerSeries: typeof raw.seriesKillAverage === 'number' ? raw.seriesKillAverage : 0,
    seriesCount: 0,
    seriesWinRate: 0,
    timeWindow,
  };
}

