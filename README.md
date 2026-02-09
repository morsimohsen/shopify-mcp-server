# Shopify MCP Server

A comprehensive Model Context Protocol (MCP) server for Shopify, providing 36 tools across 9 categories to manage your Shopify store through AI assistants like Claude.

## Features

- **GraphQL-First**: Uses Shopify's Admin GraphQL API (version 2025-01) for efficient data fetching
- **Comprehensive Coverage**: 36 tools covering products, orders, customers, inventory, collections, discounts, fulfillments, refunds, and shop management
- **Type-Safe**: Built with TypeScript and Zod for runtime validation
- **Error Handling**: Robust error handling with detailed error messages
- **Pagination Support**: Built-in cursor-based pagination for list operations

## Tool Categories

### Products (7 tools)
- `list_products` - List products with filtering and pagination
- `get_product` - Get detailed product information
- `search_products` - Search products by title, vendor, or other fields
- `create_product` - Create a new product
- `update_product` - Update existing product details
- `delete_product` - Delete a product
- `update_product_variant` - Update variant price, inventory, etc.

### Orders (7 tools)
- `list_orders` - List orders with filtering and pagination
- `get_order` - Get detailed order information
- `create_draft_order` - Create a draft order
- `complete_draft_order` - Convert draft to regular order
- `update_order` - Update order details (notes, tags, etc.)
- `cancel_order` - Cancel an order
- `add_order_note` - Add a note to an order

### Customers (5 tools)
- `list_customers` - List customers with pagination
- `get_customer` - Get detailed customer information
- `search_customers` - Search customers by email, name, etc.
- `create_customer` - Create a new customer
- `update_customer` - Update customer details

### Inventory (4 tools)
- `get_inventory_levels` - Get inventory levels for a location
- `get_inventory_item` - Get inventory item details
- `adjust_inventory` - Adjust inventory quantity (add/subtract)
- `set_inventory` - Set absolute inventory quantity

### Collections (4 tools)
- `list_collections` - List collections (custom and smart)
- `get_collection` - Get collection details with products
- `create_collection` - Create a new collection
- `add_products_to_collection` - Add products to a collection

### Discounts (3 tools)
- `list_discounts` - List discount codes
- `create_discount_code` - Create a percentage or fixed amount discount
- `delete_discount` - Delete a discount code

### Fulfillments (3 tools)
- `create_fulfillment` - Fulfill order items (mark as shipped)
- `update_tracking` - Update tracking information
- `cancel_fulfillment` - Cancel a fulfillment

### Returns & Refunds (4 tools)
- `list_refunds` - List refunds for an order
- `calculate_refund` - Calculate refund amount before processing
- `create_refund` - Process a refund
- `create_return` - Create a return request

### Shop (2 tools)
- `get_shop_info` - Get store details (name, plan, settings)
- `get_locations` - List store locations for fulfillment

## Installation

```bash
# Clone the repository
git clone https://github.com/morsimohsen/shopify-mcp-server.git
cd shopify-mcp-server

# Install dependencies
npm install

# Build the project
npm run build
```

## Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` with your Shopify credentials:
```
SHOPIFY_STORE_URL=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SHOPIFY_API_VERSION=2025-01
```

### Getting Your Access Token

1. Go to your Shopify Admin
2. Navigate to **Settings** > **Apps and sales channels** > **Develop apps**
3. Click **Create an app**
4. Configure Admin API scopes (recommended: full read/write access for all resources)
5. Install the app to get your access token

### Required API Scopes

For full functionality, enable these Admin API scopes:
- `read_products`, `write_products`
- `read_orders`, `write_orders`
- `read_customers`, `write_customers`
- `read_inventory`, `write_inventory`
- `read_discounts`, `write_discounts`
- `read_fulfillments`, `write_fulfillments`
- `read_returns`, `write_returns`
- `read_shipping`, `write_shipping`
- `read_locations`

## Usage

### With Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "shopify": {
      "command": "node",
      "args": ["/path/to/shopify-mcp-server/dist/index.js"],
      "env": {
        "SHOPIFY_STORE_URL": "your-store.myshopify.com",
        "SHOPIFY_ACCESS_TOKEN": "shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      }
    }
  }
}
```
```json
{
  "mcpServers": {
    "shopify": {
      "command": "npx",
          "args": ["@morsimohsen/shopify-mcp-server"],
          "env": {
            "SHOPIFY_STORE_URL": "your-store.myshopify.com",
            "SHOPIFY_ACCESS_TOKEN": "shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          }
    }
  }
}
```
### With VS Code Copilot

Add to your VS Code settings or `.vscode/mcp.json`:

```json
{
  "servers": {
    "shopify": {
      "command": "node",
      "args": ["${workspaceFolder}/dist/index.js"],
      "env": {
        "SHOPIFY_STORE_URL": "your-store.myshopify.com",
        "SHOPIFY_ACCESS_TOKEN": "shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

### Direct Execution

```bash
# With environment variables
SHOPIFY_STORE_URL=your-store.myshopify.com \
SHOPIFY_ACCESS_TOKEN=shpat_xxx \
npm start
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode (with watch)
npm run dev

# Build for production
npm run build

# Type check
npm run typecheck

# Lint
npm run lint
```

## Example Prompts

Once connected to an AI assistant, you can use natural language:

- "Show me our best selling products"
- "List all orders from today"
- "Create a 20% discount code for summer sale"
- "What's the current inventory for SKU ABC123?"
- "Fulfill order #1234 with tracking number XYZ"
- "Process a refund for order #1234"
- "Search for customers with gmail.com emails"
- "Create a new product called 'Summer T-Shirt' priced at $29.99"

## Architecture

```
src/
├── index.ts              # Entry point
├── server.ts             # MCP server setup
├── clients/
│   └── shopify-graphql.ts # GraphQL client wrapper
├── graphql/
│   ├── queries/          # GraphQL query definitions
│   └── mutations/        # GraphQL mutation definitions
├── tools/
│   ├── index.ts          # Tool registry
│   ├── products.ts       # Product tools
│   ├── orders.ts         # Order tools
│   ├── customers.ts      # Customer tools
│   ├── inventory.ts      # Inventory tools
│   ├── collections.ts    # Collection tools
│   ├── discounts.ts      # Discount tools
│   ├── fulfillments.ts   # Fulfillment tools
│   ├── refunds.ts        # Refund tools
│   └── shop.ts           # Shop tools
├── types/
│   ├── shopify.ts        # Shopify GraphQL types
│   └── tools.ts          # Tool input schemas (Zod)
└── utils/
    ├── error-handler.ts  # Error handling utilities
    ├── pagination.ts     # Pagination helpers
    └── formatters.ts     # Response formatters
```

## License

MIT

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our repository.
