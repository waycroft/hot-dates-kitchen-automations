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
import { Order, Shop } from './gql';

async function main(request, env, ctx) {
		const body = await request.json();
		const { admin_graphql_api_id: orderId } = body;
		const shopify = new ShopifyClient({
			accessToken: env.SHOPIFY_ACCESS_TOKEN,
			baseUrlGql: env.SHOPIFY_API_BASE_URL_GQL,
		});
		const shop = await shopify.gqlQuery(Shop.locations);
		console.log(shop.data.locations.edges[0].node.address);
		const order = await shopify.gqlQuery(Order.byId, { id: orderId });
		return new Response(JSON.stringify(order));
}

export default {
	async fetch(request, env, ctx) {
		ctx.waitUntil(main(request, env, ctx));
		return new Response('ok');
	},
};
