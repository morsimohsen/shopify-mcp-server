// Order GraphQL Mutations

export const CREATE_DRAFT_ORDER = `
  mutation CreateDraftOrder($input: DraftOrderInput!) {
    draftOrderCreate(input: $input) {
      draftOrder {
        id
        name
        status
        email
        createdAt
        updatedAt
        invoiceUrl
        note
        tags
        subtotalPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        totalPriceSet {
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
        lineItems(first: 50) {
          edges {
            node {
              id
              title
              quantity
              originalUnitPriceSet {
                shopMoney {
                  amount
                  currencyCode
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

export const COMPLETE_DRAFT_ORDER = `
  mutation CompleteDraftOrder($id: ID!, $paymentPending: Boolean) {
    draftOrderComplete(id: $id, paymentPending: $paymentPending) {
      draftOrder {
        id
        name
        status
        completedAt
        order {
          id
          name
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

export const UPDATE_ORDER = `
  mutation UpdateOrder($input: OrderInput!) {
    orderUpdate(input: $input) {
      order {
        id
        name
        note
        tags
        email
        shippingAddress {
          address1
          address2
          city
          province
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

export const CANCEL_ORDER = `
  mutation CancelOrder($orderId: ID!, $reason: OrderCancelReason, $notifyCustomer: Boolean, $refund: Boolean, $restock: Boolean) {
    orderCancel(orderId: $orderId, reason: $reason, notifyCustomer: $notifyCustomer, refund: $refund, restock: $restock) {
      job {
        id
        done
      }
      orderCancelUserErrors {
        field
        message
        code
      }
    }
  }
`;

export const ADD_ORDER_NOTE = `
  mutation AddOrderNote($input: OrderInput!) {
    orderUpdate(input: $input) {
      order {
        id
        name
        note
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;
