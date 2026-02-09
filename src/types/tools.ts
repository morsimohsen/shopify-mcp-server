import { z } from 'zod';

// Common schemas
export const paginationSchema = z.object({
  first: z.number().min(1).max(250).optional().default(50),
  after: z.string().optional(),
});

export const idSchema = z.string().describe('Shopify ID (numeric or GID format)');

// Product tool schemas
export const listProductsSchema = z.object({
  first: z.number().min(1).max(250).optional().default(50),
  after: z.string().optional(),
  query: z.string().optional().describe('Search query (title, vendor, product_type, etc.)'),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'DRAFT']).optional(),
  sortKey: z.enum(['TITLE', 'CREATED_AT', 'UPDATED_AT', 'INVENTORY_TOTAL', 'PRODUCT_TYPE', 'VENDOR']).optional(),
  reverse: z.boolean().optional().default(false),
});

export const getProductSchema = z.object({
  id: idSchema.describe('Product ID'),
  includeVariants: z.boolean().optional().default(true),
  includeImages: z.boolean().optional().default(true),
});

export const searchProductsSchema = z.object({
  query: z.string().describe('Search query'),
  first: z.number().min(1).max(250).optional().default(20),
});

export const createProductSchema = z.object({
  title: z.string().describe('Product title'),
  descriptionHtml: z.string().optional().describe('Product description (HTML)'),
  vendor: z.string().optional(),
  productType: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'DRAFT']).optional().default('DRAFT'),
  variants: z.array(z.object({
    price: z.string().describe('Price as string'),
    sku: z.string().optional(),
    barcode: z.string().optional(),
    compareAtPrice: z.string().optional(),
    inventoryQuantities: z.array(z.object({
      locationId: z.string(),
      availableQuantity: z.number(),
    })).optional(),
    options: z.array(z.string()).optional(),
  })).optional(),
  options: z.array(z.string()).optional().describe('Product options (e.g., ["Size", "Color"])'),
});

export const updateProductSchema = z.object({
  id: idSchema.describe('Product ID to update'),
  title: z.string().optional(),
  descriptionHtml: z.string().optional(),
  vendor: z.string().optional(),
  productType: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'DRAFT']).optional(),
});

export const deleteProductSchema = z.object({
  id: idSchema.describe('Product ID to delete'),
});

export const updateProductVariantSchema = z.object({
  id: idSchema.describe('Variant ID to update'),
  price: z.string().optional(),
  compareAtPrice: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  weight: z.number().optional(),
  weightUnit: z.enum(['KILOGRAMS', 'GRAMS', 'POUNDS', 'OUNCES']).optional(),
});

// Order tool schemas
export const listOrdersSchema = z.object({
  first: z.number().min(1).max(250).optional().default(50),
  after: z.string().optional(),
  query: z.string().optional().describe('Filter query (e.g., "fulfillment_status:unfulfilled")'),
  sortKey: z.enum(['CREATED_AT', 'UPDATED_AT', 'PROCESSED_AT', 'TOTAL_PRICE', 'CUSTOMER_NAME', 'ORDER_NUMBER']).optional(),
  reverse: z.boolean().optional().default(true),
});

export const getOrderSchema = z.object({
  id: idSchema.describe('Order ID'),
  includeLineItems: z.boolean().optional().default(true),
  includeRefunds: z.boolean().optional().default(true),
});

