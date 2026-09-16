const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    // Aponta sempre para a cópia de teste isolada (rastreador-de-leitura-testes),
    // nunca para o app real (5173/3001) — evita resetar/apagar dados reais.
    baseUrl: "http://localhost:5174",

    env: {
      apiUrl: "http://localhost:3002",
    },

    setupNodeEvents(on, config) {
      // eventos do Cypress
    },
  },
});
