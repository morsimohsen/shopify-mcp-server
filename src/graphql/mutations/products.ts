// Product GraphQL Mutations

import { PRODUCT_FRAGMENT, PRODUCT_VARIANT_FRAGMENT } from '../queries/products.js';

export const CREATE_PRODUCT = `
  ${PRODUCT_FRAGMENT}
  ${PRODUCT_VARIANT_FRAGMENT}
  mutation CreateProduct($input: ProductInput!) {
    productCreate(input: $input) {
      product {
        ...ProductFields
        variants(first: 10) {
          edges {
            node {
              ...ProductVariantFields
            }
          }
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

export const UPDATE_PRODUCT = `
  ${PRODUCT_FRAGMENT}
  mutation UpdateProduct($input: ProductInput!) {
    productUpdate(input: $input) {
      product {
        ...ProductFields
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

export const DELETE_PRODUCT = `
  mutation DeleteProduct($input: ProductDeleteInput!) {
    productDelete(input: $input) {
      deletedProductId
      userErrors {
        field
        message
        code
      }
    }
  }
`;

export const UPDATE_PRODUCT_VARIANT = `
  ${PRODUCT_VARIANT_FRAGMENT}
  mutation UpdateProductVariant($input: ProductVariantInput!) {
    productVariantUpdate(input: $input) {
      productVariant {
        ...ProductVariantFields
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

export const CREATE_PRODUCT_VARIANT = `
  ${PRODUCT_VARIANT_FRAGMENT}
  mutation CreateProductVariant($input: ProductVariantInput!) {
    productVariantCreate(input: $input) {
      productVariant {
        ...ProductVariantFields
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;