export const createDraftOrderSchema = z.object({
  lineItems: z.array(z.object({
    variantId: z.string().optional(),
    title: z.string().optional().describe('Custom line item title'),
    quantity: z.number().min(1),
    originalUnitPrice: z.string().optional().describe('Price for custom line items'),
  })).min(1),
  customerId: z.string().optional(),
  email: z.string().email().optional(),
  note: z.string().optional(),
  tags: z.array(z.string()).optional(),
  shippingAddress: z.object({
    address1: z.string(),
    address2: z.string().optional(),
    city: z.string(),
    province: z.string().optional(),
    country: z.string(),
    zip: z.string(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
  }).optional(),
  billingAddress: z.object({
    address1: z.string(),
    address2: z.string().optional(),
    city: z.string(),
    province: z.string().optional(),
    country: z.string(),
    zip: z.string(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
  }).optional(),
});

export const completeDraftOrderSchema = z.object({
  id: idSchema.describe('Draft order ID'),
  paymentPending: z.boolean().optional().default(false),
});

export const updateOrderSchema = z.object({
  id: idSchema.describe('Order ID'),
  note: z.string().optional(),
  tags: z.array(z.string()).optional(),
  email: z.string().email().optional(),
  shippingAddress: z.object({
    address1: z.string(),
    address2: z.string().optional(),
    city: z.string(),
    province: z.string().optional(),
    country: z.string(),
    zip: z.string(),
  }).optional(),
});

export const cancelOrderSchema = z.object({
  id: idSchema.describe('Order ID'),
  reason: z.enum(['CUSTOMER', 'DECLINED', 'FRAUD', 'INVENTORY', 'OTHER', 'STAFF']).optional(),
  notifyCustomer: z.boolean().optional().default(true),
  refund: z.boolean().optional().default(false).describe('Whether to refund the order'),
  restock: z.boolean().optional().default(true).describe('Whether to restock inventory'),
});

export const addOrderNoteSchema = z.object({
  id: idSchema.describe('Order ID'),
  note: z.string().describe('Note to add'),
});

// Customer tool schemas
export const listCustomersSchema = z.object({
  first: z.number().min(1).max(250).optional().default(50),
  after: z.string().optional(),
  query: z.string().optional().describe('Search query'),
  sortKey: z.enum(['CREATED_AT', 'UPDATED_AT', 'NAME', 'LOCATION', 'ORDERS_COUNT', 'TOTAL_SPENT']).optional(),
  reverse: z.boolean().optional().default(false),
});

export const getCustomerSchema = z.object({
  id: idSchema.describe('Customer ID'),
  includeOrders: z.boolean().optional().default(false),
  ordersFirst: z.number().min(1).max(50).optional().default(10),
});

export const searchCustomersSchema = z.object({
  query: z.string().describe('Search by email, name, or phone'),
  first: z.number().min(1).max(50).optional().default(20),
});

export const createCustomerSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  note: z.string().optional(),
  tags: z.array(z.string()).optional(),
  addresses: z.array(z.object({
    address1: z.string(),
    address2: z.string().optional(),
    city: z.string(),
    province: z.string().optional(),
    country: z.string(),
    zip: z.string(),
    phone: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
  })).optional(),
  emailMarketingConsent: z.object({
    marketingState: z.enum(['NOT_SUBSCRIBED', 'PENDING', 'SUBSCRIBED', 'UNSUBSCRIBED']),
    marketingOptInLevel: z.enum(['SINGLE_OPT_IN', 'CONFIRMED_OPT_IN', 'UNKNOWN']).optional(),
  }).optional(),
});

export const updateCustomerSchema = z.object({
  id: idSchema.describe('Customer ID'),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  note: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Inventory tool schemas
export const getInventoryLevelsSchema = z.object({
  inventoryItemId: z.string().optional().describe('Filter by inventory item'),
  locationId: z.string().optional().describe('Filter by location'),
  first: z.number().min(1).max(250).optional().default(50),
});

export const getInventoryItemSchema = z.object({
  id: idSchema.describe('Inventory item ID'),
});

export const adjustInventorySchema = z.object({
  inventoryItemId: idSchema.describe('Inventory item ID'),
  locationId: idSchema.describe('Location ID'),
  delta: z.number().describe('Quantity change (positive or negative)'),
  reason: z.string().optional().describe('Reason for adjustment'),
});

export const setInventorySchema = z.object({
  inventoryItemId: idSchema.describe('Inventory item ID'),
  locationId: idSchema.describe('Location ID'),
  available: z.number().min(0).describe('Exact quantity to set'),
  reason: z.string().optional(),
});

// Collection tool schemas
export const listCollectionsSchema = z.object({
  first: z.number().min(1).max(250).optional().default(50),
  after: z.string().optional(),
  query: z.string().optional(),
});

export const getCollectionSchema = z.object({
  id: idSchema.describe('Collection ID'),
  includeProducts: z.boolean().optional().default(true),
  productsFirst: z.number().min(1).max(50).optional().default(20),
});

export const createCollectionSchema = z.object({
  title: z.string().describe('Collection title'),
  descriptionHtml: z.string().optional(),
  image: z.object({
    src: z.string().url(),
    altText: z.string().optional(),
  }).optional(),
  seo: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
  }).optional(),
});

export const addProductsToCollectionSchema = z.object({
  collectionId: idSchema.describe('Collection ID'),
  productIds: z.array(idSchema).min(1).describe('Product IDs to add'),
});

// Discount tool schemas
export const listDiscountsSchema = z.object({
  first: z.number().min(1).max(250).optional().default(50),
  after: z.string().optional(),
  query: z.string().optional(),
});

export const createDiscountCodeSchema = z.object({
  title: z.string().describe('Internal title'),
  code: z.string().describe('Discount code customers will enter'),
  startsAt: z.string().describe('Start date (ISO 8601)'),
  endsAt: z.string().optional().describe('End date (ISO 8601)'),
  usageLimit: z.number().optional().describe('Total usage limit'),
  appliesOncePerCustomer: z.boolean().optional().default(true),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  discountValue: z.number().describe('Discount value (percentage or fixed amount)'),
  minimumRequirement: z.object({
    type: z.enum(['SUBTOTAL', 'QUANTITY']),
    value: z.number(),
  }).optional(),
});

export const deleteDiscountSchema = z.object({
  id: idSchema.describe('Discount ID'),
});

// Fulfillment tool schemas
export const createFulfillmentSchema = z.object({
  orderId: idSchema.describe('Order ID'),
  lineItems: z.array(z.object({
    id: idSchema.describe('Line item ID'),
    quantity: z.number().min(1),
  })).min(1),
  trackingInfo: z.object({
    number: z.string().optional(),
    url: z.string().url().optional(),
    company: z.string().optional(),
  }).optional(),
  notifyCustomer: z.boolean().optional().default(true),
  locationId: idSchema.optional().describe('Fulfillment location'),
});

