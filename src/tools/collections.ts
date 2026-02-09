import { getShopifyClient, ShopifyGraphQLClient } from '../clients/shopify-graphql.js';
import { LIST_COLLECTIONS, GET_COLLECTION } from '../graphql/queries/collections.js';
import { CREATE_COLLECTION, ADD_PRODUCTS_TO_COLLECTION } from '../graphql/mutations/collections.js';
import { formatCollection } from '../utils/formatters.js';
import { successResult, errorResult, handleToolError, type ToolResult } from '../utils/error-handler.js';
import { connectionToResult } from '../utils/pagination.js';
import type {
  ListCollectionsInput,
  GetCollectionInput,
  CreateCollectionInput,
  AddProductsToCollectionInput,
} from '../types/tools.js';
import type { Collection, Connection } from '../types/shopify.js';

interface CollectionsQueryResponse {
  collections: Connection<Collection>;
}

interface CollectionQueryResponse {
  collection: Collection | null;
}

interface CollectionMutationResponse {
  collectionCreate?: {
    collection: Collection;
    userErrors: Array<{ field: string[]; message: string }>;
  };
  collectionAddProducts?: {
    collection: { id: string; title: string; productsCount: { count: number } };
    userErrors: Array<{ field: string[]; message: string }>;
  };
}

export async function listCollections(input: ListCollectionsInput): Promise<ToolResult> {
  try {
    const client = getShopifyClient();

    const response = await client.query<CollectionsQueryResponse>(LIST_COLLECTIONS, {
      first: input.first || 50,
      after: input.after,
      query: input.query,
    });

    const result = connectionToResult(response.collections);
    
    return successResult({
      collections: result.items.map(formatCollection),
      pageInfo: result.pageInfo,
      count: result.items.length,
    });
  } catch (error) {
    return handleToolError(error);
  }
}

export async function getCollection(input: GetCollectionInput): Promise<ToolResult> {
  try {
    const client = getShopifyClient();
    const gid = ShopifyGraphQLClient.toGid('Collection', input.id);

    const response = await client.query<CollectionQueryResponse>(GET_COLLECTION, {
      id: gid,
      productsFirst: input.productsFirst || 20,
    });

    if (!response.collection) {
      return errorResult('NOT_FOUND', `Collection with ID ${input.id} not found`);
    }

    const collection = formatCollection(response.collection);
    
    // Add products if included
    if (input.includeProducts !== false && response.collection.products) {
      const products = response.collection.products.edges.map((edge) => ({
        id: ShopifyGraphQLClient.fromGid(edge.node.id),
        title: edge.node.title,
        handle: edge.node.handle,
        status: edge.node.status,
        featuredImage: edge.node.featuredImage?.url,
        totalInventory: edge.node.totalInventory,
        price: edge.node.variants?.edges?.[0]?.node?.price,
      }));
      
      return successResult({
        collection,
        products,
        productsPageInfo: response.collection.products.pageInfo,
      });
    }

    return successResult({ collection });
  } catch (error) {
    return handleToolError(error);
  }
}

export async function createCollection(input: CreateCollectionInput): Promise<ToolResult> {
  try {
    const client = getShopifyClient();

    const collectionInput: Record<string, unknown> = {
      title: input.title,
      descriptionHtml: input.descriptionHtml,
    };

    if (input.image) {
      collectionInput.image = input.image;
    }

    if (input.seo) {
      collectionInput.seo = input.seo;
    }

    const result = await client.mutate<CollectionMutationResponse>(
      CREATE_COLLECTION,
      { input: collectionInput },
      'collectionCreate'
    );

    if (!result.success) {
      return errorResult('VALIDATION_ERROR', 'Failed to create collection', {
        userErrors: result.userErrors,
      });
    }

    const collection = result.data?.collectionCreate?.collection;
    if (!collection) {
      return errorResult('API_ERROR', 'Collection was not created');
    }

    return successResult({
      message: 'Collection created successfully',
      collection: formatCollection(collection),
    });
  } catch (error) {
    return handleToolError(error);
  }
}

export async function addProductsToCollection(input: AddProductsToCollectionInput): Promise<ToolResult> {
  try {
    const client = getShopifyClient();
    const collectionGid = ShopifyGraphQLClient.toGid('Collection', input.collectionId);
    const productGids = input.productIds.map((id) => ShopifyGraphQLClient.toGid('Product', id));

    const result = await client.mutate<CollectionMutationResponse>(
      ADD_PRODUCTS_TO_COLLECTION,
      { id: collectionGid, productIds: productGids },
      'collectionAddProducts'
    );

    if (!result.success) {
      return errorResult('VALIDATION_ERROR', 'Failed to add products to collection', {
        userErrors: result.userErrors,
      });
    }

    const collection = result.data?.collectionAddProducts?.collection;
    
    return successResult({
      message: 'Products added to collection successfully',
      collection: {
        id: input.collectionId,
        title: collection?.title,
        productsCount: collection?.productsCount?.count,
      },
      addedProductIds: input.productIds,
    });
  } catch (error) {
    return handleToolError(error);
  }
}

// Export tool definitions for MCP registration
export const collectionToolDefinitions = [
  {
    name: 'list_collections',
    description: 'List collections from the Shopify store',
    inputSchema: {
      type: 'object',
      properties: {
        first: {
          type: 'number',
          description: 'Number of collections to return (1-250, default: 50)',
        },
        after: {
          type: 'string',
          description: 'Cursor for pagination',
        },
        query: {
          type: 'string',
          description: 'Search query to filter collections',
        },
      },
    },
    handler: listCollections,
  },
  {
    name: 'get_collection',
    description: 'Get detailed information about a specific collection including products',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Collection ID (numeric or GID format)',
        },
        includeProducts: {
          type: 'boolean',
          description: 'Include products in the collection (default: true)',
        },
        productsFirst: {
          type: 'number',
          description: 'Number of products to include (default: 20)',
        },
      },
      required: ['id'],
    },
    handler: getCollection,
  },
  {
    name: 'create_collection',
    description: 'Create a new manual collection',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Collection title',
        },
        descriptionHtml: {
          type: 'string',
          description: 'Collection description (HTML)',
        },
        image: {
          type: 'object',
          properties: {
            src: { type: 'string', description: 'Image URL' },
            altText: { type: 'string', description: 'Image alt text' },
          },
        },
        seo: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'SEO title' },
            description: { type: 'string', description: 'SEO description' },
          },
        },
      },
      required: ['title'],
    },
    handler: createCollection,
  },
  {
    name: 'add_products_to_collection',
    description: 'Add products to an existing collection',
    inputSchema: {
      type: 'object',
      properties: {
        collectionId: {
          type: 'string',
          description: 'Collection ID',
        },
        productIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Product IDs to add',
        },
      },
      required: ['collectionId', 'productIds'],
    },
    handler: addProductsToCollection,
  },
];
