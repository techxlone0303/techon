import axios, { AxiosError } from 'axios';

const GRID_API_URL = 'https://api-op.grid.gg/central-data/graphql';
const GRID_STATS_URL = 'https://api-op.grid.gg/statistics-feed/graphql';

export interface GridVariables {
  [key: string]: any;
}

export interface GridResponse<T = any> {
  data?: T;
  errors?: Array<{ message: string; locations?: Array<{ line: number; column: number }> }>;
}

export interface StatsResponse<T = any> {
  data?: T;
  errors?: Array<{ message: string }>;
}

export class GridError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
    public path?: string[]
  ) {
    super(message);
    this.name = 'GridError';
  }
}

class GridClient {
  private apiKey: string | undefined;
  private statsApiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.GRID_API_KEY;
    this.statsApiKey = process.env.GRID_STATS_API_KEY || this.apiKey;
  }

  private getHeaders(contentType: string = 'application/json'): Record<string, string> {
    return {
      'Content-Type': contentType,
      'x-api-key': this.apiKey || '',
    };
  }

  private getStatsHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.statsApiKey || '',
    };
  }

  async query<T = any>(
    query: string,
    variables?: GridVariables,
    useStatsEndpoint: boolean = false
  ): Promise<T> {
    const url = useStatsEndpoint ? GRID_STATS_URL : GRID_API_URL;
    const headers = useStatsEndpoint ? this.getStatsHeaders() : this.getHeaders();

    if (!this.apiKey && !useStatsEndpoint) {
      throw new GridError('GRID_API_KEY environment variable is not set', undefined, 'CONFIG_MISSING');
    }

    try {
      const response = await axios.post<GridResponse<T> | StatsResponse<T>>(
        url,
        { query, variables },
        { headers, timeout: 30000 }
      );

      const respData = response.data as GridResponse<T>;

      if (respData.errors && respData.errors.length > 0) {
        const errorMessage = respData.errors.map(e => e.message).join('; ');
        throw new GridError(`GraphQL Error: ${errorMessage}`, undefined, 'GRAPHQL_ERROR', undefined);
      }

      if (!respData.data) {
        throw new GridError('No data returned from GRID API', undefined, 'NO_DATA');
      }

      console.log(`[GRID${useStatsEndpoint ? '_STATS' : ''}] Query executed successfully`);
      return respData.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<any>;
        const statusCode = axiosError.response?.status;
        const responseData = axiosError.response?.data as any;

        if (statusCode === 401 || statusCode === 403) {
          throw new GridError(
            'GRID API authentication failed',
            statusCode,
            useStatsEndpoint ? 'STATS_UNAUTHENTICATED' : 'UNAUTHENTICATED'
          );
        }

        if (statusCode === 429) {
          throw new GridError(
            'GRID API rate limit exceeded',
            statusCode,
            'RATE_LIMIT'
          );
        }

        if (statusCode === 400) {
          const msg = responseData?.errors?.[0]?.message || axiosError.message;
          throw new GridError(`GRID schema error: ${msg}`, statusCode, 'SCHEMA_ERROR');
        }

        const errorMessage = responseData?.message || axiosError.message;
        throw new GridError(
          `GRID API request failed: ${errorMessage}`,
          statusCode,
          'REQUEST_FAILED'
        );
      }

      if (error instanceof GridError) {
        throw error;
      }

      throw new GridError(
        `Unexpected error: ${(error as Error).message}`,
        undefined,
        'UNKNOWN'
      );
    }
  }

  async statsQuery<T = any>(query: string, variables?: GridVariables): Promise<T> {
    return this.query<T>(query, variables, true);
  }

  getHealthStatus(): { central: boolean; stats: boolean } {
    return {
      central: !!this.apiKey,
      stats: !!this.statsApiKey,
    };
  }
}

export const gridClient = new GridClient();

export async function gridQuery<T>(query: string, variables?: GridVariables): Promise<T> {
  return gridClient.query<T>(query, variables);
}

export async function statsQuery<T>(query: string, variables?: GridVariables): Promise<T> {
  return gridClient.statsQuery<T>(query, variables);
}

