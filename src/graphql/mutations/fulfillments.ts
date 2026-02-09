// Fulfillment GraphQL Mutations

export const CREATE_FULFILLMENT = `
  mutation CreateFulfillment($fulfillment: FulfillmentV2Input!) {
    fulfillmentCreateV2(fulfillment: $fulfillment) {
      fulfillment {
        id
        status
        createdAt
        updatedAt
        trackingInfo {
          number
          url
          company
        }
        fulfillmentLineItems(first: 50) {
          edges {
            node {
              id
              quantity
              lineItem {
                id
                title
                sku
              }
            }
          }
        }
        order {
          id
          name
          displayFulfillmentStatus
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

export const UPDATE_TRACKING = `
  mutation UpdateTracking($fulfillmentId: ID!, $trackingInfoInput: FulfillmentTrackingInput!, $notifyCustomer: Boolean) {
    fulfillmentTrackingInfoUpdateV2(fulfillmentId: $fulfillmentId, trackingInfoInput: $trackingInfoInput, notifyCustomer: $notifyCustomer) {
      fulfillment {
        id
        status
        trackingInfo {
          number
          url
          company
        }
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

export const CANCEL_FULFILLMENT = `
  mutation CancelFulfillment($id: ID!) {
    fulfillmentCancel(id: $id) {
      fulfillment {
        id
        status
        order {
          id
          name
          displayFulfillmentStatus
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
