const expressAsyncHandler = require("express-async-handler");
const { OAuth2Client } = require("google-auth-library");
const { clientId, clientSecret, redirectUri } = require("../config");
const { google } = require("googleapis");
const _ = require("lodash");
const sendEMail = require("../utils/sendMail");

const RERUN_INTERVAL = 20000;
const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);

const googleUserLogin = expressAsyncHandler(async (req, res) => {
  try {
    const url = await oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.send",
        "https://mail.google.com/",
      ],
    });
    res.redirect(url);
  } catch (error) {
    throw new Error(error);
  }
});

const googleUserSetCreds = expressAsyncHandler(async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    //Gmail with using oauth2client
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Get the user's email address
    const userInfo = await gmail.users.getProfile({ userId: "me" });
    const userEmail = userInfo.data.emailAddress;

    setInterval(async () => {
      // List threads in the user's inbox
      const threads = await gmail.users.threads.list({
        userId: "me",
        q: "in:inbox",
      });

      const excludedIDs = []; //ThreadIDs in which user replied
      const threadIds = []; //ThreadIDs to send email to

      //Check if any thread exists
      if (threads.data.threads) {
        // Iterate through each thread
        for (const thread of threads.data.threads) {
          // Fetch the details of the thread
          const threadRes = await gmail.users.threads.get({
            userId: "me",
            id: thread.id,
            format: "full",
          });

          //Check if any messages exists
          if (threadRes.data.messages.length) {
            for (const message of threadRes.data.messages) {
              // Fetch the details of the message
              const messageRes = await gmail.users.messages.get({
                userId: "me",
                id: message.id,
                format: "full",
              });

              threadIds.push(threadRes.data.id);

              // Check if the message was sent by the user
              if (
                messageRes.data.payload.headers.some(
                  (header) =>
                    header.name === "From" &&
                    header.value.includes("deysoumavo3@gmail.com")
                )
              ) {
                excludedIDs.push(threadRes.data.id);
              }
            }
          } else {
            console.log("No messages found in this thread");
          }
        }
      } else {
        console.log("No Threads Found");
      }
      const mailThreadId = _.difference(threadIds, excludedIDs);
      if (mailThreadId.length) {
        recipientExtraction(tokens, gmail, mailThreadId);
      }
    }, RERUN_INTERVAL);

    res.send(`Welcome: ${userEmail}`);
  } catch (error) {
    throw new Error(error);
  }
});

const recipientExtraction = async (tokens, gmail, mailThreadId) => {
  const mailThread = await gmail.users.threads.get({
    userId: "me",
    id: mailThreadId,
    format: "full",
  });
  const mailMessage = await gmail.users.messages.get({
    userId: "me",
    id: mailThread.data.messages[0].id,
    format: "full",
  });

  const sender = await mailMessage.data.payload.headers.find(
    (header) => header.name === "From"
  ).value;
  const subject = await mailMessage.data.payload.headers.find(
    (header) => header.name === "Subject"
  ).value;
  await sendEMail(tokens, subject, sender);
  await setLabel(gmail, mailThreadId);
};

const setLabel = async (gmail, mailThreadId) => {
  // Label the thread with a custom label
  await gmail.users.threads.modify({
    userId: "me",
    id: mailThreadId,
    requestBody: {
      addLabelIds: ["Label_713932954198543238"],
    },
  });
};

module.exports = { googleUserLogin, googleUserSetCreds };
