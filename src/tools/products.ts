import { getShopifyClient, ShopifyGraphQLClient } from '../clients/shopify-graphql.js';
import { LIST_PRODUCTS, GET_PRODUCT, SEARCH_PRODUCTS } from '../graphql/queries/products.js';
import { CREATE_PRODUCT, UPDATE_PRODUCT, DELETE_PRODUCT, UPDATE_PRODUCT_VARIANT } from '../graphql/mutations/products.js';
import { formatProduct } from '../utils/formatters.js';
import { successResult, errorResult, handleToolError, type ToolResult } from '../utils/error-handler.js';
import { connectionToResult } from '../utils/pagination.js';
import type {
  ListProductsInput,
  GetProductInput,
  SearchProductsInput,
  CreateProductInput,
  UpdateProductInput,
  DeleteProductInput,
  UpdateProductVariantInput,
} from '../types/tools.js';
import type { Product, Connection } from '../types/shopify.js';

interface ProductsQueryResponse {
  products: Connection<Product>;
}

interface ProductQueryResponse {
  product: Product | null;
}

interface ProductMutationResponse {
  productCreate?: {
    product: Product;
    userErrors: Array<{ field: string[]; message: string }>;
  };
  productUpdate?: {
    product: Product;
    userErrors: Array<{ field: string[]; message: string }>;
  };
  productDelete?: {
    deletedProductId: string;
    userErrors: Array<{ field: string[]; message: string }>;
  };
  productVariantUpdate?: {
    productVariant: unknown;
    userErrors: Array<{ field: string[]; message: string }>;
  };
}

export async function listProducts(input: ListProductsInput): Promise<ToolResult> {
  try {
    const client = getShopifyClient();
    
    let query = input.query || '';
    if (input.status) {
      query = query ? `${query} AND status:${input.status}` : `status:${input.status}`;
    }

    const response = await client.query<ProductsQueryResponse>(LIST_PRODUCTS, {
      first: input.first || 50,
      after: input.after,
      query: query || undefined,
      sortKey: input.sortKey,
      reverse: input.reverse,
    });

    const result = connectionToResult(response.products);
    
    return successResult({
      products: result.items.map(formatProduct),
      pageInfo: result.pageInfo,
      count: result.items.length,
    });
  } catch (error) {
    return handleToolError(error);
  }
}

export async function getProduct(input: GetProductInput): Promise<ToolResult> {
  try {
    const client = getShopifyClient();
    const gid = ShopifyGraphQLClient.toGid('Product', input.id);

    const response = await client.query<ProductQueryResponse>(GET_PRODUCT, {
      id: gid,
    });

    if (!response.product) {
      return errorResult('NOT_FOUND', `Product with ID ${input.id} not found`);
    }

    return successResult({
      product: formatProduct(response.product),
    });
  } catch (error) {
    return handleToolError(error);
  }
}

export async function searchProducts(input: SearchProductsInput): Promise<ToolResult> {
  try {
    const client = getShopifyClient();

    const response = await client.query<ProductsQueryResponse>(SEARCH_PRODUCTS, {
      query: input.query,
      first: input.first || 20,
    });

    const result = connectionToResult(response.products);
    
    return successResult({
      products: result.items.map(formatProduct),
      count: result.items.length,
      pageInfo: result.pageInfo,
    });
  } catch (error) {
    return handleToolError(error);
  }
}

export async function createProduct(input: CreateProductInput): Promise<ToolResult> {
  try {
    const client = getShopifyClient();

    const productInput: Record<string, unknown> = {
      title: input.title,
      descriptionHtml: input.descriptionHtml,
      vendor: input.vendor,
      productType: input.productType,
      tags: input.tags,
      status: input.status,
    };

    if (input.variants && input.variants.length > 0) {
      productInput.variants = input.variants.map((v) => ({
        price: v.price,
        sku: v.sku,
        barcode: v.barcode,
        compareAtPrice: v.compareAtPrice,
        options: v.options,
      }));
    }

    if (input.options && input.options.length > 0) {
      productInput.options = input.options;
    }

    const result = await client.mutate<ProductMutationResponse>(
      CREATE_PRODUCT,
      { input: productInput },
      'productCreate'
    );

    if (!result.success) {
      return errorResult('VALIDATION_ERROR', 'Failed to create product', {
        userErrors: result.userErrors,
      });
    }

    const product = result.data?.productCreate?.product;
    if (!product) {
      return errorResult('API_ERROR', 'Product was not created');
    }

    return successResult({
      message: 'Product created successfully',
      product: formatProduct(product),
    });
  } catch (error) {
    return handleToolError(error);
  }
}

