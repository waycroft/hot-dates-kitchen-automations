import { test, expect } from 'bun:test';
import mockFulfillmentOrder from './mock-data/fulfillmentOrder';
import { containsPII, redactFulfillmentOrder } from '../utils/redactPII';

test('containsPII returns true if obj has PII', () => {
  const unredactedFulfillmentOrder = mockFulfillmentOrder;
  expect(containsPII(unredactedFulfillmentOrder.destination)).toBe(true);
})

test('redactFulfillmentOrder redacts sensitive data', () => {
  const fulfillmentOrder = mockFulfillmentOrder;
  const redactedOrder = redactFulfillmentOrder(fulfillmentOrder);
  expect(containsPII(redactedOrder.destination)).toBe(false);
});

