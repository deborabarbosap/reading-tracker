const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173",

    env: {
      apiUrl: "http://localhost:3001",
    },

    setupNodeEvents(on, config) {
      // eventos do Cypress
    },
  },
});
