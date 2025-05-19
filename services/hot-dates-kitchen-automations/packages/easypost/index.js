// EasyPost API client

//class AuthorizationError extends Error {
//    constructor(message) {
//        super(message)
//        this.name = 'AuthorizationError'
//    }
//}

export class EasyPostClient {
    headers = new Headers()
    constructor(options) {
        const { apiKey, baseUrl } = options
        this.apiKey = apiKey
        this.baseUrl = baseUrl
        this.headers.append('Content-Type', 'application/json')
        this.headers.append('Authorization', `Basic ${btoa(`${this.apiKey}:`)}`)
    }

    // Create a shipment
    createShipment = async function (
        shipment,
    ) {
        const res = await fetch(`${this.baseUrl}/shipments`, {
            method: 'POST', 
            headers: this.headers,
            body: JSON.stringify({
                shipment,
            }),
        })
        return await res.json()
    }
    
    // Buy a shipment
    buyShipment = async function (
        shipmentId,
        rateId,
    ) {
        console.log('Buying shipment ' + shipmentId + ' with rate ' + rateId)
        const res = await fetch(`${this.baseUrl}/shipments/${shipmentId}/buy`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify({
                rate: {
                    id: rateId,
                }
            }),
        })
        return await res.json()
    }
}