import { H3Event, EventHandlerRequest } from "h3";

// Helper class to make it easier to work with the event object
export class Node {
  event: H3Event<EventHandlerRequest>;
  constructor(event: H3Event<EventHandlerRequest>) {
    this.event = event;
  }
  setStatusCode(status: number) {
    this.event.node.res.statusCode = status;
  }
  setHeader(key: string, value: string) {
    this.event.node.res.setHeader(key, value);
  }
  getParams() {
    return "?" + this.event.node.req.url.split("?")[1];
  }
  buildUrl(path: string) {
    const params = this.getParams();
    return path + params;
  }
}
