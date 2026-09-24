import axios, { AxiosError } from 'axios';

const GRID_API_URL = 'https://api-op.grid.gg/central-data/graphql';

export interface GridVariables {
  [key: string]: any;
}

export interface GridResponse<T = any> {
  data?: T;
  errors?: Array<{ message: string }>;
}

export class GridError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'GridError';
  }
}

async function gridQuery<T = any>(
  query: string,
  variables?: GridVariables
): Promise<T> {
  const apiKey = process.env.GRID_API_KEY;

  if (!apiKey) {
    throw new GridError('GRID_API_KEY environment variable is not set', undefined, 'CONFIG_MISSING');
  }

  try {
    const response = await axios.post<GridResponse<T>>(
      GRID_API_URL,
      { query, variables },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        timeout: 30000,
      }
    );

    if (response.data.errors && response.data.errors.length > 0) {
      const errorMessage = response.data.errors.map(e => e.message).join('; ');
      throw new GridError(`GraphQL Error: ${errorMessage}`, undefined, 'GRAPHQL_ERROR');
    }

    if (!response.data.data) {
      throw new GridError('No data returned from GRID API', undefined, 'NO_DATA');
    }

    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;
      const statusCode = axiosError.response?.status;
      const responseData = axiosError.response?.data;

      if (statusCode === 401 || statusCode === 403) {
        throw new GridError(
          'GRID API authentication failed',
          statusCode,
          'UNAUTHENTICATED'
        );
      }

      if (statusCode === 429) {
        throw new GridError(
          'GRID API rate limit exceeded',
          statusCode,
          'RATE_LIMIT'
        );
      }

      if (statusCode === 404) {
        throw new GridError(
          'GRID API resource not found',
          statusCode,
          'NOT_FOUND'
        );
      }

      const errorMessage = (responseData as any)?.message || axiosError.message;
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

export { gridQuery };

