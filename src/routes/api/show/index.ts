import { Hono } from "hono";
import { Env } from "$lib/env";
import imdb from "./imdb";
import tmdb from "./tmdb";
import tvdb from "./tvdb";

const show = new Hono<{ Bindings: Env }>();

show.route("/imdb", imdb);
show.route("/tmdb", tmdb);
show.route("/tvdb", tvdb);

export default show;
