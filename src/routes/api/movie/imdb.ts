import { Hono } from "hono";

import { load } from "cheerio";
import z from "zod";
import { getCode, getName } from "$lib/lang";
import { RatedSubtitle, Subtitle } from "$lib/types";

import { Env } from "$lib/env";
import { env } from "hono/adapter";

const imdb = new Hono<{ Bindings: Env }>();

const baseUrls = ["https://yts-subs.org", "https://yifysubtitles.ch"];

const imdbSchema = z.string().regex(/tt\d{7}/);
const querySchema = z.object({
  rating: z.coerce.number().optional(),
  lang: z.string().optional(),
});

imdb.get("/:imdb", async (c) => {
  let query: z.infer<typeof querySchema> = {};
  const { CACHE_MAX_AGE } = env(c);

  if (c.req.query("rating")) {
    try {
      querySchema.parse(c.req.query("rating"));
    } catch (error: any) {
      return c.json(
        {
          status: 400,
          error: "Bad Request",
          message: `Error parsing rating: ${error.message}`,
        },
        400
      );
    }

    query = { ...query, rating: Number(c.req.query("rating")) };
  }

  if (c.req.query("lang")) {
    try {
      querySchema.parse(c.req.query("lang"));
    } catch (error: any) {
      return c.json(
        {
          status: 400,
          error: "Bad Request",
          message: `Error parsing lang: ${error.message}`,
        },
        400
      );
    }
    query = { ...query, lang: c.req.query("lang") };
  }

  const imdb = c.req.param("imdb");
  try {
    imdbSchema.parse(imdb);
  } catch (error: any) {
    return c.json(
      {
        status: 400,
        error: "Bad Request",
        message: "Invalid IMDB ID",
      },
      400
    );
  }

  const chosenBaseUrl = baseUrls[Math.floor(Math.random() * baseUrls.length)];
  const url = `${chosenBaseUrl}/movie-imdb/${imdb}`;
  const yifyPage = await fetch(url);

  const $ = load(await yifyPage.text());
  const subtitleLinks = $("tbody").find("tr");
  if (!subtitleLinks.length || subtitleLinks.length === 0) {
    return c.json(
      {
        status: 404,
        error: "Not Found",
        message: "No subtitles found",
      },
      404
    );
  }

  let ratedSubtitles: RatedSubtitle[] = subtitleLinks
    .map((_, el) => {
      const url = `https://yifysubtitles.ch${$(el)
        .find("a")!
        .attr("href")!
        .replace("subtitles", "subtitle")}.zip`;
      const name = getName($(el).find(".sub-lang").text());
      const code = getCode(name);
      const rating = Number($(el).find(".rating-cell").find("span").text());

      return {
        lang: {
          code,
          name,
        },
        rating,
        url,
      };
    })
    .get();

  if (query.rating) {
    ratedSubtitles = ratedSubtitles.filter(
      (subtitle) => subtitle.rating >= Number(query.rating) // stupid typescript, we dont actually NEED to cast this to a number
    );
  }

  // Sort by rating
  ratedSubtitles = ratedSubtitles.sort((a, b) => b.rating - a.rating);

  // once we have the subtitles, we can remove the rating property
  let subtitles: Subtitle[] = ratedSubtitles.map((subtitle) => {
    const { rating, ...rest } = subtitle;
    return rest;
  });

  // Remove duplicate languages
  let langs = [...new Set(subtitles.map((subtitle) => subtitle.lang.code))];

  if (query.lang) {
    subtitles = subtitles.filter(
      (subtitle) => subtitle.lang.code === query.lang
    );
  }

  // Filters out lower rated subtitles if there are multiple entries for the same language
  subtitles = subtitles.filter((subtitle) => {
    if (langs.includes(subtitle.lang.code)) {
      langs = langs.filter((lang) => lang !== subtitle.lang.code);
      return true;
    }
    return false;
  });

  c.header("Cache-Control", `max-age=${CACHE_MAX_AGE || 86400}`);
  return c.json({
    count: subtitles.length,
    subtitles,
  });
});

export default imdb;
