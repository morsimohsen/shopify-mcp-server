// Shopify GraphQL ID types
export type ShopifyGID = string; // e.g., "gid://shopify/Product/123"

// Configuration
export interface ShopifyConfig {
  storeUrl: string;
  accessToken: string;
  apiVersion: string;
}

// Pagination
export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

export interface Connection<T> {
  edges: Array<{
    node: T;
    cursor: string;
  }>;
  pageInfo: PageInfo;
}

export interface PaginatedResult<T> {
  items: T[];
  pageInfo: PageInfo;
}

// Money
export interface MoneyV2 {
  amount: string;
  currencyCode: string;
}

export interface MoneyBag {
  shopMoney: MoneyV2;
  presentmentMoney: MoneyV2;
}

// Images
export interface Image {
  id: ShopifyGID;
  url: string;
  altText: string | null;
  width: number;
  height: number;
}

// Products
export interface ProductVariant {
  id: ShopifyGID;
  title: string;
  sku: string | null;
  price: string;
  compareAtPrice: string | null;
  inventoryQuantity: number | null;
  inventoryItem: {
    id: ShopifyGID;
  };
  selectedOptions: Array<{
    name: string;
    value: string;
  }>;
  image: Image | null;
  barcode: string | null;
  weight: number | null;
  weightUnit: string | null;
}

export interface Product {
  id: ShopifyGID;
  title: string;
  handle: string;
  descriptionHtml: string;
  vendor: string;
  productType: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'DRAFT';
  tags: string[];
  options: Array<{
    id: ShopifyGID;
    name: string;
    values: string[];
  }>;
  variants: Connection<ProductVariant>;
  images: Connection<Image>;
  featuredImage: Image | null;
  totalInventory: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

// Customers
export interface CustomerAddress {
  id: ShopifyGID;
  address1: string | null;
  address2: string | null;
  city: string | null;
  province: string | null;
  provinceCode: string | null;
  country: string | null;
  countryCode: string | null;
  zip: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
}

export interface Customer {
  id: ShopifyGID;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  phone: string | null;
  note: string | null;
  state: 'DECLINED' | 'DISABLED' | 'ENABLED' | 'INVITED';
  tags: string[];
  verifiedEmail: boolean;
  taxExempt: boolean;
  defaultAddress: CustomerAddress | null;
  addresses: CustomerAddress[];
  ordersCount: number;
  totalSpent: MoneyV2;
  createdAt: string;
  updatedAt: string;
}

// Orders
export interface LineItem {
  id: ShopifyGID;
  title: string;
  quantity: number;
  sku: string | null;
  variantTitle: string | null;
  vendor: string | null;
  fulfillmentStatus: string;
  originalUnitPrice: MoneyBag;
  discountedUnitPrice: MoneyBag;
  originalTotal: MoneyBag;
  discountedTotal: MoneyBag;
  variant: {
    id: ShopifyGID;
    product: {
      id: ShopifyGID;
    };
  } | null;
  image: Image | null;
}

export interface Order {
  id: ShopifyGID;
  name: string; // e.g., "#1001"
  email: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
  processedAt: string | null;
  closedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  displayFinancialStatus: string;
  displayFulfillmentStatus: string;
  confirmed: boolean;
  test: boolean;
  currencyCode: string;
  subtotalPrice: MoneyBag;
  totalPrice: MoneyBag;
  totalTax: MoneyBag;
  totalDiscounts: MoneyBag;
  totalShippingPrice: MoneyBag;
  totalRefunded: MoneyV2;
  customer: Customer | null;
  shippingAddress: CustomerAddress | null;
  billingAddress: CustomerAddress | null;
  lineItems: Connection<LineItem>;
  note: string | null;
  tags: string[];
  fulfillments: Fulfillment[];
  refunds: Refund[];
}

// Fulfillments
export interface FulfillmentLineItem {
  id: ShopifyGID;
  lineItem: LineItem;
  quantity: number;
}

export interface TrackingInfo {
  number: string | null;
  url: string | null;
  company: string | null;
}

export interface Fulfillment {
  id: ShopifyGID;
  status: string;
  createdAt: string;
  updatedAt: string;
  trackingInfo: TrackingInfo[];
  fulfillmentLineItems: Connection<FulfillmentLineItem>;
}

// Refunds
export interface RefundLineItem {
  lineItem: LineItem;
  quantity: number;
  restockType: 'CANCEL' | 'NO_RESTOCK' | 'RETURN';
  subtotal: MoneyBag;
  totalTax: MoneyBag;
}

export interface Refund {
  id: ShopifyGID;
  createdAt: string;
  note: string | null;
  refundLineItems: Connection<RefundLineItem>;
  totalRefunded: MoneyV2;
}

// Inventory
export interface InventoryLevel {
  id: ShopifyGID;
  available: number | null;
  incoming: number;
  item: {
    id: ShopifyGID;
    sku: string | null;
    tracked: boolean;
  };
  location: {
    id: ShopifyGID;
    name: string;
  };
}

export interface InventoryItem {
  id: ShopifyGID;
  sku: string | null;
  tracked: boolean;
  countryCodeOfOrigin: string | null;
  harmonizedSystemCode: string | null;
  inventoryLevels: Connection<InventoryLevel>;
}

// Collections
export interface Collection {
  id: ShopifyGID;
  title: string;
  handle: string;
  descriptionHtml: string;
  image: Image | null;
  productsCount: number;
  products: Connection<Product>;
  sortOrder: string;
  ruleSet: CollectionRuleSet | null;
  updatedAt: string;
}

export interface CollectionRuleSet {
  appliedDisjunctively: boolean;
  rules: Array<{
    column: string;
    relation: string;
    condition: string;
  }>;
}

// Discounts
export interface DiscountCode {
  id: ShopifyGID;
  code: string;
  usageCount: number;
  status: 'ACTIVE' | 'EXPIRED' | 'SCHEDULED';
  startsAt: string;
  endsAt: string | null;
  customerSelection: {
    allCustomers: boolean;
  };
  summary: string;
}

// Locations
export interface Location {
  id: ShopifyGID;
  name: string;
  address: {
    address1: string | null;
    address2: string | null;
    city: string | null;
    province: string | null;
    country: string | null;
    zip: string | null;
  };
  isActive: boolean;
  fulfillsOnlineOrders: boolean;
}

// Shop
export interface Shop {
  id: ShopifyGID;
  name: string;
  email: string;
  myshopifyDomain: string;
  primaryDomain: {
    url: string;
    host: string;
  };
  currencyCode: string;
  weightUnit: string;
  timezoneAbbreviation: string;
  ianaTimezone: string;
  plan: {
    displayName: string;
    partnerDevelopment: boolean;
    shopifyPlus: boolean;
  };
  billingAddress: {
    city: string | null;
    country: string | null;
    countryCodeV2: string | null;
  };
}

// Draft Orders
export interface DraftOrder {
  id: ShopifyGID;
  name: string;
  status: 'COMPLETED' | 'INVOICE_SENT' | 'OPEN';
  customer: Customer | null;
  email: string | null;
  lineItems: Connection<LineItem>;
  subtotalPrice: MoneyBag;
  totalPrice: MoneyBag;
  totalTax: MoneyBag;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  invoiceUrl: string | null;
  note: string | null;
  tags: string[];
}

// Error types
export interface ShopifyUserError {
  field: string[] | null;
  message: string;
  code?: string;
}

export interface ShopifyGraphQLError {
  message: string;
  locations?: Array<{
    line: number;
    column: number;
  }>;
  path?: string[];
  extensions?: {
    code: string;
    documentation?: string;
  };
}
