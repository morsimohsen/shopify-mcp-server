// Product GraphQL Queries

export const PRODUCT_FRAGMENT = `
  fragment ProductFields on Product {
    id
    title
    handle
    descriptionHtml
    vendor
    productType
    status
    tags
    totalInventory
    createdAt
    updatedAt
    publishedAt
    featuredImage {
      id
      url
      altText
      width
      height
    }
    options {
      id
      name
      values
    }
  }
`;

export const PRODUCT_VARIANT_FRAGMENT = `
  fragment ProductVariantFields on ProductVariant {
    id
    title
    sku
    price
    compareAtPrice
    inventoryQuantity
    barcode
    weight
    weightUnit
    inventoryItem {
      id
    }
    selectedOptions {
      name
      value
    }
    image {
      id
      url
      altText
    }
  }
`;

export const LIST_PRODUCTS = `
  ${PRODUCT_FRAGMENT}
  query ListProducts($first: Int!, $after: String, $query: String, $sortKey: ProductSortKeys, $reverse: Boolean) {
    products(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {
      edges {
        cursor
        node {
          ...ProductFields
          variants(first: 3) {
            edges {
              node {
                id
                title
                price
                sku
                inventoryQuantity
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

export const GET_PRODUCT = `
  ${PRODUCT_FRAGMENT}
  ${PRODUCT_VARIANT_FRAGMENT}
  query GetProduct($id: ID!) {
    product(id: $id) {
      ...ProductFields
      variants(first: 100) {
        edges {
          cursor
          node {
            ...ProductVariantFields
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
      images(first: 20) {
        edges {
          node {
            id
            url
            altText
            width
            height
          }
        }
      }
    }
  }
`;

export const SEARCH_PRODUCTS = `
  ${PRODUCT_FRAGMENT}
  query SearchProducts($query: String!, $first: Int!) {
    products(first: $first, query: $query) {
      edges {
        node {
          ...ProductFields
          variants(first: 1) {
            edges {
              node {
                id
                price
                sku
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;
