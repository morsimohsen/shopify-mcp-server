// Customer GraphQL Mutations

import { CUSTOMER_FRAGMENT } from '../queries/customers.js';

export const CREATE_CUSTOMER = `
  ${CUSTOMER_FRAGMENT}
  mutation CreateCustomer($input: CustomerInput!) {
    customerCreate(input: $input) {
      customer {
        ...CustomerFields
        addresses {
          id
          address1
          city
          country
          zip
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

export const UPDATE_CUSTOMER = `
  ${CUSTOMER_FRAGMENT}
  mutation UpdateCustomer($input: CustomerInput!) {
    customerUpdate(input: $input) {
      customer {
        ...CustomerFields
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

export const DELETE_CUSTOMER = `
  mutation DeleteCustomer($input: CustomerDeleteInput!) {
    customerDelete(input: $input) {
      deletedCustomerId
      userErrors {
        field
        message
        code
      }
    }
  }
`;
