// Collection of gql queries/mutations

// Get shop locations
export const Shop = {
    locations: `
    query GetShopLocations {
      locations(first: 5) {
        edges {
          node {
            id
            name
            address {
              address1
              address2
              city
              province
              zip
              country
              countryCode
              formatted
            }
          }
        }
      }
    }
    `,
}

export const Order = {
  byId: `
    query GetOrderById($id: ID!) {
      order(id: $id) {
        id
        name
        email
        phone
        processedAt
        shippingAddress {
          name
          company
          street1: address1
          street2: address2
          city
          state: province
          zip: zip
          country
          phone
        }
        fulfillmentOrders(first: 100) {
            nodes {
              id
              assignedLocation {
                address1
                address2
                city
                state: province
                zip
                countryCode
                phone
              }
              orderName
              status
              destination {
                email
                firstName
                lastName
                address1
                address2
                city
                state: province
                zip
                countryCode
                phone
              }
              lineItems(first: 100) {
                nodes {
                  id
                  variantTitle
                  sku
                  weight {
                    value
                    unit
                  }
                }
              }
          }
        }
      }
    }
  `,
}