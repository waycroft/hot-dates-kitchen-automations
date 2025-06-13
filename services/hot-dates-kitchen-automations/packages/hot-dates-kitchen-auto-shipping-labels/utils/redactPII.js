const REDACT_KEYS = {
  order: [
    'customer.firstName',
    'customer.lastName',
    'customer.email',
    'customer.phone',
    'customer.note',
    'customer.defaultAddress',
    'shippingAddress',
    'billingAddress',
    'note',
    'noteAttributes',
    'paymentDetails.creditCardBin',
    'paymentDetails.creditCardNumber',
    'paymentDetails.name',
    'paymentDetails.expirationMonth',
    'paymentDetails.expirationYear',
    'metafields.email'
  ],
  fulfillmentOrder: [
    'firstName',
    'lastName',
    'email',
    'address1',
    'address2',
    'zip',
    'phone'
  ]
};

const redactKeySet = new Set(REDACT_KEYS.map(k => k.toLowerCase()));

const redactPII = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(redactPII);
  } else if (obj && typeof obj === 'object') {
    const out = {};
    for (let [k, v] of Object.entries(obj)) {
      const key = k.toLowerCase();
      if (redactKeySet.has(key)) {
        out[k] = '[REDACTED]';
      } 
      // redacts all shopify custom properties
      else if (k === 'custom_attributes' && Array.isArray(v)) {
        out[k] = v.map(a => (
          { 
            ...a,
            value: '[REDACTED]'
          }
        ));
      } else {
        out[k] = redactPII(v);
      }
    }
    return out;
  }
  return obj;
};

const containsPII = (obj, piiKeys) => {
  if (Array.isArray(obj)) {
    return obj.some(containsPII);
  } else if (obj && typeof obj === 'object') {
    for (const [key, val] of Object.entries(obj)) {
      if (
        (piiKeys.has(key.toLowerCase()) ||
        // shopify custom properties
        (key === 'custom_attributes' && Array.isArray(val))) &&
        val != null &&
        val !== '' &&
        val !== '[REDACTED]'
      ) {
        return true;
     fulfillmentOrder }
      if (containsPII(val)) {
        return true;
      }
  e }
  }
  return false;
};

const redactFulfillmentOrder = (ffo) => {
  const redactedOrder = ffo;
  redactedOrder.destination = redactPII(redactedOrder.destination, REDACT_KEYS.fulfillmentOrder);
  return redactedOrder;
};

const redactOrder = (o) => {
  const redacted = o;
  redacted = redactPII(order, REDACT_KEYS.order)
  return redacted;
};

const fullfillmentOrderContainsPII = (ffo) => containsPII(ffo, REDACT_KEYS.fulfillmentOrder);
const orderContainsPII = (o) => containsPII(o, REDACT_KEYS.o);

export {
  redactPII,
  containsPII,
  redactFulfillmentOrder,
  redactOrder,
  fullfillmentOrderContainsPII,
  orderContainsPII
}