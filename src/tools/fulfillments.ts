import { getShopifyClient, ShopifyGraphQLClient } from '../clients/shopify-graphql.js';
import { 
  CREATE_FULFILLMENT, 
  UPDATE_TRACKING, 
  CANCEL_FULFILLMENT 
} from '../graphql/mutations/fulfillments.js';
import { successResult, errorResult, handleToolError, type ToolResult } from '../utils/error-handler.js';
import type {
  CreateFulfillmentInput,
  UpdateTrackingInput,
  CancelFulfillmentInput,
} from '../types/tools.js';

interface FulfillmentMutationResponse {
  fulfillmentCreateV2?: {
    fulfillment: {
      id: string;
      status: string;
      trackingInfo: Array<{
        company: string;
        number: string;
        url: string | null;
      }>;
      createdAt: string;
      updatedAt: string;
      deliveredAt: string | null;
      estimatedDeliveryAt: string | null;
      fulfillmentLineItems: {
        edges: Array<{
          node: {
            id: string;
            quantity: number;
            lineItem: {
              id: string;
              name: string;
            };
          };
        }>;
      };
    };
    userErrors: Array<{ field: string[]; message: string }>;
  };
  fulfillmentTrackingInfoUpdateV2?: {
    fulfillment: {
      id: string;
      status: string;
      trackingInfo: Array<{
        company: string;
        number: string;
        url: string | null;
      }>;
      updatedAt: string;
    };
    userErrors: Array<{ field: string[]; message: string }>;
  };
  fulfillmentCancel?: {
    fulfillment: {
      id: string;
      status: string;
    };
    userErrors: Array<{ field: string[]; message: string }>;
  };
}

export async function createFulfillment(input: CreateFulfillmentInput): Promise<ToolResult> {
  try {
    const client = getShopifyClient();
    const orderGid = ShopifyGraphQLClient.toGid('Order', input.orderId);

    // Build line items for fulfillment
    const lineItems = input.lineItems?.map((item) => ({
      id: ShopifyGraphQLClient.toGid('LineItem', item.id),
      quantity: item.quantity,
    }));

    // Build tracking info if provided
    const trackingInfo = input.trackingInfo?.number ? {
      company: input.trackingInfo.company,
      number: input.trackingInfo.number,
      url: input.trackingInfo.url,
    } : undefined;

    const fulfillmentInput: Record<string, unknown> = {
      notifyCustomer: input.notifyCustomer ?? true,
      trackingInfo: trackingInfo ? [trackingInfo] : undefined,
    };

    // Get fulfillment order info (required for v2)
    const fulfillmentOrder: Record<string, unknown> = {
      fulfillmentOrderId: orderGid, // This needs to be fulfillment order ID
      fulfillmentOrderLineItems: lineItems,
    };

    const result = await client.mutate<FulfillmentMutationResponse>(
      CREATE_FULFILLMENT,
      { 
        fulfillment: {
          ...fulfillmentInput,
          lineItemsByFulfillmentOrder: [fulfillmentOrder],
        }
      },
      'fulfillmentCreateV2'
    );

    if (!result.success) {
      return errorResult('VALIDATION_ERROR', 'Failed to create fulfillment', {
        userErrors: result.userErrors,
      });
    }

    const fulfillment = result.data?.fulfillmentCreateV2?.fulfillment;

    return successResult({
      message: 'Fulfillment created successfully',
      fulfillment: {
        id: fulfillment?.id ? ShopifyGraphQLClient.fromGid(fulfillment.id) : null,
        gid: fulfillment?.id,
        status: fulfillment?.status,
        trackingInfo: fulfillment?.trackingInfo,
        createdAt: fulfillment?.createdAt,
        lineItems: fulfillment?.fulfillmentLineItems.edges.map((e) => ({
          id: ShopifyGraphQLClient.fromGid(e.node.id),
          quantity: e.node.quantity,
          itemName: e.node.lineItem.name,
        })),
      },
    });
  } catch (error) {
    return handleToolError(error);
  }
}

