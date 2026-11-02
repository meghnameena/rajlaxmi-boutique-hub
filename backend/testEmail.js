require("dotenv").config();

const nodemailer = require("nodemailer");

async function testEmail() {
  console.log("Email user configured:", Boolean(process.env.EMAIL_USER));
  console.log("Email password configured:", Boolean(process.env.EMAIL_PASS));

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 30000,
    logger: true,
    debug: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    await transporter.verify();
    console.log("SUCCESS: Gmail SMTP connection verified.");
  } catch (error) {
    console.error("SMTP ERROR CODE:", error.code);
    console.error("SMTP ERROR MESSAGE:", error.message);
    console.error("SMTP ERROR COMMAND:", error.command);
  } finally {
    transporter.close();
  }
}

testEmail();