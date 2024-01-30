import { config } from "dotenv";
import { Node } from "../../../lib/node";
import z from "zod";

config();

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

export default defineEventHandler(async (event) => {
  const node = new Node(event);
  if (!process.env.TMDB_API_KEY) {
    node.setStatusCode(500);
    return {
      status: 500,
      error: "Internal Server Error",
      message: "Missing TMDB API key.",
    };
  }

  const tmdb = getRouterParam(event, "tmdb");
  try {
    tmdbSchema.parse(tmdb);
  } catch (error) {
    node.setStatusCode(500);
    return {
      status: 500,
      error: "Internal Server Error",
      message: "Missing or malformed TMDb id.",
    };
  }

  const res = await fetch(
    `https://api.themoviedb.org/3/movie/${tmdb}/external_ids?api_key=${process.env.TMDB_API_KEY}`
  );
  let data: externalIds = await res.json();

  try {
    data = externalIdsSchema.parse(data);
  } catch (error) {
    node.setStatusCode(404);
    return {
      status: 404,
      error: "Not Found",
      message: "No corresponding IMDb data key found.",
    };
  }

  const imdb = data.imdb_id;
  const redirect = node.buildUrl(`/api/movie/imdb/${imdb}`);

  node.setStatusCode(302);
  node.setHeader("Location", redirect);
  return {
    status: 302,
    message: `Redirecting to ${redirect}`,
  };
});