export async function updateTracking(input: UpdateTrackingInput): Promise<ToolResult> {
  try {
    const client = getShopifyClient();
    const gid = ShopifyGraphQLClient.toGid('Fulfillment', input.fulfillmentId);

    const trackingInfoInput = {
      company: input.trackingInfo.company,
      number: input.trackingInfo.number,
      url: input.trackingInfo.url,
    };

    const result = await client.mutate<FulfillmentMutationResponse>(
      UPDATE_TRACKING,
      { 
        fulfillmentId: gid,
        trackingInfoInput,
        notifyCustomer: input.notifyCustomer ?? false,
      },
      'fulfillmentTrackingInfoUpdateV2'
    );

    if (!result.success) {
      return errorResult('VALIDATION_ERROR', 'Failed to update tracking info', {
        userErrors: result.userErrors,
      });
    }

    const fulfillment = result.data?.fulfillmentTrackingInfoUpdateV2?.fulfillment;

    return successResult({
      message: 'Tracking info updated successfully',
      fulfillment: {
        id: fulfillment?.id ? ShopifyGraphQLClient.fromGid(fulfillment.id) : null,
        gid: fulfillment?.id,
        status: fulfillment?.status,
        trackingInfo: fulfillment?.trackingInfo,
        updatedAt: fulfillment?.updatedAt,
      },
    });
  } catch (error) {
    return handleToolError(error);
  }
}

export async function cancelFulfillment(input: CancelFulfillmentInput): Promise<ToolResult> {
  try {
    const client = getShopifyClient();
    const gid = ShopifyGraphQLClient.toGid('Fulfillment', input.fulfillmentId);

    const result = await client.mutate<FulfillmentMutationResponse>(
      CANCEL_FULFILLMENT,
      { id: gid },
      'fulfillmentCancel'
    );

    if (!result.success) {
      return errorResult('VALIDATION_ERROR', 'Failed to cancel fulfillment', {
        userErrors: result.userErrors,
      });
    }

    return successResult({
      message: 'Fulfillment cancelled successfully',
      fulfillmentId: input.fulfillmentId,
      status: result.data?.fulfillmentCancel?.fulfillment?.status,
    });
  } catch (error) {
    return handleToolError(error);
  }
}

// Export tool definitions for MCP registration
export const fulfillmentToolDefinitions = [
  {
    name: 'create_fulfillment',
    description: 'Create a fulfillment for an order (mark items as shipped)',
    inputSchema: {
      type: 'object',
      properties: {
        orderId: {
          type: 'string',
          description: 'Order ID to fulfill',
        },
        lineItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'Line item ID',
              },
              quantity: {
                type: 'number',
                description: 'Quantity to fulfill',
              },
            },
            required: ['id', 'quantity'],
          },
          description: 'Line items to fulfill',
        },
        trackingInfo: {
          type: 'object',
          properties: {
            number: {
              type: 'string',
              description: 'Tracking number',
            },
            company: {
              type: 'string',
              description: 'Shipping carrier/company',
            },
            url: {
              type: 'string',
              description: 'URL to track shipment',
            },
          },
          description: 'Tracking information',
        },
        notifyCustomer: {
          type: 'boolean',
          description: 'Send shipping notification to customer (default: true)',
        },
      },
      required: ['orderId', 'lineItems'],
    },
    handler: createFulfillment,
  },
  {
    name: 'update_tracking',
    description: 'Update tracking information for a fulfillment',
    inputSchema: {
      type: 'object',
      properties: {
        fulfillmentId: {
          type: 'string',
          description: 'Fulfillment ID to update',
        },
        trackingInfo: {
          type: 'object',
          properties: {
            number: {
              type: 'string',
              description: 'Tracking number',
            },
            company: {
              type: 'string',
              description: 'Shipping carrier/company',
            },
            url: {
              type: 'string',
              description: 'URL to track shipment',
            },
          },
          description: 'Tracking information',
        },
        notifyCustomer: {
          type: 'boolean',
          description: 'Notify customer of tracking update (default: false)',
        },
      },
      required: ['fulfillmentId', 'trackingInfo'],
    },
    handler: updateTracking,
  },
  {
    name: 'cancel_fulfillment',
    description: 'Cancel a fulfillment',
    inputSchema: {
      type: 'object',
      properties: {
        fulfillmentId: {
          type: 'string',
          description: 'Fulfillment ID to cancel',
        },
      },
      required: ['fulfillmentId'],
    },
    handler: cancelFulfillment,
  },
];
