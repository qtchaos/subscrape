import { Hono } from "hono";
import { env } from "hono/adapter";
import z from "zod";

import { Node } from "$lib/node";
import { Env } from "$lib/env";

const tmdb = new Hono<{ Bindings: Env }>();

const tmdbSchema = z.string().regex(/^\d{1,7}$/);
const externalIdsSchema = z.object({
  id: z.coerce.number(),
  imdb_id: z.string(),
  wikidata_id: z.string().nullable(),
  facebook_id: z.string().nullable(),
  instagram_id: z.string().nullable(),
  twitter_id: z.string().nullable(),
});

type externalIds = z.infer<typeof externalIdsSchema>;

tmdb.get(
  "/:tmdb",
  async (c) => {
    const node = new Node(c);
    const { TMDB_API_KEY, CACHE_MAX_AGE } = env(c);

    if (!TMDB_API_KEY) {
      return c.json(
        {
          status: 500,
          error: "Internal Server Error",
          message: "Missing TMDB API key.",
        },
        500
      );
    }

    const tmdb = c.req.param("tmdb");
    try {
      tmdbSchema.parse(tmdb);
    } catch (error) {
      return c.json(
        {
          status: 500,
          error: "Internal Server Error",
          message: "Missing or malformed TMDb id.",
        },
        500
      );
    }

    const res = await fetch(
      `https://api.themoviedb.org/3/movie/${tmdb}/external_ids?api_key=${TMDB_API_KEY}`
    );
    let data: externalIds = await res.json();

    try {
      data = externalIdsSchema.parse(data);
    } catch (error) {
      return c.json(
        {
          status: 404,
          error: "Not Found",
          message: "No corresponding IMDb data key found.",
        },
        404
      );
    }

    const imdb = data.imdb_id;
    const redirect = node.buildUrl(`/api/movie/imdb/${imdb}`);

    c.header("Cache-Control", `max-age=${CACHE_MAX_AGE || 86400}`);
    return c.redirect(redirect);
  }
);

export default tmdb;
