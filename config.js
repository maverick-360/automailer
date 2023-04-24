require("dotenv").config();
module.exports = {
  port: process.env.PORT || 5000,
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: process.env.REDIRECT_URI,
  mailPassword: process.env.MAIL_PASSWORD
};
