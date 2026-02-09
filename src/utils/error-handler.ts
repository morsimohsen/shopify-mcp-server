import type { ShopifyUserError } from '../types/shopify.js';
import { ShopifyAPIError, ShopifyValidationError } from '../clients/shopify-graphql.js';

export interface ToolError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: ToolError;
}

/**
 * Format a successful tool result
 */
export function successResult<T>(data: T): ToolResult<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Format an error tool result
 */
export function errorResult(
  code: string,
  message: string,
  details?: Record<string, unknown>
): ToolResult<never> {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
}

/**
 * Format user errors from Shopify mutations
 */
export function formatUserErrors(userErrors: ShopifyUserError[]): ToolResult<never> {
  const messages = userErrors.map((e) => {
    const field = e.field ? e.field.join('.') : 'unknown';
    return `${field}: ${e.message}`;
  });

  return errorResult('VALIDATION_ERROR', messages.join('; '), {
    userErrors,
  });
}

/**
 * Handle errors from tool execution
 */
export function handleToolError(error: unknown): ToolResult<never> {
  if (error instanceof ShopifyValidationError) {
    return formatUserErrors(error.userErrors);
  }

  if (error instanceof ShopifyAPIError) {
    const code = error.name.replace('Shopify', '').replace('Error', '').toUpperCase();
    return errorResult(code || 'API_ERROR', error.message);
  }

  if (error instanceof Error) {
    return errorResult('UNKNOWN_ERROR', error.message);
  }

  return errorResult('UNKNOWN_ERROR', 'An unexpected error occurred');
}

/**
 * Wrap a tool handler with error handling
 */
export function withErrorHandling<T, A extends unknown[]>(
  handler: (...args: A) => Promise<ToolResult<T>>
): (...args: A) => Promise<ToolResult<T>> {
  return async (...args: A): Promise<ToolResult<T>> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleToolError(error) as ToolResult<T>;
    }
  };
}

/**
 * Common error codes
 */
export const ErrorCodes = {
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  API_ERROR: 'API_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;
