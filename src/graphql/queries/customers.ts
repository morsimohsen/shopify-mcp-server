// Customer GraphQL Queries

export const CUSTOMER_FRAGMENT = `
  fragment CustomerFields on Customer {
    id
    email
    phone
    firstName
    lastName
    displayName
    note
    state
    tags
    verifiedEmail
    taxExempt
    createdAt
    updatedAt
    numberOfOrders
    amountSpent {
      amount
      currencyCode
    }
    defaultAddress {
      id
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
  }
`;

export const LIST_CUSTOMERS = `
  ${CUSTOMER_FRAGMENT}
  query ListCustomers($first: Int!, $after: String, $query: String, $sortKey: CustomerSortKeys, $reverse: Boolean) {
    customers(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {
      edges {
        cursor
        node {
          ...CustomerFields
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

export const GET_CUSTOMER = `
  ${CUSTOMER_FRAGMENT}
  query GetCustomer($id: ID!, $includeOrders: Boolean!, $ordersFirst: Int!) {
    customer(id: $id) {
      ...CustomerFields
      addresses {
        id
        address1
        address2
        city
        province
        country
        zip
        phone
        firstName
        lastName
        company
      }
      orders(first: $ordersFirst) @include(if: $includeOrders) {
        edges {
          node {
            id
            name
            createdAt
            displayFinancialStatus
            displayFulfillmentStatus
            totalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
          }
        }
        pageInfo {
          hasNextPage
        }
      }
    }
  }
`;

export const SEARCH_CUSTOMERS = `
  ${CUSTOMER_FRAGMENT}
  query SearchCustomers($query: String!, $first: Int!) {
    customers(first: $first, query: $query) {
      edges {
        node {
          ...CustomerFields
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;
