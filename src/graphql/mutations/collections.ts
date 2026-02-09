// Collection GraphQL Mutations

import { COLLECTION_FRAGMENT } from '../queries/collections.js';

export const CREATE_COLLECTION = `
  ${COLLECTION_FRAGMENT}
  mutation CreateCollection($input: CollectionInput!) {
    collectionCreate(input: $input) {
      collection {
        ...CollectionFields
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

export const ADD_PRODUCTS_TO_COLLECTION = `
  mutation AddProductsToCollection($id: ID!, $productIds: [ID!]!) {
    collectionAddProducts(id: $id, productIds: $productIds) {
      collection {
        id
        title
        productsCount {
          count
        }
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

export const REMOVE_PRODUCTS_FROM_COLLECTION = `
  mutation RemoveProductsFromCollection($id: ID!, $productIds: [ID!]!) {
    collectionRemoveProducts(id: $id, productIds: $productIds) {
      job {
        id
        done
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

export const UPDATE_COLLECTION = `
  ${COLLECTION_FRAGMENT}
  mutation UpdateCollection($input: CollectionInput!) {
    collectionUpdate(input: $input) {
      collection {
        ...CollectionFields
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

export const DELETE_COLLECTION = `
  mutation DeleteCollection($input: CollectionDeleteInput!) {
    collectionDelete(input: $input) {
      deletedCollectionId
      userErrors {
        field
        message
        code
      }
    }
  }
`;
