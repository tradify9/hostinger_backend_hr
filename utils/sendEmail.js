// backend/utils/sendEmail.js
const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, html) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error("Email credentials are missing in environment variables");
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com", // Gmail SMTP host
      port: 465,              // SSL port
      secure: true,           // true for 465, false for 587
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"HR Team" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log(`✅ Email sent to ${to} | Message ID: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error("❌ Email send error:", err);
    throw err; // propagate error so controller can handle
  }
};

module.exports = sendEmail;
