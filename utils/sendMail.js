const nodemailer = require("nodemailer");
const { clientId, clientSecret, mailPassword } = require("../config");

const sendEMail = async (tokens, subject, sender) => {
  const recipient = sender.match(/<(.+)>/);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: "deysoumavo3@gmail.com",
      pass: mailPassword,
      clientId,
      clientSecret,
      refreshToken: tokens.refresh_token,
    },
  });

  const mailOptions = {
    from: "deysoumavo3@gmail.com",
    to: `${recipient[1]}`,
    subject: `Re: ${subject}`,
    text: "Thank you for your message. This is an auto-reply.",
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};

module.exports = sendEMail;
