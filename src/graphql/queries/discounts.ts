// Discount GraphQL Queries and Mutations

export const LIST_DISCOUNTS = `
  query ListDiscounts($first: Int!, $after: String, $query: String) {
    discountNodes(first: $first, after: $after, query: $query) {
      edges {
        cursor
        node {
          id
          discount {
            ... on DiscountCodeBasic {
              title
              status
              startsAt
              endsAt
              usageLimit
              asyncUsageCount
              codes(first: 5) {
                edges {
                  node {
                    code
                    usageCount
                  }
                }
              }
              customerSelection {
                ... on DiscountCustomerAll {
                  allCustomers
                }
              }
              summary
            }
            ... on DiscountCodeBxgy {
              title
              status
              startsAt
              endsAt
              usageLimit
              asyncUsageCount
              codes(first: 5) {
                edges {
                  node {
                    code
                    usageCount
                  }
                }
              }
              summary
            }
            ... on DiscountCodeFreeShipping {
              title
              status
              startsAt
              endsAt
              usageLimit
              asyncUsageCount
              codes(first: 5) {
                edges {
                  node {
                    code
                    usageCount
                  }
                }
              }
              summary
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

export const CREATE_BASIC_DISCOUNT = `
  mutation CreateBasicDiscount($basicCodeDiscount: DiscountCodeBasicInput!) {
    discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
      codeDiscountNode {
        id
        codeDiscount {
          ... on DiscountCodeBasic {
            title
            status
            startsAt
            endsAt
            usageLimit
            codes(first: 1) {
              edges {
                node {
                  code
                }
              }
            }
            summary
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

export const DELETE_DISCOUNT = `
  mutation DeleteDiscount($id: ID!) {
    discountCodeDelete(id: $id) {
      deletedCodeDiscountId
      userErrors {
        field
        message
        code
      }
    }
  }
`;
