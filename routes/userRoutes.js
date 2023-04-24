const express = require("express");
const {
  googleUserLogin,
  googleUserSetCreds,
} = require("../controllers/userCtrl");
const userRouter = express.Router();

userRouter.get("/auth/google", googleUserLogin);
userRouter.get("/auth/google/callback", googleUserSetCreds);

module.exports = userRouter