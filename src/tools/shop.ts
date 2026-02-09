import { getShopifyClient, ShopifyGraphQLClient } from '../clients/shopify-graphql.js';
import { GET_SHOP_INFO, GET_LOCATIONS } from '../graphql/queries/shop.js';
import { successResult, handleToolError, type ToolResult } from '../utils/error-handler.js';
import type {
  GetShopInfoInput,
  GetLocationsInput,
} from '../types/tools.js';

interface ShopInfoResponse {
  shop: {
    id: string;
    name: string;
    email: string;
    url: string;
    myshopifyDomain: string;
    primaryDomain: {
      host: string;
      sslEnabled: boolean;
    };
    plan: {
      displayName: string;
      partnerDevelopment: boolean;
      shopifyPlus: boolean;
    };
    billingAddress: {
      address1: string | null;
      address2: string | null;
      city: string | null;
      province: string | null;
      country: string | null;
      zip: string | null;
      phone: string | null;
    };
    currencyCode: string;
    currencyFormats: {
      moneyFormat: string;
      moneyWithCurrencyFormat: string;
    };
    timezoneAbbreviation: string;
    ianaTimezone: string;
    weightUnit: string;
    unitSystem: string;
    enabledPresentmentCurrencies: string[];
    contactEmail: string;
    createdAt: string;
    description: string | null;
    features: {
      giftCards: boolean;
      multiLocation: boolean;
      reports: boolean;
      sellsSubscriptions: boolean;
      storefront: boolean;
    };
  };
}

interface LocationNode {
  id: string;
  name: string;
  isActive: boolean;
  isPrimary: boolean;
  address: {
    address1: string | null;
    address2: string | null;
    city: string | null;
    province: string | null;
    country: string | null;
    zip: string | null;
    phone: string | null;
  };
  fulfillsOnlineOrders: boolean;
  hasActiveInventory: boolean;
  shipsInventory: boolean;
}

interface LocationsResponse {
  locations: {
    edges: Array<{ cursor: string; node: LocationNode }>;
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string | null;
      endCursor: string | null;
    };
  };
}

export async function getShopInfo(_input: GetShopInfoInput): Promise<ToolResult> {
  try {
    const client = getShopifyClient();

    const response = await client.query<ShopInfoResponse>(GET_SHOP_INFO);

    const shop = response.shop;

    return successResult({
      shop: {
        id: ShopifyGraphQLClient.fromGid(shop.id),
        gid: shop.id,
        name: shop.name,
        email: shop.email,
        contactEmail: shop.contactEmail,
        url: shop.url,
        myshopifyDomain: shop.myshopifyDomain,
        primaryDomain: shop.primaryDomain,
        plan: {
          name: shop.plan.displayName,
          isDevelopmentStore: shop.plan.partnerDevelopment,
          isShopifyPlus: shop.plan.shopifyPlus,
        },
        billingAddress: shop.billingAddress,
        currency: {
          code: shop.currencyCode,
          format: shop.currencyFormats.moneyFormat,
          formatWithCurrency: shop.currencyFormats.moneyWithCurrencyFormat,
        },
        enabledCurrencies: shop.enabledPresentmentCurrencies,
        timezone: {
          abbreviation: shop.timezoneAbbreviation,
          iana: shop.ianaTimezone,
        },
        units: {
          weight: shop.weightUnit,
          system: shop.unitSystem,
        },
        description: shop.description,
        createdAt: shop.createdAt,
        features: {
          hasGiftCards: shop.features.giftCards,
          hasMultiLocation: shop.features.multiLocation,
          hasReports: shop.features.reports,
          sellsSubscriptions: shop.features.sellsSubscriptions,
          hasStorefront: shop.features.storefront,
        },
      },
    });
  } catch (error) {
    return handleToolError(error);
  }
}

export async function getLocations(input: GetLocationsInput): Promise<ToolResult> {
  try {
    const client = getShopifyClient();

    const response = await client.query<LocationsResponse>(GET_LOCATIONS, {
      first: input.first || 50,
      after: input.after,
      includeInactive: input.includeInactive ?? false,
    });

    const locations = response.locations.edges.map((edge) => {
      const loc = edge.node;
      return {
        id: ShopifyGraphQLClient.fromGid(loc.id),
        gid: loc.id,
        name: loc.name,
        isActive: loc.isActive,
        isPrimary: loc.isPrimary,
        address: {
          address1: loc.address.address1,
          address2: loc.address.address2,
          city: loc.address.city,
          province: loc.address.province,
          country: loc.address.country,
          zip: loc.address.zip,
          phone: loc.address.phone,
        },
        capabilities: {
          fulfillsOnlineOrders: loc.fulfillsOnlineOrders,
          hasActiveInventory: loc.hasActiveInventory,
          shipsInventory: loc.shipsInventory,
        },
      };
    });

    return successResult({
      locations,
      pageInfo: response.locations.pageInfo,
      count: locations.length,
    });
  } catch (error) {
    return handleToolError(error);
  }
}

// Export tool definitions for MCP registration
export const shopToolDefinitions = [
  {
    name: 'get_shop_info',
    description: 'Get detailed information about the Shopify store',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: getShopInfo,
  },
  {
    name: 'get_locations',
    description: 'Get list of store locations (for inventory and fulfillment)',
    inputSchema: {
      type: 'object',
      properties: {
        first: {
          type: 'number',
          description: 'Number of locations to return (1-250, default: 50)',
        },
        after: {
          type: 'string',
          description: 'Cursor for pagination',
        },
        includeInactive: {
          type: 'boolean',
          description: 'Include inactive locations (default: false)',
        },
      },
    },
    handler: getLocations,
  },
];
