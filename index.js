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

  if (!args.extra || !args.extra.videoHash) {
    console.log("NO HASH - returning nothing");

    return {
      subtitles: [],
      cacheMaxAge: 0
    };
  }

  console.log("HASH EXISTS - returning subtitle");

  return {
    subtitles: [
      {
        id: "dummy-hash-test",
        lang: "slv",
        url: "https://raw.githubusercontent.com/markelj1988/stremio-dummy-subtitles/main/empty.srt"
      }
    ],
    cacheMaxAge: 0
  };
});

const PORT = process.env.PORT || 7000;

serveHTTP(builder.getInterface(), {
  port: PORT
});