export async function updateProduct(input: UpdateProductInput): Promise<ToolResult> {
  try {
    const client = getShopifyClient();
    const gid = ShopifyGraphQLClient.toGid('Product', input.id);

    const productInput: Record<string, unknown> = {
      id: gid,
    };

    if (input.title !== undefined) productInput.title = input.title;
    if (input.descriptionHtml !== undefined) productInput.descriptionHtml = input.descriptionHtml;
    if (input.vendor !== undefined) productInput.vendor = input.vendor;
    if (input.productType !== undefined) productInput.productType = input.productType;
    if (input.tags !== undefined) productInput.tags = input.tags;
    if (input.status !== undefined) productInput.status = input.status;

    const result = await client.mutate<ProductMutationResponse>(
      UPDATE_PRODUCT,
      { input: productInput },
      'productUpdate'
    );

    if (!result.success) {
      return errorResult('VALIDATION_ERROR', 'Failed to update product', {
        userErrors: result.userErrors,
      });
    }

    const product = result.data?.productUpdate?.product;
    if (!product) {
      return errorResult('API_ERROR', 'Product was not updated');
    }

    return successResult({
      message: 'Product updated successfully',
      product: formatProduct(product),
    });
  } catch (error) {
    return handleToolError(error);
  }
}

export async function deleteProduct(input: DeleteProductInput): Promise<ToolResult> {
  try {
    const client = getShopifyClient();
    const gid = ShopifyGraphQLClient.toGid('Product', input.id);

    const result = await client.mutate<ProductMutationResponse>(
      DELETE_PRODUCT,
      { input: { id: gid } },
      'productDelete'
    );

    if (!result.success) {
      return errorResult('VALIDATION_ERROR', 'Failed to delete product', {
        userErrors: result.userErrors,
      });
    }

    return successResult({
      message: 'Product deleted successfully',
      deletedProductId: input.id,
    });
  } catch (error) {
    return handleToolError(error);
  }
}

export async function updateProductVariant(input: UpdateProductVariantInput): Promise<ToolResult> {
  try {
    const client = getShopifyClient();
    const gid = ShopifyGraphQLClient.toGid('ProductVariant', input.id);

    const variantInput: Record<string, unknown> = {
      id: gid,
    };

    if (input.price !== undefined) variantInput.price = input.price;
    if (input.compareAtPrice !== undefined) variantInput.compareAtPrice = input.compareAtPrice;
    if (input.sku !== undefined) variantInput.sku = input.sku;
    if (input.barcode !== undefined) variantInput.barcode = input.barcode;
    if (input.weight !== undefined) variantInput.weight = input.weight;
    if (input.weightUnit !== undefined) variantInput.weightUnit = input.weightUnit;

    const result = await client.mutate<ProductMutationResponse>(
      UPDATE_PRODUCT_VARIANT,
      { input: variantInput },
      'productVariantUpdate'
    );

    if (!result.success) {
      return errorResult('VALIDATION_ERROR', 'Failed to update variant', {
        userErrors: result.userErrors,
      });
    }

    return successResult({
      message: 'Product variant updated successfully',
      variant: result.data?.productVariantUpdate?.productVariant,
    });
  } catch (error) {
    return handleToolError(error);
  }
}

