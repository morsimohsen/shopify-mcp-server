import { getShopifyClient, ShopifyGraphQLClient } from '../clients/shopify-graphql.js';
import { LIST_ORDERS, GET_ORDER } from '../graphql/queries/orders.js';
import { CREATE_DRAFT_ORDER, COMPLETE_DRAFT_ORDER, UPDATE_ORDER, CANCEL_ORDER, ADD_ORDER_NOTE } from '../graphql/mutations/orders.js';
import { formatOrder } from '../utils/formatters.js';
import { successResult, errorResult, handleToolError, type ToolResult } from '../utils/error-handler.js';
import { connectionToResult } from '../utils/pagination.js';
import type {
  ListOrdersInput,
  GetOrderInput,
  CreateDraftOrderInput,
  CompleteDraftOrderInput,
  UpdateOrderInput,
  CancelOrderInput,
  AddOrderNoteInput,
} from '../types/tools.js';
import type { Order, Connection, DraftOrder } from '../types/shopify.js';

interface OrdersQueryResponse {
  orders: Connection<Order>;
}

interface OrderQueryResponse {
  order: Order | null;
}

interface DraftOrderMutationResponse {
  draftOrderCreate?: {
    draftOrder: DraftOrder;
    userErrors: Array<{ field: string[]; message: string }>;
  };
  draftOrderComplete?: {
    draftOrder: DraftOrder;
    userErrors: Array<{ field: string[]; message: string }>;
  };
}

interface OrderMutationResponse {
  orderUpdate?: {
    order: Order;
    userErrors: Array<{ field: string[]; message: string }>;
  };
  orderCancel?: {
    job: { id: string };
    orderCancelUserErrors: Array<{ field: string[]; message: string }>;
  };
}

export async function listOrders(input: ListOrdersInput): Promise<ToolResult> {
  try {
    const client = getShopifyClient();

    const response = await client.query<OrdersQueryResponse>(LIST_ORDERS, {
      first: input.first || 50,
      after: input.after,
      query: input.query,
      sortKey: input.sortKey,
      reverse: input.reverse ?? true,
    });

    const result = connectionToResult(response.orders);
    
    return successResult({
      orders: result.items.map(formatOrder),
      pageInfo: result.pageInfo,
      count: result.items.length,
    });
  } catch (error) {
    return handleToolError(error);
  }
}

export async function getOrder(input: GetOrderInput): Promise<ToolResult> {
  try {
    const client = getShopifyClient();
    const gid = ShopifyGraphQLClient.toGid('Order', input.id);

    const response = await client.query<OrderQueryResponse>(GET_ORDER, {
      id: gid,
    });

    if (!response.order) {
      return errorResult('NOT_FOUND', `Order with ID ${input.id} not found`);
    }

    return successResult({
      order: formatOrder(response.order),
    });
  } catch (error) {
    return handleToolError(error);
  }
}

export async function createDraftOrder(input: CreateDraftOrderInput): Promise<ToolResult> {
  try {
    const client = getShopifyClient();

    const draftOrderInput: Record<string, unknown> = {
      lineItems: input.lineItems.map((item) => ({
        variantId: item.variantId ? ShopifyGraphQLClient.toGid('ProductVariant', item.variantId) : undefined,
        title: item.title,
        quantity: item.quantity,
        originalUnitPrice: item.originalUnitPrice,
      })),
      email: input.email,
      note: input.note,
      tags: input.tags,
    };

    if (input.customerId) {
      draftOrderInput.customerId = ShopifyGraphQLClient.toGid('Customer', input.customerId);
    }

    if (input.shippingAddress) {
      draftOrderInput.shippingAddress = input.shippingAddress;
    }

    if (input.billingAddress) {
      draftOrderInput.billingAddress = input.billingAddress;
    }

    const result = await client.mutate<DraftOrderMutationResponse>(
      CREATE_DRAFT_ORDER,
      { input: draftOrderInput },
      'draftOrderCreate'
    );

    if (!result.success) {
      return errorResult('VALIDATION_ERROR', 'Failed to create draft order', {
        userErrors: result.userErrors,
      });
    }

    const draftOrder = result.data?.draftOrderCreate?.draftOrder;
    
    return successResult({
      message: 'Draft order created successfully',
      draftOrder: {
        id: draftOrder?.id ? ShopifyGraphQLClient.fromGid(draftOrder.id) : null,
        gid: draftOrder?.id,
        name: draftOrder?.name,
        status: draftOrder?.status,
        invoiceUrl: draftOrder?.invoiceUrl,
      },
    });
  } catch (error) {
    return handleToolError(error);
  }
}

