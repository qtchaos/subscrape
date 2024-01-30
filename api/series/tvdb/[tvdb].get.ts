import { Node } from "../../../lib/node";
import z from "zod";
import { config } from "dotenv";
import { Logger } from "tslog";
import { getLangFromTitle } from "../../../lib/lang";

const logger = new Logger({
  name: "show",
  type: "pretty",
  hideLogPositionForProduction: true,
});

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

config();

export default defineEventHandler(async (event) => {
  const node = new Node(event);
  const rawQuery = getQuery(event);

  let query: z.infer<typeof querySchema>;
  try {
    query = querySchema.parse(rawQuery);
  } catch (error) {
    node.setStatusCode(400);
    return {
      status: 400,
      error: "Bad Request",
      message: error.message,
    };
  }

  // Get Episode IDs
  const tvdb = getRouterParam(event, "tvdb");
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
      "X-BetaSeries-Key": process.env.BETASERIES_API_KEY,
    },
  });

  const data = await response.json();
  try {
    episodeSchema.parse(data);
  } catch (error) {
    node.setStatusCode(404);
    return {
      status: 404,
      error: "Not Found",
      message: "Episode not found.",
    };
  }

  const { episodes }: z.infer<typeof episodeSchema> = data;
  if (episodes.length === 0) {
    node.setStatusCode(404);
    return {
      status: 404,
      error: "Not Found",
      message: "Episode not found.",
    };
  }

  const episodeId = episodes[0].id;

  const subtitlesUrl = new URL(`${baseUrl}/subtitles/episode`);
  subtitlesUrl.searchParams.append("id", episodeId.toString());
  subtitlesUrl.searchParams.append("locale", "en");

  const subtitlesResponse = await fetch(subtitlesUrl.toString(), {
    headers: {
      "X-BetaSeries-Key": process.env.BETASERIES_API_KEY,
    },
  });

  const subtitlesData: z.infer<typeof subtitleSchema> =
    await subtitlesResponse.json();

  try {
    subtitleSchema.parse(subtitlesData);
  } catch (error) {
    node.setStatusCode(404);
    return {
      status: 404,
      error: "Not Found",
      message: "Subtitles not found.",
    };
  }

  const rawSubtitles = subtitlesData.subtitles;
  let subtitles = rawSubtitles.map((subtitle) => {
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
    if (langs.has(subtitle.lang.code)) return false;
    langs.add(subtitle.lang.code);
    return true;
  });

  logger.info(
    `Found ${subtitles.length} subtitles for ${tvdb} S${season}E${episode}`
  );
  node.setStatusCode(200);
  return {
    count: subtitles.length,
    subtitles,
  };
});
