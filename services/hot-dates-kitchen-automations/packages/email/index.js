// Email client
// Try to design such that we can switch between SMTP/API-based email providers down the road.
// Should abstract the email provider interface/business model away from simply sending email.

export class EmailClient {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      service: "SES-US-EAST-1",
      auth: {
        user: Bun.env.AWS_ACCESS_KEY_ID,
        pass: Bun.env.AWS_SECRET_ACCESS_KEY,
      },
      region: Bun.env.AWS_REGION,
    });
  }

  // @typedef {Object} EmailBody
  // @property {string} html
  // @property {string=} text - This is optional, as nodemailer will send plain text fallback automatically.

  // Send email
  // @param {string} from
  // @param {string} to
  // @param {string} replyTo
  // @param {string} subject
  // @param {EmailBody} body
  sendEmail = async function ({
    from,
    to,
    replyTo,
    subject,
    body,
    attachments,
  }) {
    return;
  };
}
