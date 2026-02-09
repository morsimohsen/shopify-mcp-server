// Shop GraphQL Queries

export const GET_SHOP_INFO = `
  query GetShopInfo {
    shop {
      id
      name
      email
      myshopifyDomain
      primaryDomain {
        url
        host
      }
      currencyCode
      weightUnit
      timezoneAbbreviation
      ianaTimezone
      plan {
        displayName
        partnerDevelopment
        shopifyPlus
      }
      billingAddress {
        city
        country
        countryCodeV2
      }
    }
  }
`;

export const GET_LOCATIONS = `
  query GetLocations($first: Int!, $includeInactive: Boolean!) {
    locations(first: $first, includeInactive: $includeInactive) {
      edges {
        node {
          id
          name
          isActive
          fulfillsOnlineOrders
          address {
            address1
            address2
            city
            province
            country
            zip
            phone
          }
          shipsInventory
          hasActiveInventory
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;
