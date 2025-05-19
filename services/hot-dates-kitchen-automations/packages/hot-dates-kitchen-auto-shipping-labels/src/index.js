/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { ShopifyClient } from 'shopify';
import { Order } from './gql';
import { EasyPostClient } from 'easypost';
import rules from './rules';
async function main(request, env, ctx) {
		const body = await request.json();
		const { admin_graphql_api_id: orderId } = body;

		// Instantiate Shopify client
		const shopify = new ShopifyClient({
			accessToken: env.SHOPIFY_ACCESS_TOKEN,
			baseUrlGql: env.SHOPIFY_API_BASE_URL_GQL,
		});

		// Instantiate EasyPost client
		const easypost = new EasyPostClient({
			apiKey: env.EASYPOST_API_KEY,
			baseUrl: env.EASYPOST_API_BASE_URL,
		});

		// Get order by id
		const order = (await shopify.gqlQuery(Order.byId, { id: orderId })).data.order;
		//console.log(JSON.stringify(order, null, 2));
		
		// We'll be generating shipping labels for each fulfillment order, so we'll loop through each fulfillment order and generate a shipping label for each
		const fulfillmentOrders = order.fulfillmentOrders.nodes;
		for (const fulfillmentOrder of fulfillmentOrders) {
			// Uncomment for prod
			//if (fulfillmentOrder.status === "CLOSED") {
			//	continue
			//}
			//console.log(JSON.stringify(fulfillmentOrder, null, 2));

			const shipment = {
				from_address: {
					name: 'Hauser',
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
						if (item.weight.unit === "POUNDS") {
							return acc + item.weight.value * 16;
						} else {
							return acc + item.weight.value;
						}
					}, 0),
				},
			}
			//console.log('Shipment:\n' + JSON.stringify(shipment, null, 2));

			// Create shipment
			const shipmentResponse = await easypost.createShipment(shipment);
			//console.log('Shipment response:\n' + JSON.stringify(shipmentResponse, null, 2));

			// Choose a rate
			const rateId = await rules(fulfillmentOrder, shipmentResponse);

			// Buy the rate
			const buyResponse = await easypost.buyShipment(shipmentResponse.id, rateId);
			console.log('Buy response:\n' + JSON.stringify(buyResponse, null, 2));
		}
}

export default {
	async fetch(request, env, ctx) {
		ctx.waitUntil(main(request, env, ctx));
		return new Response('ok', { status: 202 });
	},
};
