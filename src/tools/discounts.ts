import { getShopifyClient, ShopifyGraphQLClient } from '../clients/shopify-graphql.js';
import { LIST_DISCOUNTS, CREATE_BASIC_DISCOUNT, DELETE_DISCOUNT } from '../graphql/queries/discounts.js';
import { successResult, errorResult, handleToolError, type ToolResult } from '../utils/error-handler.js';
import type {
  ListDiscountsInput,
  CreateDiscountCodeInput,
  DeleteDiscountInput,
} from '../types/tools.js';

interface DiscountNode {
  id: string;
  discount: {
    title: string;
    status: string;
    startsAt: string;
    endsAt: string | null;
    usageLimit: number | null;
    asyncUsageCount: number;
    codes?: {
      edges: Array<{
        node: {
          code: string;
          usageCount: number;
        };
      }>;
    };
    summary: string;
  };
}

interface DiscountsQueryResponse {
  discountNodes: {
    edges: Array<{ cursor: string; node: DiscountNode }>;
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string | null;
      endCursor: string | null;
    };
  };
}

interface DiscountMutationResponse {
  discountCodeBasicCreate?: {
    codeDiscountNode: {
      id: string;
      codeDiscount: {
        title: string;
        status: string;
        startsAt: string;
        endsAt: string | null;
        codes: {
          edges: Array<{ node: { code: string } }>;
        };
        summary: string;
      };
    };
    userErrors: Array<{ field: string[]; message: string }>;
  };
  discountCodeDelete?: {
    deletedCodeDiscountId: string;
    userErrors: Array<{ field: string[]; message: string }>;
  };
}

export async function listDiscounts(input: ListDiscountsInput): Promise<ToolResult> {
  try {
    const client = getShopifyClient();

    const response = await client.query<DiscountsQueryResponse>(LIST_DISCOUNTS, {
      first: input.first || 50,
      after: input.after,
      query: input.query,
    });

    const discounts = response.discountNodes.edges.map((edge) => {
      const node = edge.node;
      const codes = node.discount.codes?.edges.map((e) => e.node) || [];
      
      return {
        id: ShopifyGraphQLClient.fromGid(node.id),
        gid: node.id,
        title: node.discount.title,
        status: node.discount.status,
        codes: codes.map((c) => c.code),
        usageCount: node.discount.asyncUsageCount,
        usageLimit: node.discount.usageLimit,
        startsAt: node.discount.startsAt,
        endsAt: node.discount.endsAt,
        summary: node.discount.summary,
      };
    });

    return successResult({
      discounts,
      pageInfo: response.discountNodes.pageInfo,
      count: discounts.length,
    });
  } catch (error) {
    return handleToolError(error);
  }
}

export async function createDiscountCode(input: CreateDiscountCodeInput): Promise<ToolResult> {
  try {
    const client = getShopifyClient();

    const discountInput: Record<string, unknown> = {
      title: input.title,
      code: input.code,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      usageLimit: input.usageLimit,
      appliesOncePerCustomer: input.appliesOncePerCustomer ?? true,
      customerSelection: {
        all: true,
      },
      customerGets: {
        items: {
          all: true,
        },
        value: input.discountType === 'PERCENTAGE' 
          ? { percentage: input.discountValue / 100 }
          : { discountAmount: { amount: input.discountValue, appliesOnEachItem: false } },
      },
    };

    if (input.minimumRequirement) {
      if (input.minimumRequirement.type === 'SUBTOTAL') {
        discountInput.minimumRequirement = {
          subtotal: { greaterThanOrEqualToSubtotal: input.minimumRequirement.value },
        };
      } else {
        discountInput.minimumRequirement = {
          quantity: { greaterThanOrEqualToQuantity: input.minimumRequirement.value },
        };
      }
    }

    const result = await client.mutate<DiscountMutationResponse>(
      CREATE_BASIC_DISCOUNT,
      { basicCodeDiscount: discountInput },
      'discountCodeBasicCreate'
    );

    if (!result.success) {
      return errorResult('VALIDATION_ERROR', 'Failed to create discount', {
        userErrors: result.userErrors,
      });
    }

    const discount = result.data?.discountCodeBasicCreate?.codeDiscountNode;
    
    return successResult({
      message: 'Discount code created successfully',
      discount: {
        id: discount?.id ? ShopifyGraphQLClient.fromGid(discount.id) : null,
        gid: discount?.id,
        title: discount?.codeDiscount.title,
        code: discount?.codeDiscount.codes.edges[0]?.node.code,
        status: discount?.codeDiscount.status,
        summary: discount?.codeDiscount.summary,
      },
    });
  } catch (error) {
    return handleToolError(error);
  }
}

export async function deleteDiscount(input: DeleteDiscountInput): Promise<ToolResult> {
  try {
    const client = getShopifyClient();
    const gid = ShopifyGraphQLClient.toGid('DiscountCodeNode', input.id);

    const result = await client.mutate<DiscountMutationResponse>(
      DELETE_DISCOUNT,
      { id: gid },
      'discountCodeDelete'
    );

    if (!result.success) {
      return errorResult('VALIDATION_ERROR', 'Failed to delete discount', {
        userErrors: result.userErrors,
      });
    }

    return successResult({
      message: 'Discount deleted successfully',
      deletedDiscountId: input.id,
    });
  } catch (error) {
    return handleToolError(error);
  }
}

// Export tool definitions for MCP registration
export const discountToolDefinitions = [
  {
    name: 'list_discounts',
    description: 'List discount codes from the Shopify store',
    inputSchema: {
      type: 'object',
      properties: {
        first: {
          type: 'number',
          description: 'Number of discounts to return (1-250, default: 50)',
        },
        after: {
          type: 'string',
          description: 'Cursor for pagination',
        },
        query: {
          type: 'string',
          description: 'Search query to filter discounts',
        },
      },
    },
    handler: listDiscounts,
  },
  {
    name: 'create_discount_code',
    description: 'Create a new discount code',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Internal title for the discount',
        },
        code: {
          type: 'string',
          description: 'Discount code customers will enter',
        },
        startsAt: {
          type: 'string',
          description: 'Start date (ISO 8601 format)',
        },
        endsAt: {
          type: 'string',
          description: 'End date (ISO 8601 format, optional)',
        },
        usageLimit: {
          type: 'number',
          description: 'Maximum number of times discount can be used',
        },
        appliesOncePerCustomer: {
          type: 'boolean',
          description: 'Limit to one use per customer (default: true)',
        },
        discountType: {
          type: 'string',
          enum: ['PERCENTAGE', 'FIXED_AMOUNT'],
          description: 'Type of discount',
        },
        discountValue: {
          type: 'number',
          description: 'Discount value (percentage as whole number, e.g., 10 for 10%)',
        },
        minimumRequirement: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['SUBTOTAL', 'QUANTITY'],
            },
            value: {
              type: 'number',
              description: 'Minimum subtotal or quantity',
            },
          },
        },
      },
      required: ['title', 'code', 'startsAt', 'discountType', 'discountValue'],
    },
    handler: createDiscountCode,
  },
  {
    name: 'delete_discount',
    description: 'Delete a discount code',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Discount ID',
        },
      },
      required: ['id'],
    },
    handler: deleteDiscount,
  },
];
