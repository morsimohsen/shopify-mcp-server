// Inventory GraphQL Queries

export const GET_INVENTORY_LEVELS = `
  query GetInventoryLevels($inventoryItemId: ID, $locationId: ID, $first: Int!) {
    inventoryItems(first: $first, query: $inventoryItemId) {
      edges {
        node {
          id
          sku
          tracked
          inventoryLevels(first: 20) {
            edges {
              node {
                id
                quantities(names: ["available", "incoming", "committed", "on_hand"]) {
                  name
                  quantity
                }
                location {
                  id
                  name
                  isActive
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const GET_INVENTORY_ITEM = `
  query GetInventoryItem($id: ID!) {
    inventoryItem(id: $id) {
      id
      sku
      tracked
      countryCodeOfOrigin
      harmonizedSystemCode
      createdAt
      updatedAt
      inventoryLevels(first: 50) {
        edges {
          node {
            id
            quantities(names: ["available", "incoming", "committed", "on_hand"]) {
              name
              quantity
            }
            location {
              id
              name
              isActive
            }
          }
        }
      }
    }
  }
`;

export const ADJUST_INVENTORY = `
  mutation AdjustInventory($input: InventoryAdjustQuantitiesInput!) {
    inventoryAdjustQuantities(input: $input) {
      inventoryAdjustmentGroup {
        createdAt
        reason
        changes {
          name
          delta
          quantityAfterChange
          item {
            id
            sku
          }
          location {
            id
            name
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

export const SET_INVENTORY = `
  mutation SetInventory($input: InventorySetOnHandQuantitiesInput!) {
    inventorySetOnHandQuantities(input: $input) {
      inventoryAdjustmentGroup {
        createdAt
        reason
        changes {
          name
          quantityAfterChange
          item {
            id
            sku
          }
          location {
            id
            name
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
