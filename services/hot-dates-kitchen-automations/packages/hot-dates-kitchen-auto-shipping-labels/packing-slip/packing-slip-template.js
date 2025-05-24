const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; }
    .header, .footer { text-align: center; }
    .address { margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #000; padding: 8px; text-align: left; }
  </style>
</head>
<body>
  <div class="header">
    <h2>Packing Slip</h2>
    <p>Order #{{ order_id }}</p>
    <p>Order #{{ order_date }}</p>
  </div>

  <div class="address">
    <strong>Ship To:</strong>
    <br>
    {{ customer_name }}
    <br>
    {{ customer_address }}
  </div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th>Quantity</th>
      </tr>
    </thead>
    <tbody>
      {{ table_body }}
    </tbody>
  </table>

  <div class="footer">
    <p>Thank you for your order!</p>
  </div>
</body>
</html>
`;

export {
  htmlTemplate
};