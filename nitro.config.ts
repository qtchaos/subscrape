import { config } from "dotenv";

config();

//https://nitro.unjs.io/config

export default defineNitroConfig({
  routeRules: {
    "/api/**": {
      cache: {
        maxAge: Number(process.env.CACHE_MAX_AGE) || 60 * 60 * 24,
      },
    },
  },
});
