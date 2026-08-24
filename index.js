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

  return {
    subtitles: [
      {
        id: "dummy-sl",
        lang: "slv",
        url: "https://raw.githubusercontent.com/markelj1988/stremio-dummy-subtitles/main/empty.srt"
      }
    ]
  };
});

const PORT = process.env.PORT || 7000;

serveHTTP(builder.getInterface(), {
  port: PORT
});