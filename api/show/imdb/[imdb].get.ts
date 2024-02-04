import { Node } from "../../../lib/node";
import z from "zod";

const imdbSchema = z.string().regex(/tt\d{7}/);

export default defineEventHandler(async (event) => {
  const node = new Node(event);
  const imdb = getRouterParam(event, "imdb");
  if (!process.env.TVDB_API_KEY) {
    return node.prepareResponse({
      status: 500,
      error: "Internal Server Error",
      message: "TVDB API key is not defined.",
    });
  }

  try {
    imdbSchema.parse(imdb);
  } catch (error) {
    return node.prepareResponse({
      status: 400,
      error: "Bad Request",
      message: `Missing or malformed IMDb data key.`,
    });
  }

  const authToken: string = await fetch("https://api4.thetvdb.com/v4/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      apikey: process.env.TVDB_API_KEY,
    }),
  }).then((res) => res.json().then((resData) => resData.data.token));

  if (!authToken) {
    return node.prepareResponse({
      status: 500,
      error: "Internal Server Error",
      message: "Could not get TVDB auth token.",
    });
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
    return node.prepareResponse({
      status: 404,
      error: "Not Found",
      message: "Could not find corresponding TVDb id.",
    });
  }

  const redirect = node.buildUrl(`/api/series/tvdb/${tvdbId}`);

  return node.prepareResponse({
    status: 302,
    redirect,
  });
});