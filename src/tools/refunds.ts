import { getShopifyClient, ShopifyGraphQLClient } from '../clients/shopify-graphql.js';
import { LIST_REFUNDS, CREATE_REFUND, CREATE_RETURN } from '../graphql/queries/refunds.js';
import { successResult, errorResult, handleToolError, type ToolResult } from '../utils/error-handler.js';
import type {
  ListRefundsInput,
  CalculateRefundInput,
  CreateRefundInput,
  CreateReturnInput,
} from '../types/tools.js';

interface RefundNode {
  id: string;
  createdAt: string;
  note: string | null;
  totalRefundedSet: {
    shopMoney: {
      amount: string;
      currencyCode: string;
    };
  };
  refundLineItems: {
    edges: Array<{
      node: {
        lineItem: {
          id: string;
          name: string;
        };
        quantity: number;
        restockType: string;
        subtotalSet: {
          shopMoney: {
            amount: string;
          };
        };
      };
    }>;
  };
}

interface OrderRefundsResponse {
  order: {
    id: string;
    refunds: RefundNode[];
  };
}

interface RefundMutationResponse {
  refundCreate?: {
    refund: {
      id: string;
      createdAt: string;
      note: string | null;
      totalRefundedSet: {
        shopMoney: {
          amount: string;
          currencyCode: string;
        };
      };
    };
    userErrors: Array<{ field: string[]; message: string }>;
  };
  returnCreate?: {
    return: {
      id: string;
      status: string;
      declinedAt: string | null;
      returnLineItems: {
        edges: Array<{
          node: {
            id: string;
            quantity: number;
            returnReason: string;
            customerNote: string | null;
            fulfillmentLineItem: {
              lineItem: {
                id: string;
                name: string;
              };
            };
          };
        }>;
      };
    };
    userErrors: Array<{ field: string[]; message: string }>;
  };
}

export async function listRefunds(input: ListRefundsInput): Promise<ToolResult> {
  try {
    const client = getShopifyClient();
    const gid = ShopifyGraphQLClient.toGid('Order', input.orderId);

    const response = await client.query<OrderRefundsResponse>(LIST_REFUNDS, {
      orderId: gid,
    });

    const refunds = response.order.refunds.map((refund) => ({
      id: ShopifyGraphQLClient.fromGid(refund.id),
      gid: refund.id,
      createdAt: refund.createdAt,
      note: refund.note,
      totalRefunded: {
        amount: refund.totalRefundedSet.shopMoney.amount,
        currencyCode: refund.totalRefundedSet.shopMoney.currencyCode,
      },
      lineItems: refund.refundLineItems.edges.map((e) => ({
        lineItemId: ShopifyGraphQLClient.fromGid(e.node.lineItem.id),
        name: e.node.lineItem.name,
        quantity: e.node.quantity,
        restockType: e.node.restockType,
        subtotal: e.node.subtotalSet.shopMoney.amount,
      })),
    }));

    return successResult({
      orderId: input.orderId,
      refunds,
      count: refunds.length,
    });
  } catch (error) {
    return handleToolError(error);
  }
}

