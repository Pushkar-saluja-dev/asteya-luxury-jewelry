const serverless = require("serverless-http");

// Load the pre-compiled, bundled CommonJS server file
const app = require("../../dist/server.cjs").default;

exports.handler = serverless(app);
