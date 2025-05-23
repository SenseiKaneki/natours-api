const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1) create a transporter
  const transporter = nodemailer.createTransport({
    // host: process.env.EMAIL_HOST,
    // port: process.env.EMAIL_HOST,
    // auth: {
    //     user: process.env.EMAIL_USERNAME,
    //     pass: process.env.EMAIL_PASSWORD,
    // }

    // How it'd work in gmail:
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    }
    // Activate in gmail "less secure app" option
  });

  // 2) Define the email options
  const mailOptions = {
    from: 'Ayman Fadli <dev.aymanfadli@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.text,
    // html: options.html,
  }

  // 3) Actually send the email
  await transporter.sendMail(mailOptions);
}
module.exports = sendEmail;