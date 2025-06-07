// Email client
// Try to design such that we can switch between SMTP/API-based email providers down the road.
// Should abstract the email provider interface/business model away from simply sending email.

export class EmailClient {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      service: Bun.env.NODEMAILER_SERVICE,
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

  // @typedef {Object} Attachment - https://nodemailer.com/message/attachments
  // @property {string} filename
  // @property {string|Buffer|Stream} content

  /* Send email
   * @param {string} from
   * @param {string} to
   * @param {string} replyTo
   * @param {string} subject
   * @param {EmailBody} body
   * @param {Attachment[]} attachments
   */
  sendMail = async function ({
    from,
    to,
    replyTo,
    subject,
    body,
    attachments,
  }) {
    // First verify connection
    await this.transporter.verify();

    const message = {
      from: from, 
      to: to, 
      subject: subject, 
      html: body.html, 
    }

    if (body.text != null) message.text = body.text
    if (body.attachments != null) message.attachments = body.attachments

    await transporter.sendMail(message);
  };
}
