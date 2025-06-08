# TODO

- [ ] Observability/logging
	- [ ] Creater logger wrapper to control stdout for Cloudwatch for regular app logging
	- [ ] Ensure customer data is excluded from Sentry and also application logs
- [ ] Order cancellations: is automation required for cancelling fulfillment?
- [ ] Merchant-managed vs third-party fulfillment: Technically Hot Date Kitchen uses 3p fulfillment, and ought to be making a "fulfillment request", but internally, we assign our 3p provider as a "merchant-managed" location in Shopify. Will this cause major issues, such as when our fulfillment provider rejects a fulfillment request?

# LATER

- [ ] Logic for orders with multiple fulfillment locations
