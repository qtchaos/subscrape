import { Node } from "../lib/node";

export default defineEventHandler(async (event) => {
  const node = new Node(event);
  node.setStatusCode(200);
  return {
    status: 200,
    body: "Hello, world!",
  };
});