export const updateTrackingSchema = z.object({
  fulfillmentId: idSchema.describe('Fulfillment ID'),
  trackingInfo: z.object({
    number: z.string().optional(),
    url: z.string().url().optional(),
    company: z.string().optional(),
  }),
  notifyCustomer: z.boolean().optional().default(false),
});

export const cancelFulfillmentSchema = z.object({
  fulfillmentId: idSchema.describe('Fulfillment ID'),
});

// Refund tool schemas
export const listRefundsSchema = z.object({
  orderId: idSchema.describe('Order ID to get refunds for'),
});

export const calculateRefundSchema = z.object({
  orderId: idSchema.describe('Order ID'),
  refundLineItems: z.array(z.object({
    lineItemId: idSchema,
    quantity: z.number().min(1),
  })).optional(),
  refundShipping: z.boolean().optional().default(false),
  suggestFullRefund: z.boolean().optional().default(false),
});

export const createRefundSchema = z.object({
  orderId: idSchema.describe('Order ID'),
  refundLineItems: z.array(z.object({
    lineItemId: idSchema,
    quantity: z.number().min(1),
    restockType: z.enum(['CANCEL', 'NO_RESTOCK', 'RETURN']).optional().default('RETURN'),
  })).optional(),
  shipping: z.object({
    fullRefund: z.boolean().optional(),
    amount: z.string().optional().describe('Shipping refund amount'),
  }).optional(),
  note: z.string().optional().describe('Refund reason'),
  notify: z.boolean().optional().default(true),
});

export const createReturnSchema = z.object({
  orderId: idSchema.describe('Order ID'),
  returnLineItems: z.array(z.object({
    fulfillmentLineItemId: idSchema,
    quantity: z.number().min(1),
    returnReason: z.enum([
      'COLOR',
      'DEFECTIVE',
      'NOT_AS_DESCRIBED',
      'OTHER',
      'SIZE_TOO_LARGE',
      'SIZE_TOO_SMALL',
      'STYLE',
      'UNKNOWN',
      'UNWANTED',
      'WRONG_ITEM',
    ]).optional(),
    returnReasonNote: z.string().optional(),
  })).min(1),
  notifyCustomer: z.boolean().optional().default(true),
});

// Shop tool schemas
export const getShopInfoSchema = z.object({});

export const getLocationsSchema = z.object({
  first: z.number().min(1).max(50).optional().default(20),
  after: z.string().optional().describe('Pagination cursor'),
  includeInactive: z.boolean().optional().default(false),
});

// Type exports
export type ListProductsInput = z.infer<typeof listProductsSchema>;
export type GetProductInput = z.infer<typeof getProductSchema>;
export type SearchProductsInput = z.infer<typeof searchProductsSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type DeleteProductInput = z.infer<typeof deleteProductSchema>;
export type UpdateProductVariantInput = z.infer<typeof updateProductVariantSchema>;

export type ListOrdersInput = z.infer<typeof listOrdersSchema>;
export type GetOrderInput = z.infer<typeof getOrderSchema>;
export type CreateDraftOrderInput = z.infer<typeof createDraftOrderSchema>;
export type CompleteDraftOrderInput = z.infer<typeof completeDraftOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
export type AddOrderNoteInput = z.infer<typeof addOrderNoteSchema>;

export type ListCustomersInput = z.infer<typeof listCustomersSchema>;
export type GetCustomerInput = z.infer<typeof getCustomerSchema>;
export type SearchCustomersInput = z.infer<typeof searchCustomersSchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

export type GetInventoryLevelsInput = z.infer<typeof getInventoryLevelsSchema>;
export type GetInventoryItemInput = z.infer<typeof getInventoryItemSchema>;
export type AdjustInventoryInput = z.infer<typeof adjustInventorySchema>;
export type SetInventoryInput = z.infer<typeof setInventorySchema>;

export type ListCollectionsInput = z.infer<typeof listCollectionsSchema>;
export type GetCollectionInput = z.infer<typeof getCollectionSchema>;
export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
export type AddProductsToCollectionInput = z.infer<typeof addProductsToCollectionSchema>;

export type ListDiscountsInput = z.infer<typeof listDiscountsSchema>;
export type CreateDiscountCodeInput = z.infer<typeof createDiscountCodeSchema>;
export type DeleteDiscountInput = z.infer<typeof deleteDiscountSchema>;

export type CreateFulfillmentInput = z.infer<typeof createFulfillmentSchema>;
export type UpdateTrackingInput = z.infer<typeof updateTrackingSchema>;
export type CancelFulfillmentInput = z.infer<typeof cancelFulfillmentSchema>;

export type ListRefundsInput = z.infer<typeof listRefundsSchema>;
export type CalculateRefundInput = z.infer<typeof calculateRefundSchema>;
export type CreateRefundInput = z.infer<typeof createRefundSchema>;
export type CreateReturnInput = z.infer<typeof createReturnSchema>;

export type GetShopInfoInput = z.infer<typeof getShopInfoSchema>;
export type GetLocationsInput = z.infer<typeof getLocationsSchema>;
