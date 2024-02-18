declare global {
  namespace NodeJS {
    interface ProcessEnv {
      TMDB_API_KEY: string;
      TVDB_API_KEY: string;
      BETASERIES_API_KEY: string;
      CORS_ALLOWED: string;
      CACHE_MAX_AGE: number;
    }
  }
}

export type Subtitle = {
  lang: {
    code: string;
    name: string;
  };
  url: string;
};

export type RatedSubtitle = {
  rating: number;
} & Subtitle;
