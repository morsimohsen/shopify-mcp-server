import { ShopifyGraphQLClient } from '../clients/shopify-graphql.js';
import type {
  Product,
  Order,
  Customer,
  Collection,
  MoneyV2,
  MoneyBag,
  Connection,
} from '../types/shopify.js';

/**
 * Format money value for display
 */
export function formatMoney(money: MoneyV2 | null | undefined): string {
  if (!money) return 'N/A';
  const amount = parseFloat(money.amount);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: money.currencyCode,
  }).format(amount);
}

/**
 * Format money bag (shop + presentment money)
 */
export function formatMoneyBag(moneyBag: MoneyBag | null | undefined): string {
  if (!moneyBag) return 'N/A';
  return formatMoney(moneyBag.shopMoney);
}

/**
 * Format date for display
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format product for API response
 */
export function formatProduct(product: Product): Record<string, unknown> {
  return {
    id: ShopifyGraphQLClient.fromGid(product.id),
    gid: product.id,
    title: product.title,
    handle: product.handle,
    status: product.status,
    vendor: product.vendor,
    productType: product.productType,
    tags: product.tags,
    totalInventory: product.totalInventory,
    description: product.descriptionHtml,
    featuredImage: product.featuredImage?.url || null,
    variantsCount: product.variants?.edges?.length || 0,
    variants: product.variants?.edges?.map((e) => ({
      id: ShopifyGraphQLClient.fromGid(e.node.id),
      gid: e.node.id,
      title: e.node.title,
      sku: e.node.sku,
      price: e.node.price,
      compareAtPrice: e.node.compareAtPrice,
      inventoryQuantity: e.node.inventoryQuantity,
      inventoryItemId: e.node.inventoryItem?.id 
        ? ShopifyGraphQLClient.fromGid(e.node.inventoryItem.id)
        : null,
    })) || [],
    images: product.images?.edges?.map((e) => ({
      id: ShopifyGraphQLClient.fromGid(e.node.id),
      url: e.node.url,
      altText: e.node.altText,
    })) || [],
    createdAt: formatDate(product.createdAt),
    updatedAt: formatDate(product.updatedAt),
  };
}

/**
 * Format order for API response
 */
export function formatOrder(order: Order): Record<string, unknown> {
  return {
    id: ShopifyGraphQLClient.fromGid(order.id),
    gid: order.id,
    name: order.name,
    email: order.email,
    phone: order.phone,
    financialStatus: order.displayFinancialStatus,
    fulfillmentStatus: order.displayFulfillmentStatus,
    confirmed: order.confirmed,
    test: order.test,
    currency: order.currencyCode,
    subtotal: formatMoneyBag(order.subtotalPrice),
    total: formatMoneyBag(order.totalPrice),
    totalTax: formatMoneyBag(order.totalTax),
    totalDiscounts: formatMoneyBag(order.totalDiscounts),
    totalShipping: formatMoneyBag(order.totalShippingPrice),
    totalRefunded: formatMoney(order.totalRefunded),
    customer: order.customer ? {
      id: ShopifyGraphQLClient.fromGid(order.customer.id),
      email: order.customer.email,
      name: order.customer.displayName,
    } : null,
    shippingAddress: formatAddress(order.shippingAddress),
    billingAddress: formatAddress(order.billingAddress),
    lineItemsCount: order.lineItems?.edges?.length || 0,
    lineItems: order.lineItems?.edges?.map((e) => ({
      id: ShopifyGraphQLClient.fromGid(e.node.id),
      title: e.node.title,
      quantity: e.node.quantity,
      sku: e.node.sku,
      variantTitle: e.node.variantTitle,
      fulfillmentStatus: e.node.fulfillmentStatus,
      unitPrice: formatMoneyBag(e.node.discountedUnitPrice),
      total: formatMoneyBag(e.node.discountedTotal),
    })) || [],
    note: order.note,
    tags: order.tags,
    cancelReason: order.cancelReason,
    createdAt: formatDate(order.createdAt),
    processedAt: formatDate(order.processedAt),
    cancelledAt: formatDate(order.cancelledAt),
    closedAt: formatDate(order.closedAt),
  };
}

/**
 * Format customer for API response
 */
export function formatCustomer(customer: Customer): Record<string, unknown> {
  return {
    id: ShopifyGraphQLClient.fromGid(customer.id),
    gid: customer.id,
    email: customer.email,
    phone: customer.phone,
    firstName: customer.firstName,
    lastName: customer.lastName,
    displayName: customer.displayName,
    state: customer.state,
    tags: customer.tags,
    verifiedEmail: customer.verifiedEmail,
    taxExempt: customer.taxExempt,
    note: customer.note,
    ordersCount: customer.ordersCount,
    totalSpent: formatMoney(customer.totalSpent),
    defaultAddress: formatAddress(customer.defaultAddress),
    createdAt: formatDate(customer.createdAt),
    updatedAt: formatDate(customer.updatedAt),
  };
}

/**
 * Format collection for API response
 */
export function formatCollection(collection: Collection): Record<string, unknown> {
  return {
    id: ShopifyGraphQLClient.fromGid(collection.id),
    gid: collection.id,
    title: collection.title,
    handle: collection.handle,
    description: collection.descriptionHtml,
    image: collection.image?.url || null,
    productsCount: collection.productsCount,
    sortOrder: collection.sortOrder,
    isManual: collection.ruleSet === null,
    updatedAt: formatDate(collection.updatedAt),
  };
}

/**
 * Format address for API response
 */
export function formatAddress(
  address: {
    address1?: string | null;
    address2?: string | null;
    city?: string | null;
    province?: string | null;
    country?: string | null;
    zip?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    company?: string | null;
  } | null | undefined
): Record<string, unknown> | null {
  if (!address) return null;
  
  return {
    address1: address.address1,
    address2: address.address2,
    city: address.city,
    province: address.province,
    country: address.country,
    zip: address.zip,
    firstName: address.firstName,
    lastName: address.lastName,
    phone: address.phone,
    company: address.company,
  };
}

/**
 * Truncate text to a maximum length
 */
export function truncate(text: string | null | undefined, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Format connection count
 */
export function getConnectionCount<T>(connection: Connection<T> | null | undefined): number {
  return connection?.edges?.length || 0;
}

/**
 * Ensure ID is in GID format
 */
export function ensureGid(type: string, id: string | number): string {
  return ShopifyGraphQLClient.toGid(type, id);
}

/**
 * Parse ID - handles both numeric and GID formats
 */
export function parseId(id: string): { type: string | null; numericId: string } {
  const match = id.match(/gid:\/\/shopify\/(\w+)\/(\d+)/);
  if (match) {
    return { type: match[1], numericId: match[2] };
  }
  return { type: null, numericId: id };
}
