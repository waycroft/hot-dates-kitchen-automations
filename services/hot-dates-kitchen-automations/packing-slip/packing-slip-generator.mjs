import { join } from 'path';
import { unlink } from 'fs/promises';
import puppeteer from 'puppeteer';
import orders from './mock-data';

const DIR = import.meta.dirname;
const TEMPLATE_PATH = join(DIR, 'packing-slip-template.html');
const TEMP_HTML_PATH = join(DIR, 'temp/packing-slip-temp.html');
const PDF_DEST = join(DIR, 'output');

const createHtml = async (order) => {
  const htmlFile = await Bun.file(TEMPLATE_PATH);
  let htmlText = await htmlFile.text();
  htmlText = htmlText
    .replace('{{ order_id }}', order.orderId)
    .replace('{{ customer_name }}', order.customerName)
    .replace('{{ customer_address }}', order.customerAddress);

  let tableRows = '';
  for(let i=0;i<order.items.length;i++) {
    const newRow = 
    `<tr>
      <td>${order.items[i].item}</td>
      <td>${order.items[i].quantity}</td>
    </tr>`;
    tableRows += newRow;
  }
  htmlText = htmlText.replace('{{ table_body }}', tableRows);
  await Bun.write(TEMP_HTML_PATH, htmlText);
};

const convertToPdf = async (order) => {
  const pdfName = `packing-slip-${order.orderId}.pdf`
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(TEMP_HTML_PATH);
  await page.pdf({ path: join(PDF_DEST, pdfName), format: 'A4' });
  await browser.close();
};

const start = performance.now();
let orderCount = 0;
for(let i=0;i<orders.length;i++) {
  process.stdout.write(`\rProcessing packing slip: ${orderCount+1}/${orders.length}`);
  await createHtml(orders[i]);
  await convertToPdf(orders[i]);
  await unlink(TEMP_HTML_PATH);
  ++orderCount;
}
const end = performance.now();
console.log(`\nCreated ${orderCount} packing slips in ${(end - start)/1000} seconds.`);
