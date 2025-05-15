const nodemailer = require("nodemailer");

// Validate environment variables
const requiredEnvVars = ["GMAIL_USER", "GMAIL_APP_PASSWORD"];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  service: "gmail",
  port: 587,
  secure: true, // Use TLS
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Verify transporter on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("Transporter verification failed:", error.message);
  } else {
    console.log("Transporter is ready to send emails");
  }
});

const sendMail = async (to, subject, text, html = null) => {
  try {
    const mailOptions = {
      from: `Mattra Shop <${process.env.GMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    };
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}: Message ID ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

module.exports = { transporter, sendMail };
