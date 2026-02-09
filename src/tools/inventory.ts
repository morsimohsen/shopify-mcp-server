import { getShopifyClient, ShopifyGraphQLClient } from '../clients/shopify-graphql.js';
import { GET_INVENTORY_ITEM, ADJUST_INVENTORY, SET_INVENTORY } from '../graphql/queries/inventory.js';
import { successResult, errorResult, handleToolError, type ToolResult } from '../utils/error-handler.js';
import type {
  GetInventoryLevelsInput,
  GetInventoryItemInput,
  AdjustInventoryInput,
  SetInventoryInput,
} from '../types/tools.js';

interface InventoryItemResponse {
  inventoryItem: {
    id: string;
    sku: string | null;
    tracked: boolean;
    inventoryLevels: {
      edges: Array<{
        node: {
          id: string;
          quantities: Array<{ name: string; quantity: number }>;
          location: { id: string; name: string; isActive: boolean };
        };
      }>;
    };
  } | null;
}

interface InventoryAdjustResponse {
  inventoryAdjustQuantities?: {
    inventoryAdjustmentGroup: {
      changes: Array<{
        name: string;
        delta: number;
        quantityAfterChange: number;
        item: { id: string; sku: string | null };
        location: { id: string; name: string };
      }>;
    };
    userErrors: Array<{ field: string[]; message: string }>;
  };
  inventorySetOnHandQuantities?: {
    inventoryAdjustmentGroup: {
      changes: Array<{
        name: string;
        quantityAfterChange: number;
        item: { id: string; sku: string | null };
        location: { id: string; name: string };
      }>;
    };
    userErrors: Array<{ field: string[]; message: string }>;
  };
}

export async function getInventoryLevels(input: GetInventoryLevelsInput): Promise<ToolResult> {
  try {
    const client = getShopifyClient();
    
    // If inventoryItemId is provided, get levels for that specific item
    if (input.inventoryItemId) {
      const gid = ShopifyGraphQLClient.toGid('InventoryItem', input.inventoryItemId);
      const response = await client.query<InventoryItemResponse>(GET_INVENTORY_ITEM, {
        id: gid,
      });

      if (!response.inventoryItem) {
        return errorResult('NOT_FOUND', `Inventory item ${input.inventoryItemId} not found`);
      }

      const levels = response.inventoryItem.inventoryLevels.edges.map((edge) => ({
        locationId: ShopifyGraphQLClient.fromGid(edge.node.location.id),
        locationName: edge.node.location.name,
        isActive: edge.node.location.isActive,
        quantities: edge.node.quantities.reduce((acc, q) => {
          acc[q.name] = q.quantity;
          return acc;
        }, {} as Record<string, number>),
      }));

      return successResult({
        inventoryItemId: input.inventoryItemId,
        sku: response.inventoryItem.sku,
        tracked: response.inventoryItem.tracked,
        levels,
      });
    }

    return errorResult('INVALID_INPUT', 'inventoryItemId is required');
  } catch (error) {
    return handleToolError(error);
  }
}

export async function getInventoryItem(input: GetInventoryItemInput): Promise<ToolResult> {
  try {
    const client = getShopifyClient();
    const gid = ShopifyGraphQLClient.toGid('InventoryItem', input.id);

    const response = await client.query<InventoryItemResponse>(GET_INVENTORY_ITEM, {
      id: gid,
    });

    if (!response.inventoryItem) {
      return errorResult('NOT_FOUND', `Inventory item ${input.id} not found`);
    }

    const item = response.inventoryItem;
    const levels = item.inventoryLevels.edges.map((edge) => ({
      id: ShopifyGraphQLClient.fromGid(edge.node.id),
      locationId: ShopifyGraphQLClient.fromGid(edge.node.location.id),
      locationName: edge.node.location.name,
      isActive: edge.node.location.isActive,
      quantities: edge.node.quantities.reduce((acc, q) => {
        acc[q.name] = q.quantity;
        return acc;
      }, {} as Record<string, number>),
    }));

    return successResult({
      id: ShopifyGraphQLClient.fromGid(item.id),
      gid: item.id,
      sku: item.sku,
      tracked: item.tracked,
      levels,
    });
  } catch (error) {
    return handleToolError(error);
  }
}

