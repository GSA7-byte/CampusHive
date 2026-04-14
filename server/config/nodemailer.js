const nodemailer = require("nodemailer");

let transporter = null;

if (process.env.NODEMAILER_EMAIL && process.env.NODEMAILER_PASS) {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.NODEMAILER_EMAIL,
      pass: process.env.NODEMAILER_PASS,
    },
  });
}

module.exports = transporter;