export async function completeDraftOrder(input: CompleteDraftOrderInput): Promise<ToolResult> {
  try {
    const client = getShopifyClient();
    const gid = ShopifyGraphQLClient.toGid('DraftOrder', input.id);

    const result = await client.mutate<DraftOrderMutationResponse>(
      COMPLETE_DRAFT_ORDER,
      { id: gid, paymentPending: input.paymentPending },
      'draftOrderComplete'
    );

    if (!result.success) {
      return errorResult('VALIDATION_ERROR', 'Failed to complete draft order', {
        userErrors: result.userErrors,
      });
    }

    const draftOrder = result.data?.draftOrderComplete?.draftOrder;
    
    return successResult({
      message: 'Draft order completed successfully',
      draftOrder: {
        id: draftOrder?.id ? ShopifyGraphQLClient.fromGid(draftOrder.id) : null,
        status: draftOrder?.status,
      },
    });
  } catch (error) {
    return handleToolError(error);
  }
}

export async function updateOrder(input: UpdateOrderInput): Promise<ToolResult> {
  try {
    const client = getShopifyClient();
    const gid = ShopifyGraphQLClient.toGid('Order', input.id);

    const orderInput: Record<string, unknown> = {
      id: gid,
    };

    if (input.note !== undefined) orderInput.note = input.note;
    if (input.tags !== undefined) orderInput.tags = input.tags;
    if (input.email !== undefined) orderInput.email = input.email;
    if (input.shippingAddress !== undefined) orderInput.shippingAddress = input.shippingAddress;

    const result = await client.mutate<OrderMutationResponse>(
      UPDATE_ORDER,
      { input: orderInput },
      'orderUpdate'
    );

    if (!result.success) {
      return errorResult('VALIDATION_ERROR', 'Failed to update order', {
        userErrors: result.userErrors,
      });
    }

    return successResult({
      message: 'Order updated successfully',
      order: {
        id: input.id,
        note: result.data?.orderUpdate?.order?.note,
        tags: result.data?.orderUpdate?.order?.tags,
      },
    });
  } catch (error) {
    return handleToolError(error);
  }
}

export async function cancelOrder(input: CancelOrderInput): Promise<ToolResult> {
  try {
    const client = getShopifyClient();
    const gid = ShopifyGraphQLClient.toGid('Order', input.id);

    const result = await client.mutate<OrderMutationResponse>(
      CANCEL_ORDER,
      {
        orderId: gid,
        reason: input.reason,
        notifyCustomer: input.notifyCustomer,
        refund: input.refund,
        restock: input.restock,
      },
      'orderCancel'
    );

    if (!result.success) {
      return errorResult('VALIDATION_ERROR', 'Failed to cancel order', {
        userErrors: result.userErrors,
      });
    }

    return successResult({
      message: 'Order cancellation initiated',
      orderId: input.id,
    });
  } catch (error) {
    return handleToolError(error);
  }
}

export async function addOrderNote(input: AddOrderNoteInput): Promise<ToolResult> {
  try {
    const client = getShopifyClient();
    const gid = ShopifyGraphQLClient.toGid('Order', input.id);

    const result = await client.mutate<OrderMutationResponse>(
      ADD_ORDER_NOTE,
      { input: { id: gid, note: input.note } },
      'orderUpdate'
    );

    if (!result.success) {
      return errorResult('VALIDATION_ERROR', 'Failed to add order note', {
        userErrors: result.userErrors,
      });
    }

    return successResult({
      message: 'Note added to order',
      orderId: input.id,
      note: input.note,
    });
  } catch (error) {
    return handleToolError(error);
  }
}

