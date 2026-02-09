// Order GraphQL Queries

export const ORDER_FRAGMENT = `
  fragment OrderFields on Order {
    id
    name
    email
    phone
    createdAt
    updatedAt
    processedAt
    closedAt
    cancelledAt
    cancelReason
    displayFinancialStatus
    displayFulfillmentStatus
    confirmed
    test
    currencyCode
    note
    tags
    subtotalPriceSet {
      shopMoney {
        amount
        currencyCode
      }
      presentmentMoney {
        amount
        currencyCode
      }
    }
    totalPriceSet {
      shopMoney {
        amount
        currencyCode
      }
      presentmentMoney {
        amount
        currencyCode
      }
    }
    totalTaxSet {
      shopMoney {
        amount
        currencyCode
      }
    }
    totalDiscountsSet {
      shopMoney {
        amount
        currencyCode
      }
    }
    totalShippingPriceSet {
      shopMoney {
        amount
        currencyCode
      }
    }
    totalRefundedSet {
      shopMoney {
        amount
        currencyCode
      }
    }
    customer {
      id
      email
      displayName
    }
    shippingAddress {
      address1
      address2
      city
      province
      provinceCode
      country
      countryCodeV2
      zip
      phone
      firstName
      lastName
      company
    }
    billingAddress {
      address1
      address2
      city
      province
      country
      zip
      firstName
      lastName
    }
  }
`;

export const LINE_ITEM_FRAGMENT = `
  fragment LineItemFields on LineItem {
    id
    title
    quantity
    sku
    variantTitle
    vendor
    fulfillmentStatus
    originalUnitPriceSet {
      shopMoney {
        amount
        currencyCode
      }
      presentmentMoney {
        amount
        currencyCode
      }
    }
    discountedUnitPriceSet {
      shopMoney {
        amount
        currencyCode
      }
      presentmentMoney {
        amount
        currencyCode
      }
    }
    discountedTotalSet {
      shopMoney {
        amount
        currencyCode
      }
      presentmentMoney {
        amount
        currencyCode
      }
    }
    variant {
      id
      product {
        id
      }
    }
    image {
      url
      altText
    }
  }
`;

export const LIST_ORDERS = `
  ${ORDER_FRAGMENT}
  query ListOrders($first: Int!, $after: String, $query: String, $sortKey: OrderSortKeys, $reverse: Boolean) {
    orders(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {
      edges {
        cursor
        node {
          ...OrderFields
          lineItems(first: 5) {
            edges {
              node {
                id
                title
                quantity
                sku
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

export const GET_ORDER = `
  ${ORDER_FRAGMENT}
  ${LINE_ITEM_FRAGMENT}
  query GetOrder($id: ID!) {
    order(id: $id) {
      ...OrderFields
      lineItems(first: 100) {
        edges {
          cursor
          node {
            ...LineItemFields
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
      fulfillments {
        id
        status
        createdAt
        updatedAt
        trackingInfo {
          number
          url
          company
        }
      }
      refunds {
        id
        createdAt
        note
        totalRefundedSet {
          shopMoney {
            amount
            currencyCode
          }
        }
      }
    }
  }
`;
