const nodemailer = require('nodemailer');

const pug = require('pug');
const { convert } = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Mozes Elbarbary <${process.env.EMAIL_FROM}>`;
  }

  // Create Nodemailer SES Transporter
  newTransport() {

    // when on PROD MODE send real emails using AWS(SES)
    // NOTE: New signed-up email addresses have to be verified
    // first in the Amazon SES new identity configuration page

    if (process.env.NODE_ENV === 'production') {
      // Use SES
      return nodemailer.createTransport({
        host: process.env.AWS_REGION,
        secure: true,
        port: process.env.AWS_PORT,
        auth: {
          user: process.env.AWS_USERNAME,
          pass: process.env.AWS_PASSWORD,
        },
      });
    }

    // when on DEV MODE send real email using Mailtrap
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    // Send the actual email

    // 1) Render HTML based on Pug Template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });

    // 2) Define the Email Options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: convert(html, {
        wordwrap: 130,
      }),
    };

    // 3) Create Transport and Send Email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes)'
    );
  }
};
