import { Node } from "../../../lib/node";
import z from "zod";

const tmdbSchema = z.string().regex(/^\d{1,7}$/);

export default defineEventHandler(async (event) => {
  const node = new Node(event);
  const tmdb = getRouterParam(event, "tmdb");

  try {
    tmdbSchema.parse(tmdb);
  } catch (error) {
    return node.prepareResponse({
      status: 500,
      error: "Internal Server Error",
      message: "Missing or malformed TMDb id.",
    });
  }

  const res = await fetch(
    `https://api.themoviedb.org/3/tv/${tmdb}/external_ids?api_key=${process.env.TMDB_API_KEY}`
  );

  let data = await res.json();
  if (data.status_code === 34) {
    return node.prepareResponse({
      status: 404,
      error: "Not Found",
      message: "No corresponding IMDb data key found.",
    });
  }

  const imdb = data.imdb_id;
  const redirect = node.buildUrl(`/api/series/imdb/${imdb}`);

  return node.prepareResponse({
    status: 302,
    redirect,
  });
});
