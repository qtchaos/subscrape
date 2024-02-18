import { Hono } from "hono";
import { Env } from "$lib/env";
import { getLangFromTitle } from "$lib/lang";
import z from "zod";
import { env } from "hono/adapter";

const querySchema = z.object({
  season: z.coerce.number().min(1),
  episode: z.coerce.number().min(1),
  lang: z.string().min(2).max(2).optional(),
});

const episodeSchema = z.object({
  episodes: z.array(
    z.object({
      id: z.coerce.number(),
      season: z.coerce.number(),
      episode: z.coerce.number(),
    })
  ),
});

const subtitleSchema = z.object({
  subtitles: z.array(
    z.object({
      id: z.coerce.number(),
      file: z.string(),
      url: z.string(),
      quality: z.coerce.number(),
    })
  ),
});

const baseUrl = "https://api.betaseries.com";

const tvdb = new Hono<{ Bindings: Env }>();

tvdb.get("/:tvdb", async (c) => {
  const rawQuery = c.req.query();
  let query: z.infer<typeof querySchema>;
  const { BETASERIES_API_KEY, CACHE_MAX_AGE } = env(c);

  try {
    query = querySchema.parse(rawQuery);
  } catch (error: any) {
    return c.json(
      {
        status: 400,
        error: "Bad Request",
        message: error.message,
      },
      400
    );
  }

  // Get Episode IDs
  const tvdb = c.req.param("tvdb");
  const { season, episode, lang } = query;

  let episodesUrl = new URL(`${baseUrl}/shows/episodes`);
  episodesUrl.searchParams.append("thetvdb_id", tvdb);
  episodesUrl.searchParams.append("season", season.toString());
  episodesUrl.searchParams.append("episode", episode.toString());

  if (lang) {
    episodesUrl.searchParams.append("language", lang);
  }

  const response = await fetch(episodesUrl.toString(), {
    headers: {
      "X-BetaSeries-Key": BETASERIES_API_KEY,
    },
  });

  const data = await response.json();
  try {
    episodeSchema.parse(data);
  } catch (error) {
    return c.json(
      {
        status: 404,
        error: "Not Found",
        message: "Episode not found.",
      },
      404
    );
  }

  const { episodes }: z.infer<typeof episodeSchema> = data;
  if (episodes.length === 0) {
    return c.json(
      {
        status: 404,
        error: "Not Found",
        message: "Episode not found.",
      },
      404
    );
  }

  const episodeId = episodes[0].id;

  const subtitlesUrl = new URL(`${baseUrl}/subtitles/episode`);
  subtitlesUrl.searchParams.append("id", episodeId.toString());
  subtitlesUrl.searchParams.append("locale", "en");

  const subtitlesResponse = await fetch(subtitlesUrl.toString(), {
    headers: {
      "X-BetaSeries-Key": BETASERIES_API_KEY,
    },
  });

  const subtitlesData: z.infer<typeof subtitleSchema> =
    await subtitlesResponse.json();

  try {
    subtitleSchema.parse(subtitlesData);
  } catch (error) {
    return c.json(
      {
        status: 404,
        error: "Not Found",
        message: "Subtitles not found.",
      },
      404
    );
  }

  const rawSubtitles = subtitlesData.subtitles;
  let subtitles: {
    lang: {
      code: string;
      name: string;
    } | null;
    url: string;
  }[] = rawSubtitles.map((subtitle) => {
    const { file, url } = subtitle;
    const lang = getLangFromTitle(file);
    return {
      lang,
      url,
    };
  });

  // Remove subtitles with no language
  subtitles = subtitles.filter((subtitle) => subtitle.lang !== null);

  // Remove subtitles with duplicate languages
  const langs = new Set();
  subtitles = subtitles.filter((subtitle) => {
    if (!subtitle.lang) return false;
    if (langs.has(subtitle.lang.code)) return false;
    langs.add(subtitle.lang.code);
    return true;
  });

  c.header("Cache-Control", `public, max-age=${CACHE_MAX_AGE || 86400}`);
  return c.json({
    count: subtitles.length,
    subtitles,
  });
});

export default tvdb;
