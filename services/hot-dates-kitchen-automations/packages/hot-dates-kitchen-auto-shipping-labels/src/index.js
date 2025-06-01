import { ShopifyClient } from 'shopify'
import { Order } from './gql'
import { EasyPostClient } from 'easypost'
import rules from './rules'
import { createPackingSlipPdfs } from '../packing-slip/packing-slip-generator'
import constants from './constants'

/**
 * @param {Request} req
 */
async function purchaseShippingLabelsHandler(reqBody) {
	const { admin_graphql_api_id: orderId } = reqBody

	// Instantiate Shopify client
	const shopify = new ShopifyClient({
		accessToken: Bun.env.SHOPIFY_ACCESS_TOKEN,
		baseUrlGql: Bun.env.SHOPIFY_API_BASE_URL_GQL,
	})

	// Instantiate EasyPost client
	const easypost = new EasyPostClient({
		apiKey: Bun.env.EASYPOST_API_KEY,
		baseUrl: Bun.env.EASYPOST_API_BASE_URL,
	})

	// Get order by id
	const order = (await shopify.gqlQuery(Order.byId, { id: orderId })).data.order
	//console.log(JSON.stringify(order, null, 2));

	// We'll be generating shipping labels for each fulfillment order, so we'll loop through each fulfillment order and generate a shipping label for each
	const fulfillmentOrders = order.fulfillmentOrders.nodes
	for (const fulfillmentOrder of fulfillmentOrders) {
		// Uncomment for prod
		//if (fulfillmentOrder.status === "CLOSED") {
		//	continue
		//}
		//console.log(JSON.stringify(fulfillmentOrder, null, 2));

		const shipment = {
			from_address: {
				name: constants.fulfillment_centers.HAUSER,
				street1: fulfillmentOrder.assignedLocation.address1,
				street2: fulfillmentOrder.assignedLocation.address2,
				city: fulfillmentOrder.assignedLocation.city,
				state: fulfillmentOrder.assignedLocation.state,
				zip: fulfillmentOrder.assignedLocation.zip,
				country: fulfillmentOrder.assignedLocation.countryCode,
				phone: fulfillmentOrder.assignedLocation.phone,
			},
			to_address: {
				name: fulfillmentOrder.destination.firstName + ' ' + fulfillmentOrder.destination.lastName,
				street1: fulfillmentOrder.destination.address1,
				street2: fulfillmentOrder.destination.address2,
				city: fulfillmentOrder.destination.city,
				state: fulfillmentOrder.destination.state,
				zip: fulfillmentOrder.destination.zip,
				country: fulfillmentOrder.destination.countryCode,
				phone: fulfillmentOrder.destination.phone,
				email: fulfillmentOrder.destination.email,
			},
			parcel: {
				// Easypost parcel always requires weight in ounces.
				// TODO: Are dimensions required?
				mode: 'test',
				weight: fulfillmentOrder.lineItems.nodes.reduce((acc, item) => {
					if (item.weight.unit === 'POUNDS') {
						return acc + item.weight.value * 16
					} else if (item.weight.unit === 'OUNCES') {
						return acc + item.weight.value
					} else {
						return new Response(`Item has weight specified in units ${item.weight.unit}. Please update the product's weight in the Admin in either pounds or ounces.`, {
							headers: { 'Content-Type': 'text/plain' },
							status: 500
						})
					}
				}, 0),
			},
		}
		//console.log('Shipment:\n' + JSON.stringify(shipment, null, 2));

		// Create shipment
		const shipmentResponse = await easypost.createShipment(shipment)
		//console.log('Shipment response:\n' + JSON.stringify(shipmentResponse, null, 2));

		// Choose a rate
		const rateId = await rules(fulfillmentOrder, shipmentResponse)

		// Buy the rate
		const buyResponse = await easypost.buyShipment(shipmentResponse.id, rateId)
		console.log('Buy response:\n' + JSON.stringify(buyResponse, null, 2))

		// Create packing slip pdf
		const pdfsReponse = await createPackingSlipPdfs([fulfillmentOrder], order);
		if (pdfsReponse.errors.length > 0) {
			console.error(
				JSON.stringify({
					errors: pdfsReponse.errors,
				}),
			)
			return
		}

		if (pdfsReponse.pdfs === undefined) {
			console.error("`pdfsResponse.pdfs[]` is undefined, something went wrong")
		}

		console.log('Packing slip PDFs generated')
		console.log(pdfsReponse.pdfs.length)

		const packingSlipPdf = pdfsReponse.pdfs[0];
		await Bun.write('/Users/waycroft/Downloads/packingSlip.pdf', packingSlipPdf)


		// Email packing slip and shipping label
		// Create Shopify Fulfillment, which closes a FulfillmentOrder
		// https://shopify.dev/docs/apps/build/orders-fulfillment/order-management-apps/build-fulfillment-solutions
		// https://shopify.dev/docs/api/admin-graphql/latest/mutations/fulfillmentCreateV2
	}
}

const server = Bun.serve({
	port: 3000,
	routes: {
		'/health': new Response('OK'),
		'/favicon.ico': new Response('Not found', { status: 404 }),
		'/hooks/purchase-shipping-labels': {
			POST: async (req) => {
				const body = await req.json()
				purchaseShippingLabelsHandler(body)
				return new Response('ok')
			},
		},
	},
})

if (server) {
	console.info(`Bun server running on port ${server.port}`)
}
