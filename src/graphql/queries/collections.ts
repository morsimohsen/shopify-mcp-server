// Collection GraphQL Queries

export const COLLECTION_FRAGMENT = `
  fragment CollectionFields on Collection {
    id
    title
    handle
    descriptionHtml
    updatedAt
    productsCount {
      count
    }
    sortOrder
    ruleSet {
      appliedDisjunctively
      rules {
        column
        relation
        condition
      }
    }
    image {
      id
      url
      altText
      width
      height
    }
  }
`;

export const LIST_COLLECTIONS = `
  ${COLLECTION_FRAGMENT}
  query ListCollections($first: Int!, $after: String, $query: String) {
    collections(first: $first, after: $after, query: $query) {
      edges {
        cursor
        node {
          ...CollectionFields
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

export const GET_COLLECTION = `
  ${COLLECTION_FRAGMENT}
  query GetCollection($id: ID!, $productsFirst: Int!) {
    collection(id: $id) {
      ...CollectionFields
      products(first: $productsFirst) {
        edges {
          node {
            id
            title
            handle
            status
            featuredImage {
              url
            }
            totalInventory
            variants(first: 1) {
              edges {
                node {
                  price
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
  }
`;
