# YifySubtitles

Scrapes subtitles from various sites for both movies and tv shows.

## Movie Specification

- `/api/movie/imdb/<imdb_id>` - Scrapes subtitles using an IMDb id
- `/api/movie/tmdb/<tmdb_id>` - Converts a TMDb id to a IMDb id and redirects you to `/imdb/`, along with the query parameters

  Both of these routes return the same success response, which is a list of subtitles with the following format:

```json
[
  {
    "lang": {
      "code": "en",
      "name": "English"
    },
    "rating": "10",
    "url": "https://yifysubtitles.ch/subtitle/somethinghere.zip"
  }
]
```

You can also add a few query parameters to the request:

- `?lang=<lang>` - Filter subtitles by language code (ISO 639-1 + read below)
- `?rating=<rating>` - Filter subtitles by rating (greater than or equal to)

Some of the languages that are available on the website are not ISO 639-1 compliant, so I had to resort to other standards:

- Chinese (GBK/Simplified): zh-Hans
- Chinese (BIG5/Traditional): zh-Hant
- Brazilian Portuguese: pt-BR

Keep in mind that the ISO 639-1 compliant Chinese `zh` language code is also supported in addition to the above two.
Some non ISO 639-1 compliant languages, dialects, scripts or encodings might not be added yet, if you encounter one, please open an issue or pull request.

## Show Specification

- `/api/show/imdb/<imdb_id>` - Converts IMDb data key to TVDb id and redirects you along with the query parameters.
- `/api/show/tmdb/<tmdb_id>` - Converts TMDb id to IMDb data key and redirects you along with the query parameters.
- `/api/show/tvdb/<tmdb_id>` - Scrapes subtitles using a TVDb id

All of these routes return the same success response, which is a list of subtitles with the following format:

```json
[
  {
    "lang": {
      "code": "en",
      "name": "English"
    },
    "url": "https://example.com/subtitle/somethinghere.srt",
    // OR Redirects to the subtitle file which COULD be a zip file
    "url": "https://example.com/subtitle/somethinghere"
  }
]
```

You also have to add a few query parameters to the request:

- `season=<season>` - The season number
- `episode=<episode>` - The episode number

And you can also specify the language:

- `?lang=<lang>` - Filter subtitles by language code (ISO 639-1)

## Environment Variables

Follow the `.env.example` file to set up your environment variables, you can get a TMDb API key [here](https://www.themoviedb.org/settings/api).
For the `BETASERIES_API_KEY` variable, you can get an API key [here](https://www.betaseries.com/en/registration/account), then go to the settings, and scroll down till you find "Develop with the API", copy the shorter API key, not the OAuth one.