export async function adjustInventory(input: AdjustInventoryInput): Promise<ToolResult> {
  try {
    const client = getShopifyClient();
    const inventoryItemGid = ShopifyGraphQLClient.toGid('InventoryItem', input.inventoryItemId);
    const locationGid = ShopifyGraphQLClient.toGid('Location', input.locationId);

    const result = await client.mutate<InventoryAdjustResponse>(
      ADJUST_INVENTORY,
      {
        input: {
          reason: input.reason || 'correction',
          name: 'available',
          changes: [
            {
              inventoryItemId: inventoryItemGid,
              locationId: locationGid,
              delta: input.delta,
            },
          ],
        },
      },
      'inventoryAdjustQuantities'
    );

    if (!result.success) {
      return errorResult('VALIDATION_ERROR', 'Failed to adjust inventory', {
        userErrors: result.userErrors,
      });
    }

    const changes = result.data?.inventoryAdjustQuantities?.inventoryAdjustmentGroup?.changes;
    
    return successResult({
      message: 'Inventory adjusted successfully',
      adjustment: {
        inventoryItemId: input.inventoryItemId,
        locationId: input.locationId,
        delta: input.delta,
        newQuantity: changes?.[0]?.quantityAfterChange,
      },
    });
  } catch (error) {
    return handleToolError(error);
  }
}

export async function setInventory(input: SetInventoryInput): Promise<ToolResult> {
  try {
    const client = getShopifyClient();
    const inventoryItemGid = ShopifyGraphQLClient.toGid('InventoryItem', input.inventoryItemId);
    const locationGid = ShopifyGraphQLClient.toGid('Location', input.locationId);

    const result = await client.mutate<InventoryAdjustResponse>(
      SET_INVENTORY,
      {
        input: {
          reason: input.reason || 'correction',
          setQuantities: [
            {
              inventoryItemId: inventoryItemGid,
              locationId: locationGid,
              quantity: input.available,
            },
          ],
        },
      },
      'inventorySetOnHandQuantities'
    );

    if (!result.success) {
      return errorResult('VALIDATION_ERROR', 'Failed to set inventory', {
        userErrors: result.userErrors,
      });
    }

    return successResult({
      message: 'Inventory set successfully',
      inventory: {
        inventoryItemId: input.inventoryItemId,
        locationId: input.locationId,
        quantity: input.available,
      },
    });
  } catch (error) {
    return handleToolError(error);
  }
}

// Export tool definitions for MCP registration
export const inventoryToolDefinitions = [
  {
    name: 'get_inventory_levels',
    description: 'Get inventory levels for an inventory item across all locations',
    inputSchema: {
      type: 'object',
      properties: {
        inventoryItemId: {
          type: 'string',
          description: 'Inventory item ID (get from product variant)',
        },
      },
      required: ['inventoryItemId'],
    },
    handler: getInventoryLevels,
  },
  {
    name: 'get_inventory_item',
    description: 'Get detailed information about an inventory item',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Inventory item ID',
        },
      },
      required: ['id'],
    },
    handler: getInventoryItem,
  },
  {
    name: 'adjust_inventory',
    description: 'Adjust inventory quantity by a delta (positive or negative)',
    inputSchema: {
      type: 'object',
      properties: {
        inventoryItemId: {
          type: 'string',
          description: 'Inventory item ID',
        },
        locationId: {
          type: 'string',
          description: 'Location ID',
        },
        delta: {
          type: 'number',
          description: 'Quantity change (positive to add, negative to subtract)',
        },
        reason: {
          type: 'string',
          description: 'Reason for adjustment',
        },
      },
      required: ['inventoryItemId', 'locationId', 'delta'],
    },
    handler: adjustInventory,
  },
  {
    name: 'set_inventory',
    description: 'Set inventory to an exact quantity',
    inputSchema: {
      type: 'object',
      properties: {
        inventoryItemId: {
          type: 'string',
          description: 'Inventory item ID',
        },
        locationId: {
          type: 'string',
          description: 'Location ID',
        },
        available: {
          type: 'number',
          description: 'Exact quantity to set',
        },
        reason: {
          type: 'string',
          description: 'Reason for adjustment',
        },
      },
      required: ['inventoryItemId', 'locationId', 'available'],
    },
    handler: setInventory,
  },
];
