import jsonata from 'jsonata'
import logger from '../utils/logger.js'

export default async function (fulfillmentOrder, easypostShipment) {
	// TODO: Implement rules
	// Until an interface for rules is designed, just hardcode the rules, which are:
	// 1. Only choose rates that have expected delivery of 2 days or less
	// 2. If the usps zone is 1 or 2, don't choose USPS as the carrier (any other zones, any carrier is acceptable)
	// This function should return an easypost rate ID

	const rates = easypostShipment.rates
	const zone = easypostShipment.usps_zone

	//logger.debug('Rates:\n' + JSON.stringify(rates, null, 2))
	const ratesFor2DaysOrLess = await jsonata(
		'$[delivery_days<=2] ~> $sort(function($l, $r) {$number($l.rate) > $number($r.rate)})',
	).evaluate(rates)

	//logger.debug('Rates for 2 days or less:\n' + JSON.stringify(ratesFor2DaysOrLess, null, 2))

	// TODO: Double-check this logic
	if (zone <= 2) {
		const nonUSPSRates = ratesFor2DaysOrLess.filter((rate) => rate.carrier !== 'USPS')
		//logger.debug('Cheapest non-USPS rate:\n' + JSON.stringify(nonUSPSRates[0], null, 2))
		return nonUSPSRates[0].id
	}

	logger.debug('Cheapest rate:\n' + JSON.stringify(ratesFor2DaysOrLess[0], null, 2))
	return ratesFor2DaysOrLess[0].id
}
