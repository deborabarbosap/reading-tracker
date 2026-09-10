const express = require("express");
const cors = require("cors");
const testResetRouter = require("./routes/test-reset");
const loginRouter = require("./routes/login");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/login", loginRouter);
app.use("/api/test", testResetRouter);

module.exports = app;