export async function calculateRefund(input: CalculateRefundInput): Promise<ToolResult> {
  try {
    const client = getShopifyClient();
    const gid = ShopifyGraphQLClient.toGid('Order', input.orderId);

    // Build refund line items
    const refundLineItems = input.refundLineItems?.map((item) => ({
      lineItemId: ShopifyGraphQLClient.toGid('LineItem', item.lineItemId),
      quantity: item.quantity,
    }));

    // Use suggestedRefund query to calculate
    const CALCULATE_REFUND = `
      query calculateRefund($orderId: ID!, $refundLineItems: [RefundLineItemInput!]) {
        order(id: $orderId) {
          suggestedRefund(
            refundLineItems: $refundLineItems
            suggestFullRefund: ${input.refundLineItems ? 'false' : 'true'}
          ) {
            amount
            subtotal
            totalTaxes
            maximumRefundable
            refundLineItems {
              lineItem {
                id
                name
              }
              quantity
              subtotal
            }
          }
        }
      }
    `;

    interface CalculateResponse {
      order: {
        suggestedRefund: {
          amount: string;
          subtotal: string;
          totalTaxes: string;
          maximumRefundable: string;
          refundLineItems: Array<{
            lineItem: { id: string; name: string };
            quantity: number;
            subtotal: string;
          }>;
        };
      };
    }

    const response = await client.query<CalculateResponse>(CALCULATE_REFUND, {
      orderId: gid,
      refundLineItems: refundLineItems,
    });

    const suggested = response.order.suggestedRefund;

    return successResult({
      orderId: input.orderId,
      calculation: {
        amount: suggested.amount,
        subtotal: suggested.subtotal,
        totalTaxes: suggested.totalTaxes,
        maximumRefundable: suggested.maximumRefundable,
        lineItems: suggested.refundLineItems.map((item) => ({
          lineItemId: ShopifyGraphQLClient.fromGid(item.lineItem.id),
          name: item.lineItem.name,
          quantity: item.quantity,
          subtotal: item.subtotal,
        })),
      },
    });
  } catch (error) {
    return handleToolError(error);
  }
}

export async function createRefund(input: CreateRefundInput): Promise<ToolResult> {
  try {
    const client = getShopifyClient();
    const gid = ShopifyGraphQLClient.toGid('Order', input.orderId);

    // Build refund line items
    const refundLineItems = input.refundLineItems?.map((item) => ({
      lineItemId: ShopifyGraphQLClient.toGid('LineItem', item.lineItemId),
      quantity: item.quantity,
      restockType: item.restockType || 'NO_RESTOCK',
    }));

    const refundInput: Record<string, unknown> = {
      orderId: gid,
      note: input.note,
      notify: input.notify ?? true,
      refundLineItems: refundLineItems,
    };

    // Add shipping if specified
    if (input.shipping) {
      refundInput.shipping = {
        fullRefund: input.shipping.fullRefund,
        amount: input.shipping.amount,
      };
    }

    const result = await client.mutate<RefundMutationResponse>(
      CREATE_REFUND,
      { input: refundInput },
      'refundCreate'
    );

    if (!result.success) {
      return errorResult('VALIDATION_ERROR', 'Failed to create refund', {
        userErrors: result.userErrors,
      });
    }

    const refund = result.data?.refundCreate?.refund;

    return successResult({
      message: 'Refund created successfully',
      refund: {
        id: refund?.id ? ShopifyGraphQLClient.fromGid(refund.id) : null,
        gid: refund?.id,
        createdAt: refund?.createdAt,
        note: refund?.note,
        totalRefunded: refund?.totalRefundedSet.shopMoney,
      },
    });
  } catch (error) {
    return handleToolError(error);
  }
}

export async function createReturn(input: CreateReturnInput): Promise<ToolResult> {
  try {
    const client = getShopifyClient();
    const gid = ShopifyGraphQLClient.toGid('Order', input.orderId);

    // Build return line items
    const returnLineItems = input.returnLineItems.map((item) => ({
      fulfillmentLineItemId: ShopifyGraphQLClient.toGid('FulfillmentLineItem', item.fulfillmentLineItemId),
      quantity: item.quantity,
      returnReason: item.returnReason || 'UNKNOWN',
      customerNote: item.returnReasonNote,
    }));

    const returnInput = {
      orderId: gid,
      returnLineItems,
      notifyCustomer: input.notifyCustomer ?? true,
    };

    const result = await client.mutate<RefundMutationResponse>(
      CREATE_RETURN,
      { input: returnInput },
      'returnCreate'
    );

    if (!result.success) {
      return errorResult('VALIDATION_ERROR', 'Failed to create return', {
        userErrors: result.userErrors,
      });
    }

    const returnData = result.data?.returnCreate?.return;

    return successResult({
      message: 'Return created successfully',
      return: {
        id: returnData?.id ? ShopifyGraphQLClient.fromGid(returnData.id) : null,
        gid: returnData?.id,
        status: returnData?.status,
        lineItems: returnData?.returnLineItems.edges.map((e) => ({
          id: ShopifyGraphQLClient.fromGid(e.node.id),
          quantity: e.node.quantity,
          returnReason: e.node.returnReason,
          customerNote: e.node.customerNote,
          itemName: e.node.fulfillmentLineItem.lineItem.name,
        })),
      },
    });
  } catch (error) {
    return handleToolError(error);
  }
}

