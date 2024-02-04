import { H3Event, EventHandlerRequest } from "h3";

type Response = {
  status?: number;
  error?: string;
  message?: string;
  redirect?: string;
  [key: string]: any;
};

// Helper class to make it easier to work with the event object
export class Node {
  event: H3Event<EventHandlerRequest>;
  constructor(event: H3Event<EventHandlerRequest>) {
    this.event = event;
  }
  env = process.env;

  setStatusCode(status: number) {
    this.event.node.res.statusCode = status;
  }
  setHeader(key: string, value: string) {
    this.event.node.res.setHeader(key, value);
  }
  getParams() {
    if (!this.event.node.req.url.includes("?")) {
      return null;
    }
    return "?" + this.event.node.req.url.split("?")[1];
  }
  buildUrl(path: string) {
    const params = this.getParams();
    if (!params) {
      return path;
    }
    return path + params;
  }
  setCORS() {
    if (!this.env.CORS_ALLOWED) {
      this.setHeader("Access-Control-Allow-Origin", "*");
    } else {
      this.setHeader("Access-Control-Allow-Origin", this.env.CORS_ALLOWED);
    }

    this.setHeader("Access-Control-Allow-Methods", "GET");
  }
  prepareResponse(body: string | Response) {
    let status: number = 200;

    if (typeof body === "object") {
      if (body.status) status = body.status;
      if (body.redirect) this.setHeader("Location", body.redirect);
      body = { ...body };
    }

    this.setStatusCode(status);
    this.setCORS();

    return typeof body === "string"
      ? { status, message: body }
      : { status, body };
  }
}
