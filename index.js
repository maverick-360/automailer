const express = require("express");
const cors = require("cors");
const { notFound, errorHandler } = require("./middlewares/errorHandlers");
const { port } = require("./config");
const userRouter = require("./routes/userRoutes");

const app = express();
app.use(cors());

//routes
app.get("/", (req, res) => {
  res.send(
    "<h1>This api is running successfully</h1><br><a href='/user/auth/google'>Please login to access details</a>"
  );
});
app.use("/user", userRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