// Export tool definitions for MCP registration
export const orderToolDefinitions = [
  {
    name: 'list_orders',
    description: 'List orders from the Shopify store with optional filtering and pagination',
    inputSchema: {
      type: 'object',
      properties: {
        first: {
          type: 'number',
          description: 'Number of orders to return (1-250, default: 50)',
        },
        after: {
          type: 'string',
          description: 'Cursor for pagination',
        },
        query: {
          type: 'string',
          description: 'Filter query (e.g., "fulfillment_status:unfulfilled", "financial_status:paid")',
        },
        sortKey: {
          type: 'string',
          enum: ['CREATED_AT', 'UPDATED_AT', 'PROCESSED_AT', 'TOTAL_PRICE', 'CUSTOMER_NAME', 'ORDER_NUMBER'],
          description: 'Sort field',
        },
        reverse: {
          type: 'boolean',
          description: 'Reverse sort order (default: true for most recent first)',
        },
      },
    },
    handler: listOrders,
  },
  {
    name: 'get_order',
    description: 'Get detailed information about a specific order including line items, customer, and fulfillments',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Order ID (numeric or GID format)',
        },
      },
      required: ['id'],
    },
    handler: getOrder,
  },
  {
    name: 'create_draft_order',
    description: 'Create a draft order that can be sent to customer or completed directly',
    inputSchema: {
      type: 'object',
      properties: {
        lineItems: {
          type: 'array',
          description: 'Line items for the order',
          items: {
            type: 'object',
            properties: {
              variantId: { type: 'string', description: 'Product variant ID' },
              title: { type: 'string', description: 'Custom line item title (if no variantId)' },
              quantity: { type: 'number' },
              originalUnitPrice: { type: 'string', description: 'Price for custom line items' },
            },
            required: ['quantity'],
          },
        },
        customerId: { type: 'string', description: 'Customer ID' },
        email: { type: 'string', description: 'Customer email' },
        note: { type: 'string', description: 'Order note' },
        tags: { type: 'array', items: { type: 'string' } },
        shippingAddress: {
          type: 'object',
          properties: {
            address1: { type: 'string' },
            address2: { type: 'string' },
            city: { type: 'string' },
            province: { type: 'string' },
            country: { type: 'string' },
            zip: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            phone: { type: 'string' },
          },
          required: ['address1', 'city', 'country', 'zip'],
        },
      },
      required: ['lineItems'],
    },
    handler: createDraftOrder,
  },
  {
    name: 'complete_draft_order',
    description: 'Complete a draft order and convert it to a regular order',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Draft order ID' },
        paymentPending: { type: 'boolean', description: 'Mark payment as pending (default: false)' },
      },
      required: ['id'],
    },
    handler: completeDraftOrder,
  },
  {
    name: 'update_order',
    description: 'Update order details (note, tags, email, shipping address)',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Order ID' },
        note: { type: 'string', description: 'New note' },
        tags: { type: 'array', items: { type: 'string' } },
        email: { type: 'string', description: 'New email' },
        shippingAddress: {
          type: 'object',
          properties: {
            address1: { type: 'string' },
            address2: { type: 'string' },
            city: { type: 'string' },
            province: { type: 'string' },
            country: { type: 'string' },
            zip: { type: 'string' },
          },
        },
      },
      required: ['id'],
    },
    handler: updateOrder,
  },
  {
    name: 'cancel_order',
    description: 'Cancel an order with optional refund and restock',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Order ID' },
        reason: {
          type: 'string',
          enum: ['CUSTOMER', 'DECLINED', 'FRAUD', 'INVENTORY', 'OTHER', 'STAFF'],
          description: 'Cancellation reason',
        },
        notifyCustomer: { type: 'boolean', description: 'Send cancellation email (default: true)' },
        refund: { type: 'boolean', description: 'Issue refund (default: false)' },
        restock: { type: 'boolean', description: 'Restock items (default: true)' },
      },
      required: ['id'],
    },
    handler: cancelOrder,
  },
  {
    name: 'add_order_note',
    description: 'Add or update an order note',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Order ID' },
        note: { type: 'string', description: 'Note text' },
      },
      required: ['id', 'note'],
    },
    handler: addOrderNote,
  },
];
