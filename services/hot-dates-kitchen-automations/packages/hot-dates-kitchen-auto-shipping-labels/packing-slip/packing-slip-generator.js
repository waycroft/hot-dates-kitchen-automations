import puppeteer from 'puppeteer';
import { validateFulfillmentOrder } from '../utils/validation';
import { htmlTemplate } from './packing-slip-template';

const getName = (fulfillmentOrder) => `${fulfillmentOrder.destination.firstName} ${fulfillmentOrder.destination.lastName}`;

const getToAddress = (fulfillmentOrder) => `
${fulfillmentOrder.destination.address1}<br>
${fulfillmentOrder.destination.address2}${fulfillmentOrder.destination.address2 ? '<br>' : ''}
${fulfillmentOrder.destination.city} ${fulfillmentOrder.destination.state}, ${fulfillmentOrder.destination.zip} ${fulfillmentOrder.destination.countryCode}<br>
${fulfillmentOrder.destination.phone}<br>
${fulfillmentOrder.destination.email}
`;

// do we need this for the packing slip?
const getFromAddress = (fulfillmentOrder) => `
${fulfillmentOrder.assignedLocation.address1}<br>
${fulfillmentOrder.assignedLocation.address2}{${fulfillmentOrder.assignedLocation.address2 ? '<br>' : ''}}
${fulfillmentOrder.assignedLocation.city} ${fulfillmentOrder.assignedLocation.state}, ${fulfillmentOrder.assignedLocation.zip} ${fulfillmentOrder.assignedLocation.countryCode}<br>
${fulfillmentOrder.assignedLocation.phone}
`;

const createHtml = async (fulfillmentOrder, errors) => {
  const lineItems = fulfillmentOrder.lineItems.nodes;
  try {
    let htmlString = htmlTemplate;
    htmlString = htmlString
      .replace('{{ order_id }}', fulfillmentOrder.id)
      .replace('{{ order_date }}', fulfillmentOrder.orderDate) // TODO: assumption on model shape here. Might need to fix.
      .replace('{{ customer_name }}', getName(fulfillmentOrder))
      .replace('{{ customer_address }}', getToAddress(fulfillmentOrder));

    let tableRows = '';
    for(let i=0;i<lineItems.length;i++) {
      const newRow =
      `<tr>
        <td>${lineItems[i].variantTitle}</td>
        <td>${lineItems[i].quantity}</td>
      </tr>`;
      tableRows += newRow;
    }

    htmlString = htmlString.replace('{{ table_body }}', tableRows);
    return htmlString;
  } catch (err) {
    console.log(err);
    errors.push(err.message);
  }
};

const convertToPdf = async (htmlString, errors) => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(htmlString, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({ format: 'A4' })
    await browser.close();
    return pdf;
  } catch (err) {
    console.log(err);
    errors.push(err.message);
  }
};

/**
 * @typedef CreatePdfsResponse
 * @property {Uint8Array[]} pdfs
 * @property {string[]} errors
 */
/**
 * Creates packing slip pdfs from a batch of fulfillmentOrders.
 * Returns { pdfs: Uint8Array[], errors: string[] }
 * @param {fulfillmentOrder[]} fulfillmentOrders
 * @returns {Promise<CreatePdfsResponse>}
 */

const createPackingSlipPdfs = async (fulfillmentOrders) => {
  const start = performance.now();
  const pdfs = [];
  const errors = [];
  let fulfillmentOrderCount = 0;
  for(let i=0;i<fulfillmentOrders.length;i++) {
    process.stdout.write(`\rProcessing packing slip: ${fulfillmentOrderCount+1}/${fulfillmentOrders.length}`);
    // check for missing required fields
    errors.push(
      ...validateFulfillmentOrder(fulfillmentOrders[i])
    );
    if (errors.length > 0) {
      errors.push(`Packing slip for order ${fulfillmentOrders[i].id} not processed.`);
      // required field missing, early out
      continue;
    }
    const htmlString = await createHtml(fulfillmentOrders[i], errors);
    pdfs.push(await convertToPdf(htmlString, errors));
    ++fulfillmentOrderCount;
  }
  const end = performance.now();
  console.log(`\nCreated ${fulfillmentOrderCount} packing slips in ${(end - start)/1000} seconds.`);
  return {
    pdfs,
    errors
  };
};

export {
  createPackingSlipPdfs
};
