// Refund GraphQL Queries and Mutations

export const LIST_REFUNDS = `
  query ListRefunds($orderId: ID!) {
    order(id: $orderId) {
      id
      name
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
        refundLineItems(first: 50) {
          edges {
            node {
              lineItem {
                id
                title
                sku
              }
              quantity
              restockType
              subtotalSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const CALCULATE_REFUND = `
  mutation CalculateRefund($orderId: ID!, $refundLineItems: [RefundLineItemInput!], $refundShipping: Boolean, $suggestFullRefund: Boolean) {
    refundCreate(input: {
      orderId: $orderId,
      refundLineItems: $refundLineItems,
      shipping: { fullRefund: $refundShipping }
    }) {
      refund {
        id
        totalRefundedSet {
          shopMoney {
            amount
            currencyCode
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

export const CREATE_REFUND = `
  mutation CreateRefund($input: RefundInput!) {
    refundCreate(input: $input) {
      refund {
        id
        createdAt
        note
        totalRefundedSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        refundLineItems(first: 50) {
          edges {
            node {
              lineItem {
                id
                title
              }
              quantity
              restockType
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

export const CREATE_RETURN = `
  mutation CreateReturn($input: ReturnInput!) {
    returnCreate(input: $input) {
      return {
        id
        status
        name
        order {
          id
          name
        }
        returnLineItems(first: 50) {
          edges {
            node {
              id
              quantity
              returnReason
              returnReasonNote
              fulfillmentLineItem {
                id
                lineItem {
                  title
                  sku
                }
              }
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
