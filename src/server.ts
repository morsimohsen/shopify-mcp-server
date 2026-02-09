import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { allToolDefinitions, toolHandlerMap } from './tools/index.js';
import { initializeShopifyClient } from './clients/shopify-graphql.js';

// Create MCP server
const server = new Server(
  {
    name: 'shopify-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle list_tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: allToolDefinitions.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  };
});

// Handle call_tool request
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const handler = toolHandlerMap.get(name);

  if (!handler) {
    throw new McpError(
      ErrorCode.MethodNotFound,
      `Unknown tool: ${name}`
    );
  }

  try {
    const result = await handler(args || {});

    if (result.success) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result.data, null, 2),
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: result.error,
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              error: {
                code: 'TOOL_EXECUTION_ERROR',
                message: errorMessage,
              },
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
});

// Validate environment variables
function validateEnvironment(): void {
  const required = ['SHOPIFY_STORE_URL', 'SHOPIFY_ACCESS_TOKEN'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    console.error('Please set these environment variables:');
    console.error('  SHOPIFY_STORE_URL - Your Shopify store URL (e.g., your-store.myshopify.com)');
    console.error('  SHOPIFY_ACCESS_TOKEN - Your Shopify Admin API access token');
    console.error('  SHOPIFY_API_VERSION - (Optional) API version (default: 2025-01)');
    process.exit(1);
  }
}

// Start the server
export async function startServer(): Promise<void> {
  // Validate environment
  validateEnvironment();

  // Initialize Shopify client
  initializeShopifyClient({
    storeUrl: process.env.SHOPIFY_STORE_URL!,
    accessToken: process.env.SHOPIFY_ACCESS_TOKEN!,
    apiVersion: process.env.SHOPIFY_API_VERSION || '2025-01',
  });

  // Connect to stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Shopify MCP Server started');
  console.error(`Loaded ${allToolDefinitions.length} tools`);
}

// Export server for testing
export { server };
