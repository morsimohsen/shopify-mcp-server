import { getShopifyClient, ShopifyGraphQLClient } from '../clients/shopify-graphql.js';
import { LIST_CUSTOMERS, GET_CUSTOMER, SEARCH_CUSTOMERS } from '../graphql/queries/customers.js';
import { CREATE_CUSTOMER, UPDATE_CUSTOMER } from '../graphql/mutations/customers.js';
import { formatCustomer } from '../utils/formatters.js';
import { successResult, errorResult, handleToolError, type ToolResult } from '../utils/error-handler.js';
import { connectionToResult } from '../utils/pagination.js';
import type {
  ListCustomersInput,
  GetCustomerInput,
  SearchCustomersInput,
  CreateCustomerInput,
  UpdateCustomerInput,
} from '../types/tools.js';
import type { Customer, Connection } from '../types/shopify.js';

interface CustomersQueryResponse {
  customers: Connection<Customer>;
}

interface CustomerQueryResponse {
  customer: Customer | null;
}

interface CustomerMutationResponse {
  customerCreate?: {
    customer: Customer;
    userErrors: Array<{ field: string[]; message: string }>;
  };
  customerUpdate?: {
    customer: Customer;
    userErrors: Array<{ field: string[]; message: string }>;
  };
}

export async function listCustomers(input: ListCustomersInput): Promise<ToolResult> {
  try {
    const client = getShopifyClient();

    const response = await client.query<CustomersQueryResponse>(LIST_CUSTOMERS, {
      first: input.first || 50,
      after: input.after,
      query: input.query,
      sortKey: input.sortKey,
      reverse: input.reverse,
    });

    const result = connectionToResult(response.customers);
    
    return successResult({
      customers: result.items.map(formatCustomer),
      pageInfo: result.pageInfo,
      count: result.items.length,
    });
  } catch (error) {
    return handleToolError(error);
  }
}

export async function getCustomer(input: GetCustomerInput): Promise<ToolResult> {
  try {
    const client = getShopifyClient();
    const gid = ShopifyGraphQLClient.toGid('Customer', input.id);

    const response = await client.query<CustomerQueryResponse>(GET_CUSTOMER, {
      id: gid,
      includeOrders: input.includeOrders ?? false,
      ordersFirst: input.ordersFirst ?? 10,
    });

    if (!response.customer) {
      return errorResult('NOT_FOUND', `Customer with ID ${input.id} not found`);
    }

    return successResult({
      customer: formatCustomer(response.customer),
    });
  } catch (error) {
    return handleToolError(error);
  }
}

export async function searchCustomers(input: SearchCustomersInput): Promise<ToolResult> {
  try {
    const client = getShopifyClient();

    const response = await client.query<CustomersQueryResponse>(SEARCH_CUSTOMERS, {
      query: input.query,
      first: input.first || 20,
    });

    const result = connectionToResult(response.customers);
    
    return successResult({
      customers: result.items.map(formatCustomer),
      count: result.items.length,
      pageInfo: result.pageInfo,
    });
  } catch (error) {
    return handleToolError(error);
  }
}

export async function createCustomer(input: CreateCustomerInput): Promise<ToolResult> {
  try {
    const client = getShopifyClient();

    const customerInput: Record<string, unknown> = {
      email: input.email,
      phone: input.phone,
      firstName: input.firstName,
      lastName: input.lastName,
      note: input.note,
      tags: input.tags,
    };

    if (input.addresses && input.addresses.length > 0) {
      customerInput.addresses = input.addresses;
    }

    if (input.emailMarketingConsent) {
      customerInput.emailMarketingConsent = input.emailMarketingConsent;
    }

    const result = await client.mutate<CustomerMutationResponse>(
      CREATE_CUSTOMER,
      { input: customerInput },
      'customerCreate'
    );

    if (!result.success) {
      return errorResult('VALIDATION_ERROR', 'Failed to create customer', {
        userErrors: result.userErrors,
      });
    }

    const customer = result.data?.customerCreate?.customer;
    if (!customer) {
      return errorResult('API_ERROR', 'Customer was not created');
    }

    return successResult({
      message: 'Customer created successfully',
      customer: formatCustomer(customer),
    });
  } catch (error) {
    return handleToolError(error);
  }
}

