const express = require("express");
const cors = require("cors");
const testResetRouter = require("./routes/test-reset");
const loginRouter = require("./routes/login");
const booksRouter = require("./routes/books");
const statsRouter = require("./routes/stats");
const { requireAuth } = require("./middleware/auth");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/login", loginRouter);
app.use("/api/test", testResetRouter);
app.use("/api/books", requireAuth, booksRouter);
app.use("/api/stats", requireAuth, statsRouter);

module.exports = app;
