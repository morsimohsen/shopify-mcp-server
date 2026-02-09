import type { Connection, PageInfo, PaginatedResult } from '../types/shopify.js';

/**
 * Convert a GraphQL Connection to a simplified paginated result
 */
export function connectionToResult<T>(connection: Connection<T>): PaginatedResult<T> {
  return {
    items: connection.edges.map((edge) => edge.node),
    pageInfo: connection.pageInfo,
  };
}

/**
 * Extract nodes from a connection
 */
export function extractNodes<T>(connection: Connection<T>): T[] {
  return connection.edges.map((edge) => edge.node);
}

/**
 * Build pagination arguments for GraphQL queries
 */
export function buildPaginationArgs(options: {
  first?: number;
  after?: string;
  last?: number;
  before?: string;
}): Record<string, unknown> {
  const args: Record<string, unknown> = {};

  if (options.first !== undefined) {
    args.first = options.first;
  }
  if (options.after) {
    args.after = options.after;
  }
  if (options.last !== undefined) {
    args.last = options.last;
  }
  if (options.before) {
    args.before = options.before;
  }

  return args;
}

/**
 * Create a cursor-based page info object
 */
export function createPageInfo(
  hasNextPage: boolean,
  hasPreviousPage: boolean,
  startCursor: string | null,
  endCursor: string | null
): PageInfo {
  return {
    hasNextPage,
    hasPreviousPage,
    startCursor,
    endCursor,
  };
}

/**
 * Combine multiple paginated results
 */
export function combinePaginatedResults<T>(
  results: PaginatedResult<T>[]
): PaginatedResult<T> {
  if (results.length === 0) {
    return {
      items: [],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null,
      },
    };
  }

  const allItems = results.flatMap((r) => r.items);
  const firstResult = results[0];
  const lastResult = results[results.length - 1];

  return {
    items: allItems,
    pageInfo: {
      hasNextPage: lastResult.pageInfo.hasNextPage,
      hasPreviousPage: firstResult.pageInfo.hasPreviousPage,
      startCursor: firstResult.pageInfo.startCursor,
      endCursor: lastResult.pageInfo.endCursor,
    },
  };
}
