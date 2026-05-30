import serverless from "serverless-http";
import app from "./server";

// Serverless handler wrapped for Netlify
export const handler = serverless(app);
