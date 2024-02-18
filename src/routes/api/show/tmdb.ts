import { Hono } from "hono";
import { Node } from "$lib/node";
import { Env } from "$lib/env";
import { env } from "hono/adapter";
import z from "zod";

const tmdbSchema = z.string().regex(/^\d{1,7}$/);

const tmdb = new Hono<{ Bindings: Env }>();

tmdb.get(
  "/:tmdb",
  async (c) => {
    const node = new Node(c);
    const tmdb = c.req.param("tmdb");
    const { TMDB_API_KEY, CACHE_MAX_AGE } = env(c);

    try {
      tmdbSchema.parse(tmdb);
    } catch (error) {
      return c.json({
        status: 500,
        error: "Internal Server Error",
        message: "Missing or malformed TMDb id.",
      });
    }

    const res = await fetch(
      `https://api.themoviedb.org/3/tv/${tmdb}/external_ids?api_key=${TMDB_API_KEY}`
    );

    let data = await res.json();
    if (data.status_code === 34) {
      return c.json({
        status: 404,
        error: "Not Found",
        message: "No corresponding IMDb data key found.",
      });
    }

    const imdb = data.imdb_id;
    const redirect = node.buildUrl(`/api/show/imdb/${imdb}`);

    c.header("Cache-Control", `max-age=${CACHE_MAX_AGE || 86400}`);
    return c.redirect(redirect);
  }
);

export default tmdb;
