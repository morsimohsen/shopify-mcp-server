import { productToolDefinitions } from './products.js';
import { orderToolDefinitions } from './orders.js';
import { customerToolDefinitions } from './customers.js';
import { inventoryToolDefinitions } from './inventory.js';
import { collectionToolDefinitions } from './collections.js';
import { discountToolDefinitions } from './discounts.js';
import { fulfillmentToolDefinitions } from './fulfillments.js';
import { refundToolDefinitions } from './refunds.js';
import { shopToolDefinitions } from './shop.js';
import type { ToolResult } from '../utils/error-handler.js';

// Export individual tool definitions for selective use
export {
  productToolDefinitions,
  orderToolDefinitions,
  customerToolDefinitions,
  inventoryToolDefinitions,
  collectionToolDefinitions,
  discountToolDefinitions,
  fulfillmentToolDefinitions,
  refundToolDefinitions,
  shopToolDefinitions,
};

// Combine all tool definitions for MCP registration
export const allToolDefinitions = [
  ...productToolDefinitions,
  ...orderToolDefinitions,
  ...customerToolDefinitions,
  ...inventoryToolDefinitions,
  ...collectionToolDefinitions,
  ...discountToolDefinitions,
  ...fulfillmentToolDefinitions,
  ...refundToolDefinitions,
  ...shopToolDefinitions,
];

// Type for a tool definition
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
  handler: (input: unknown) => Promise<{ success: boolean; data?: unknown; error?: unknown }>;
}

// Create a map for quick lookup by tool name
export const toolHandlerMap = new Map<string, (input: unknown) => Promise<ToolResult>>(
  allToolDefinitions.map((tool) => [tool.name, tool.handler as (input: unknown) => Promise<ToolResult>])
);

// Get all tool names
export const toolNames = allToolDefinitions.map((tool) => tool.name);

// Tool categories for organization
export const toolCategories = {
  products: productToolDefinitions.map((t) => t.name),
  orders: orderToolDefinitions.map((t) => t.name),
  customers: customerToolDefinitions.map((t) => t.name),
  inventory: inventoryToolDefinitions.map((t) => t.name),
  collections: collectionToolDefinitions.map((t) => t.name),
  discounts: discountToolDefinitions.map((t) => t.name),
  fulfillments: fulfillmentToolDefinitions.map((t) => t.name),
  refunds: refundToolDefinitions.map((t) => t.name),
  shop: shopToolDefinitions.map((t) => t.name),
};

// Export tool counts for debugging
export const toolCounts = {
  products: productToolDefinitions.length,
  orders: orderToolDefinitions.length,
  customers: customerToolDefinitions.length,
  inventory: inventoryToolDefinitions.length,
  collections: collectionToolDefinitions.length,
  discounts: discountToolDefinitions.length,
  fulfillments: fulfillmentToolDefinitions.length,
  refunds: refundToolDefinitions.length,
  shop: shopToolDefinitions.length,
  total: allToolDefinitions.length,
};
