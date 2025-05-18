// Shopify API client

class AuthorizationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'AuthorizationError'
  }
}

class UserError extends Error {
  constructor(message) {
    super(message)
    this.name = 'UserError'
  }
}

export class ShopifyClient {
  headers = new Headers()
  constructor(options) {
    const { accessToken, baseUrlGql } = options
    this.accessToken = accessToken
    this.baseUrlGql = baseUrlGql
    this.headers.append('Content-Type', 'application/json')
    this.headers.append('X-Shopify-Access-Token', this.accessToken)
  }

  // Execute arbitrary GQL queries.
  gqlQuery = async function (
    query,
    variables = {},
  ) {
    const headers = this.headers
    let res
    res = await fetch(this.baseUrlGql, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        query,
        variables,
      }),
    })
    const json = await res.json()
    if (json.errors) {
      if (Array.isArray(json.errors)) {
        for (const error of json.errors) {
          if (error?.extensions?.code === 'UNAUTHORIZED') {
            throw new AuthorizationError('Shopify API unavailable. Check to make sure subscription is active or .env is correct')
          }
        }
      }
      throw new Error(JSON.stringify(json.errors))
    }
    if (json.userErrors && json.userErrors.length > 0) {
      throw new UserError(JSON.stringify(json.userErrors))
    }
    return json
  }
}