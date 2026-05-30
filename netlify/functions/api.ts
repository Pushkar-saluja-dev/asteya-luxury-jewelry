import serverless from "serverless-http";
import app from "../../server";

// Serverless handler that wraps our Express API app
export const handler = serverless(app);
