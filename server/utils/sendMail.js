const sendMail = async ({ to, subject, html }) => {
  try {
    const transporter = require("../config/nodemailer");

    if (!transporter) {
      console.log("Email not configured. Skipping email to:", to);
      return false;
    }

    const mailOptions = {
      from: `"CampusHive" <${process.env.NODEMAILER_EMAIL}>`,
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent to:", to);
    return true;
  } catch (error) {
    console.error("Email Error:", error.message);
    return false;
  }
};

module.exports = sendMail;