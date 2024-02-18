import { serve } from "@hono/node-server";
import { Hono } from "hono";
import api from "./routes/api/api";
import { version } from "../package.json";
import { config } from "dotenv";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const app = new Hono();

config();

let origin: string[] = process.env.CORS_ALLOWED?.split(",") || ["*"];

app.use(
  "*",
  cors({
    origin,
  }),
  logger()
);

app.get("/", (c) => {
  return c.json({
    status: 200,
    message: `SubScraper is working properly (v${version})`,
  });
});

app.route("/api", api);

console.log("Server is running @ http://localhost:3000.");

serve(app);
