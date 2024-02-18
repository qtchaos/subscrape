import { Context } from "hono";
import { env } from "hono/adapter";

type Response = {
  status?: number;
  error?: string;
  message?: string;
  redirect?: string;
  [key: string]: any;
};

// Helper class to make it easier to work with the event object
export class Node {
  c: Context;
  constructor(context: Context) {
    this.c = context;
  }

  getParams() {
    if (!this.c.req.url.includes("?")) {
      return null;
    }
    return "?" + this.c.req.url.split("?")[1];
  }
  buildUrl(path: string) {
    const params = this.getParams();
    if (!params) {
      return path;
    }
    return path + params;
  }
  setCORS() {
    const { CORS_ALLOWED } = env(this.c);
    if (!CORS_ALLOWED) {
      this.c.header("Access-Control-Allow-Origin", "*");
    } else {
      this.c.header("Access-Control-Allow-Origin", CORS_ALLOWED);
    }

    this.c.header("Access-Control-Allow-Methods", "GET");
  }
}

export default Node;