export async function updateCustomer(input: UpdateCustomerInput): Promise<ToolResult> {
  try {
    const client = getShopifyClient();
    const gid = ShopifyGraphQLClient.toGid('Customer', input.id);

    const customerInput: Record<string, unknown> = {
      id: gid,
    };

    if (input.email !== undefined) customerInput.email = input.email;
    if (input.phone !== undefined) customerInput.phone = input.phone;
    if (input.firstName !== undefined) customerInput.firstName = input.firstName;
    if (input.lastName !== undefined) customerInput.lastName = input.lastName;
    if (input.note !== undefined) customerInput.note = input.note;
    if (input.tags !== undefined) customerInput.tags = input.tags;

    const result = await client.mutate<CustomerMutationResponse>(
      UPDATE_CUSTOMER,
      { input: customerInput },
      'customerUpdate'
    );

    if (!result.success) {
      return errorResult('VALIDATION_ERROR', 'Failed to update customer', {
        userErrors: result.userErrors,
      });
    }

    const customer = result.data?.customerUpdate?.customer;
    if (!customer) {
      return errorResult('API_ERROR', 'Customer was not updated');
    }

    return successResult({
      message: 'Customer updated successfully',
      customer: formatCustomer(customer),
    });
  } catch (error) {
    return handleToolError(error);
  }
}

// Export tool definitions for MCP registration
export const customerToolDefinitions = [
  {
    name: 'list_customers',
    description: 'List customers from the Shopify store with optional filtering and pagination',
    inputSchema: {
      type: 'object',
      properties: {
        first: {
          type: 'number',
          description: 'Number of customers to return (1-250, default: 50)',
        },
        after: {
          type: 'string',
          description: 'Cursor for pagination',
        },
        query: {
          type: 'string',
          description: 'Search query to filter customers',
        },
        sortKey: {
          type: 'string',
          enum: ['CREATED_AT', 'UPDATED_AT', 'NAME', 'LOCATION', 'ORDERS_COUNT', 'TOTAL_SPENT'],
          description: 'Sort field',
        },
        reverse: {
          type: 'boolean',
          description: 'Reverse sort order',
        },
      },
    },
    handler: listCustomers,
  },
  {
    name: 'get_customer',
    description: 'Get detailed information about a specific customer',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Customer ID (numeric or GID format)',
        },
        includeOrders: {
          type: 'boolean',
          description: 'Include customer orders (default: false)',
        },
        ordersFirst: {
          type: 'number',
          description: 'Number of orders to include (default: 10)',
        },
      },
      required: ['id'],
    },
    handler: getCustomer,
  },
  {
    name: 'search_customers',
    description: 'Search for customers by email, name, or phone',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (email, name, or phone)',
        },
        first: {
          type: 'number',
          description: 'Number of results to return (default: 20)',
        },
      },
      required: ['query'],
    },
    handler: searchCustomers,
  },
  {
    name: 'create_customer',
    description: 'Create a new customer',
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string', description: 'Customer email' },
        phone: { type: 'string', description: 'Customer phone' },
        firstName: { type: 'string', description: 'First name' },
        lastName: { type: 'string', description: 'Last name' },
        note: { type: 'string', description: 'Internal note' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Customer tags' },
        addresses: {
          type: 'array',
          description: 'Customer addresses',
          items: {
            type: 'object',
            properties: {
              address1: { type: 'string' },
              address2: { type: 'string' },
              city: { type: 'string' },
              province: { type: 'string' },
              country: { type: 'string' },
              zip: { type: 'string' },
              phone: { type: 'string' },
              firstName: { type: 'string' },
              lastName: { type: 'string' },
            },
            required: ['address1', 'city', 'country', 'zip'],
          },
        },
        emailMarketingConsent: {
          type: 'object',
          properties: {
            marketingState: {
              type: 'string',
              enum: ['NOT_SUBSCRIBED', 'PENDING', 'SUBSCRIBED', 'UNSUBSCRIBED'],
            },
            marketingOptInLevel: {
              type: 'string',
              enum: ['SINGLE_OPT_IN', 'CONFIRMED_OPT_IN', 'UNKNOWN'],
            },
          },
        },
      },
    },
    handler: createCustomer,
  },
  {
    name: 'update_customer',
    description: 'Update an existing customer',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Customer ID' },
        email: { type: 'string', description: 'New email' },
        phone: { type: 'string', description: 'New phone' },
        firstName: { type: 'string', description: 'New first name' },
        lastName: { type: 'string', description: 'New last name' },
        note: { type: 'string', description: 'New note' },
        tags: { type: 'array', items: { type: 'string' }, description: 'New tags' },
      },
      required: ['id'],
    },
    handler: updateCustomer,
  },
];
