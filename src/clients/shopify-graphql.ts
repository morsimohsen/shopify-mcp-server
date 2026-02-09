import { GraphQLClient, Variables } from 'graphql-request';
import type { ShopifyConfig, ShopifyGraphQLError, ShopifyUserError } from '../types/shopify.js';

const DEFAULT_API_VERSION = '2025-01';

export interface GraphQLResponse<T> {
  data: T | null;
  errors?: ShopifyGraphQLError[];
  extensions?: {
    cost: {
      requestedQueryCost: number;
      actualQueryCost: number;
      throttleStatus: {
        maximumAvailable: number;
        currentlyAvailable: number;
        restoreRate: number;
      };
    };
  };
}

export interface MutationResult<T> {
  success: boolean;
  data: T | null;
  userErrors: ShopifyUserError[];
}

export class ShopifyGraphQLClient {
  private client: GraphQLClient;
  private config: ShopifyConfig;

  constructor(config: Partial<ShopifyConfig> = {}) {
    this.config = {
      storeUrl: config.storeUrl || process.env.SHOPIFY_STORE_URL || '',
      accessToken: config.accessToken || process.env.SHOPIFY_ACCESS_TOKEN || '',
      apiVersion: config.apiVersion || process.env.SHOPIFY_API_VERSION || DEFAULT_API_VERSION,
    };

    this.validateConfig();

    const endpoint = this.buildEndpoint();
    this.client = new GraphQLClient(endpoint, {
      headers: {
        'X-Shopify-Access-Token': this.config.accessToken,
        'Content-Type': 'application/json',
      },
    });
  }

  private validateConfig(): void {
    if (!this.config.storeUrl) {
      throw new Error('SHOPIFY_STORE_URL is required. Set it as an environment variable or pass it in the config.');
    }
    if (!this.config.accessToken) {
      throw new Error('SHOPIFY_ACCESS_TOKEN is required. Set it as an environment variable or pass it in the config.');
    }
  }

  private buildEndpoint(): string {
    const storeUrl = this.config.storeUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    return `https://${storeUrl}/admin/api/${this.config.apiVersion}/graphql.json`;
  }

  /**
   * Execute a GraphQL query
   */
  async query<T>(query: string, variables?: Variables): Promise<T> {
    try {
      const response = await this.client.request<T>(query, variables);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Execute a GraphQL mutation with standard userErrors handling
   */
  async mutate<T>(
    mutation: string,
    variables?: Variables,
    mutationName?: string
  ): Promise<MutationResult<T>> {
    try {
      const response = await this.client.request<T>(mutation, variables);
      
      // Extract the mutation result (e.g., productCreate, orderUpdate, etc.)
      const key = mutationName || Object.keys(response as object)[0];
      const result = (response as Record<string, unknown>)[key] as {
        userErrors?: ShopifyUserError[];
        [key: string]: unknown;
      };

      if (result?.userErrors && result.userErrors.length > 0) {
        return {
          success: false,
          data: null,
          userErrors: result.userErrors,
        };
      }

      return {
        success: true,
        data: response,
        userErrors: [],
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Execute a paginated query and return all results
   */
  async queryAll<T, N>(
    query: string,
    variables: Variables,
    extractNodes: (data: T) => { nodes: N[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } }
  ): Promise<N[]> {
    const allNodes: N[] = [];
    let hasNextPage = true;
    let cursor: string | null = null;

    while (hasNextPage) {
      const response = await this.query<T>(query, {
        ...variables,
        after: cursor,
      });

      const { nodes, pageInfo } = extractNodes(response);
      allNodes.push(...nodes);
      hasNextPage = pageInfo.hasNextPage;
      cursor = pageInfo.endCursor;

      // Safety limit to prevent infinite loops
      if (allNodes.length > 10000) {
        console.warn('Query pagination exceeded 10000 items, stopping.');
        break;
      }
    }

    return allNodes;
  }

  /**
   * Convert numeric ID to Shopify GID format
   */
  static toGid(type: string, id: string | number): string {
    const idStr = String(id);
    if (idStr.startsWith('gid://shopify/')) {
      return idStr;
    }
    return `gid://shopify/${type}/${idStr}`;
  }

  /**
   * Extract numeric ID from Shopify GID
   */
  static fromGid(gid: string): string {
    const match = gid.match(/gid:\/\/shopify\/\w+\/(\d+)/);
    return match ? match[1] : gid;
  }

  /**
   * Handle GraphQL errors
   */
  private handleError(error: unknown): Error {
    if (error instanceof Error) {
      // Check for rate limiting
      if (error.message.includes('Throttled')) {
        return new ShopifyRateLimitError('Rate limit exceeded. Please retry after a moment.');
      }

      // Check for authentication errors
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        return new ShopifyAuthenticationError('Invalid access token or authentication failed.');
      }

      // Check for not found errors
      if (error.message.includes('404') || error.message.includes('not found')) {
        return new ShopifyNotFoundError(error.message);
      }

      return new ShopifyAPIError(error.message);
    }

    return new ShopifyAPIError('An unknown error occurred');
  }

  /**
   * Get current rate limit status
   */
  getConfig(): ShopifyConfig {
    return { ...this.config };
  }
}

// Custom error classes
export class ShopifyAPIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ShopifyAPIError';
  }
}

export class ShopifyRateLimitError extends ShopifyAPIError {
  constructor(message: string) {
    super(message);
    this.name = 'ShopifyRateLimitError';
  }
}

export class ShopifyAuthenticationError extends ShopifyAPIError {
  constructor(message: string) {
    super(message);
    this.name = 'ShopifyAuthenticationError';
  }
}

export class ShopifyNotFoundError extends ShopifyAPIError {
  constructor(message: string) {
    super(message);
    this.name = 'ShopifyNotFoundError';
  }
}

export class ShopifyValidationError extends ShopifyAPIError {
  public userErrors: ShopifyUserError[];

  constructor(message: string, userErrors: ShopifyUserError[]) {
    super(message);
    this.name = 'ShopifyValidationError';
    this.userErrors = userErrors;
  }
}

// Singleton instance
let clientInstance: ShopifyGraphQLClient | null = null;

export function getShopifyClient(config?: Partial<ShopifyConfig>): ShopifyGraphQLClient {
  if (!clientInstance || config) {
    clientInstance = new ShopifyGraphQLClient(config);
  }
  return clientInstance;
}

export function resetShopifyClient(): void {
  clientInstance = null;
}

export function initializeShopifyClient(config: ShopifyConfig): ShopifyGraphQLClient {
  clientInstance = new ShopifyGraphQLClient(config);
  return clientInstance;
}
