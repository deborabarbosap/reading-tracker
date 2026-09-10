const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// As rotas são montadas nas próximas tarefas.

module.exports = app;
