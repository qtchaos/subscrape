import { Node } from "../lib/node";
import { version } from "../package.json";
export default defineEventHandler(async (event) => {
  const node = new Node(event);

  return node.prepareResponse(`SubScraper is working properly (v${version})`);
});