// Export tool definitions for MCP registration
export const productToolDefinitions = [
  {
    name: 'list_products',
    description: 'List products from the Shopify store with optional filtering and pagination',
    inputSchema: {
      type: 'object',
      properties: {
        first: {
          type: 'number',
          description: 'Number of products to return (1-250, default: 50)',
        },
        after: {
          type: 'string',
          description: 'Cursor for pagination',
        },
        query: {
          type: 'string',
          description: 'Search query to filter products (e.g., "title:shirt", "vendor:Nike")',
        },
        status: {
          type: 'string',
          enum: ['ACTIVE', 'ARCHIVED', 'DRAFT'],
          description: 'Filter by product status',
        },
        sortKey: {
          type: 'string',
          enum: ['TITLE', 'CREATED_AT', 'UPDATED_AT', 'INVENTORY_TOTAL', 'PRODUCT_TYPE', 'VENDOR'],
          description: 'Sort field',
        },
        reverse: {
          type: 'boolean',
          description: 'Reverse sort order',
        },
      },
    },
    handler: listProducts,
  },
  {
    name: 'get_product',
    description: 'Get detailed information about a specific product including variants and images',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Product ID (numeric or GID format)',
        },
      },
      required: ['id'],
    },
    handler: getProduct,
  },
  {
    name: 'search_products',
    description: 'Search for products by keyword',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query',
        },
        first: {
          type: 'number',
          description: 'Number of results to return (default: 20)',
        },
      },
      required: ['query'],
    },
    handler: searchProducts,
  },
  {
    name: 'create_product',
    description: 'Create a new product in the Shopify store',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Product title',
        },
        descriptionHtml: {
          type: 'string',
          description: 'Product description (HTML)',
        },
        vendor: {
          type: 'string',
          description: 'Product vendor',
        },
        productType: {
          type: 'string',
          description: 'Product type',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Product tags',
        },
        status: {
          type: 'string',
          enum: ['ACTIVE', 'ARCHIVED', 'DRAFT'],
          description: 'Product status (default: DRAFT)',
        },
        variants: {
          type: 'array',
          description: 'Product variants',
          items: {
            type: 'object',
            properties: {
              price: { type: 'string' },
              sku: { type: 'string' },
              barcode: { type: 'string' },
              compareAtPrice: { type: 'string' },
              options: { type: 'array', items: { type: 'string' } },
            },
            required: ['price'],
          },
        },
        options: {
          type: 'array',
          items: { type: 'string' },
          description: 'Product options (e.g., ["Size", "Color"])',
        },
      },
      required: ['title'],
    },
    handler: createProduct,
  },
  {
    name: 'update_product',
    description: 'Update an existing product',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Product ID to update',
        },
        title: {
          type: 'string',
          description: 'New title',
        },
        descriptionHtml: {
          type: 'string',
          description: 'New description (HTML)',
        },
        vendor: {
          type: 'string',
          description: 'New vendor',
        },
        productType: {
          type: 'string',
          description: 'New product type',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'New tags (replaces existing)',
        },
        status: {
          type: 'string',
          enum: ['ACTIVE', 'ARCHIVED', 'DRAFT'],
          description: 'New status',
        },
      },
      required: ['id'],
    },
    handler: updateProduct,
  },
  {
    name: 'delete_product',
    description: 'Delete a product from the store',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Product ID to delete',
        },
      },
      required: ['id'],
    },
    handler: deleteProduct,
  },
  {
    name: 'update_product_variant',
    description: 'Update a product variant (price, SKU, inventory, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Variant ID to update',
        },
        price: {
          type: 'string',
          description: 'New price',
        },
        compareAtPrice: {
          type: 'string',
          description: 'Compare at price',
        },
        sku: {
          type: 'string',
          description: 'New SKU',
        },
        barcode: {
          type: 'string',
          description: 'New barcode',
        },
        weight: {
          type: 'number',
          description: 'Weight value',
        },
        weightUnit: {
          type: 'string',
          enum: ['KILOGRAMS', 'GRAMS', 'POUNDS', 'OUNCES'],
          description: 'Weight unit',
        },
      },
      required: ['id'],
    },
    handler: updateProductVariant,
  },
];
