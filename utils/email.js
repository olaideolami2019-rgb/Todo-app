
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendOverdueEmail(userEmail, todoTitle) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: "Todo Task Overdue",
    text: `Your task "${todoTitle}" is overdue. Please complete it as soon as possible.`,
  });
}

module.exports = { sendOverdueEmail };
