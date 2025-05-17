const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.1",
    info: {
      title: "APIs",
      version: "2.0.0",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 9999}`,
      },
    ],
    components: {
      securitySchemes: {
        JWT: {
          name: "User Authorization",
          description: "Value: Bearer {token}",
          type: "apiKey",
          scheme: "bearer",
          in: "header",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./routes/*.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

const options = {
  customCss: ".swagger-ui .topbar { display: none }",
};

module.exports = swaggerUi.setup(swaggerDocs, options);
