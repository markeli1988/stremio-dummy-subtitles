const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");

const manifest = {
  id: "com.matej.dummy-subtitles",
  version: "1.0.0",
  name: "Dummy Slovenian Subtitles",
  description: "Always provides a dummy Slovenian subtitle track",
  resources: ["subtitles"],
  types: ["movie", "series"],
  catalogs: []
};

const builder = new addonBuilder(manifest);

builder.defineSubtitlesHandler(async (args) => {
  console.log("=== SUBTITLE REQUEST ===");
  console.log(JSON.stringify(args, null, 2));
  console.log("========================");

  const subtitleUrl = process.env.TEST_SUBTITLE_URL;

  if (!subtitleUrl) {
    console.log("TEST_SUBTITLE_URL is missing");

    return {
      subtitles: [],
      cacheMaxAge: 0
    };
  }

  console.log("Returning Subtito subtitle through bridge");

  return {
    subtitles: [
      {
        id: "subtito-android-test",
        lang: "slv",
        url: subtitleUrl
      }
    ],
    cacheMaxAge: 0
  };
});

const PORT = process.env.PORT || 7000;

serveHTTP(builder.getInterface(), {
  port: PORT
});