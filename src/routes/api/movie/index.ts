import { Hono } from "hono";
import { Env } from "$lib/env";
import imdb from "./imdb";
import tmdb from "./tmdb";

const movie = new Hono<{ Bindings: Env }>();

movie.route("/imdb", imdb);
movie.route("/tmdb", tmdb);

export default movie;
