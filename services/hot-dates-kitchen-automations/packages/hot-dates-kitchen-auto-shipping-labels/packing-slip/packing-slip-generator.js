import { join } from 'path';
import { unlink } from 'fs/promises';
import puppeteer from 'puppeteer';
import { validateFulfillmentOrder } from '../utils.js/validation';

const DIR = import.meta.dirname;
const TEMPLATE_PATH = join(DIR, 'packing-slip-template.html');
const TEMP_HTML_PATH = join(DIR, 'temp/packing-slip-temp.html');
const PDF_DEST = join(DIR, 'output');

const getName = (fulfillmentOrder) => `${fulfillmentOrder.destination.firstName} ${fulfillmentOrder.destination.lastName}`;

const getToAddress = (fulfillmentOrder) => `
${fulfillmentOrder.destination.address1}<br>
${fulfillmentOrder.destination.address2}{${fulfillmentOrder.destination.address2 ? '<br>' : ''}}
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
    const htmlFile = await Bun.file(TEMPLATE_PATH);
    let htmlText = await htmlFile.text();
    htmlText = htmlText
      .replace('{{ order_id }}', fulfillmentOrder.id)
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
    htmlText = htmlText.replace('{{ table_body }}', tableRows);
    await Bun.write(TEMP_HTML_PATH, htmlText);
  } catch (err) {
    console.log(err);
    errors.push(err.message);
  }
};

const convertToPdf = async (fulfillmentOrder, errors, savePdf) => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(TEMP_HTML_PATH);
    let pdf;
    if (savePdf) {
      const pdfName = `packing-slip-${fulfillmentOrder.id}.pdf`;
      pdf = await page.pdf({ path: join(PDF_DEST, pdfName), format: 'A4' });
    } else {
      pdf = await page.pdf({ format: 'A4' });
    }
    await browser.close();
    return pdf;
  } catch (err) {
    console.log(err);
    errors.push(err.message);
  }
};

/**
 * @typedef Response
 * @property {Uint8Array[]} pdfs
 * @property {string[]} errors
 */
/**
 * Creates packing slip pdfs from a batch of fulfillmentOrders. Optionally save pdf to output directory.
 * @param {fulfillmentOrder[]} fulfillmentOrders
 * @param {bool?} savePdf
 * @returns {Response}
 */

const createPackingSlipPdfs = async (fulfillmentOrders, savePdf = false) => {
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
    await createHtml(fulfillmentOrders[i], errors);
    pdfs.push(await convertToPdf(fulfillmentOrders[i], errors, savePdf));
    if (await (Bun.file(TEMP_HTML_PATH).exists())) {
      await unlink(TEMP_HTML_PATH); // delete the temp file
    }
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
