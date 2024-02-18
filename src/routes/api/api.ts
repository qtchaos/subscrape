import { Hono } from "hono";
import { Env } from "$lib/env";
import movie from "./movie/index";
import show from "./show/index";

const api = new Hono<{ Bindings: Env }>();

api.route("/movie", movie);
api.route("/show", show)

export default api;