// Export tool definitions for MCP registration
export const refundToolDefinitions = [
  {
    name: 'list_refunds',
    description: 'List all refunds for a specific order',
    inputSchema: {
      type: 'object',
      properties: {
        orderId: {
          type: 'string',
          description: 'Order ID to get refunds for',
        },
      },
      required: ['orderId'],
    },
    handler: listRefunds,
  },
  {
    name: 'calculate_refund',
    description: 'Calculate refund amount for an order before processing',
    inputSchema: {
      type: 'object',
      properties: {
        orderId: {
          type: 'string',
          description: 'Order ID to calculate refund for',
        },
        refundLineItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              lineItemId: {
                type: 'string',
                description: 'Line item ID',
              },
              quantity: {
                type: 'number',
                description: 'Quantity to refund',
              },
            },
            required: ['lineItemId', 'quantity'],
          },
          description: 'Specific line items to refund (optional, calculates full refund if not specified)',
        },
      },
      required: ['orderId'],
    },
    handler: calculateRefund,
  },
  {
    name: 'create_refund',
    description: 'Create a refund for an order',
    inputSchema: {
      type: 'object',
      properties: {
        orderId: {
          type: 'string',
          description: 'Order ID to refund',
        },
        note: {
          type: 'string',
          description: 'Note/reason for the refund',
        },
        notify: {
          type: 'boolean',
          description: 'Notify customer about the refund (default: true)',
        },
        refundLineItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              lineItemId: {
                type: 'string',
                description: 'Line item ID',
              },
              quantity: {
                type: 'number',
                description: 'Quantity to refund',
              },
              restockType: {
                type: 'string',
                enum: ['RETURN', 'CANCEL', 'NO_RESTOCK'],
                description: 'How to handle inventory (default: NO_RESTOCK)',
              },
            },
            required: ['lineItemId', 'quantity'],
          },
          description: 'Line items to refund',
        },
        shipping: {
          type: 'object',
          properties: {
            fullRefund: {
              type: 'boolean',
              description: 'Refund full shipping cost',
            },
            amount: {
              type: 'number',
              description: 'Specific shipping amount to refund',
            },
          },
          description: 'Shipping refund options',
        },
      },
      required: ['orderId'],
    },
    handler: createRefund,
  },
  {
    name: 'create_return',
    description: 'Create a return request for fulfilled items',
    inputSchema: {
      type: 'object',
      properties: {
        orderId: {
          type: 'string',
          description: 'Order ID to create return for',
        },
        returnLineItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              fulfillmentLineItemId: {
                type: 'string',
                description: 'Fulfillment line item ID',
              },
              quantity: {
                type: 'number',
                description: 'Quantity to return',
              },
              returnReason: {
                type: 'string',
                enum: ['COLOR', 'DEFECTIVE', 'NOT_AS_DESCRIBED', 'OTHER', 'SIZE_TOO_LARGE', 'SIZE_TOO_SMALL', 'STYLE', 'UNKNOWN', 'UNWANTED', 'WRONG_ITEM'],
                description: 'Reason for return',
              },
              returnReasonNote: {
                type: 'string',
                description: 'Additional note about the return reason',
              },
            },
            required: ['fulfillmentLineItemId', 'quantity'],
          },
          description: 'Items to return',
        },
        notifyCustomer: {
          type: 'boolean',
          description: 'Notify customer about the return (default: true)',
        },
      },
      required: ['orderId', 'returnLineItems'],
    },
    handler: createReturn,
  },
];
