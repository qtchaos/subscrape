import { Hono } from "hono";
import { Node } from "$lib/node";
import { Env } from "$lib/env";
import z from "zod";
import { env } from "hono/adapter";

const imdbSchema = z.string().regex(/tt\d{7}/);

const imdb = new Hono<{ Bindings: Env }>();

imdb.get("/:imdb", async (c) => {
  const node = new Node(c);
  const imdb = c.req.param("imdb");
  const { TVDB_API_KEY, CACHE_MAX_AGE } = env(c);

  if (!TVDB_API_KEY) {
    return c.json(
      {
        status: 500,
        error: "Internal Server Error",
        message: "TVDB API key is not defined.",
      },
      500
    );
  }

  try {
    imdbSchema.parse(imdb);
  } catch (error) {
    return c.json(
      {
        status: 400,
        error: "Bad Request",
        message: `Missing or malformed IMDb data key.`,
      },
      400
    );
  }

  const authToken: string = await fetch("https://api4.thetvdb.com/v4/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      apikey: TVDB_API_KEY,
    }),
  }).then((res) => res.json().then((resData) => resData.data.token));

  if (!authToken) {
    return c.json(
      {
        status: 500,
        error: "Internal Server Error",
        message: "Could not get TVDB auth token.",
      },
      500
    );
  }

  const tvdbId = await fetch(
    `https://api4.thetvdb.com/v4/search/remoteid/${imdb}`,
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }
  ).then((res) => res.json().then((resData) => resData.data[0].series.id));

  if (!tvdbId) {
    return c.json(
      {
        status: 404,
        error: "Not Found",
        message: "Could not find corresponding TVDb id.",
      },
      404
    );
  }

  const redirect = node.buildUrl(`/api/show/tvdb/${tvdbId}`);

  c.header("Cache-Control", `max-age=${CACHE_MAX_AGE || 86400}`);
  return c.redirect(redirect);
});

export default imdb;
