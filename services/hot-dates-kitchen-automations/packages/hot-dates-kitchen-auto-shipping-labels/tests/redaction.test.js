import { test, expect } from 'bun:test';
import mockFulfillmentOrder from './mock-data/fulfillmentOrder';
import mockOrder from './mock-data/order';
import {
  containsPII,
  fullfillmentOrderContainsPII,
  orderContainsPII,
  redactFulfillmentOrder,
  redactOrder
} from '../utils/redactPII';

test('containsPII returns true if obj has PII', () => {
  const unredactedFulfillmentOrder = mockFulfillmentOrder;
  expect(containsPII(unredactedFulfillmentOrder.destination)).toBe(true);
})

test('redactFulfillmentOrder redacts sensitive data', () => {
  const fulfillmentOrder = mockFulfillmentOrder;
  const redactedFulfillmentOrder = redactFulfillmentOrder(fulfillmentOrder);
  expect(fullfillmentOrderContainsPII(redactedFulfillmentOrder)).toBe(false);
});

test('redactOrder redacts sensitive data', () => {
  const order = mockOrder;
  const redactedOrder = redactOrder(order);
  expect(orderContainsPII(redactedOrder)).toBe(false);
});
