const { addonBuilder, getRouter } = require("stremio-addon-sdk");
const express = require("express");

const manifest = {
  id: "com.matej.dummy-subtitles",
  version: "1.0.2",
  name: "Dummy Slovenian Subtitles",
  description: "Subtito Android TV bridge",
  resources: ["subtitles"],
  types: ["movie", "series"],
  catalogs: []
};

const builder = new addonBuilder(manifest);

const PUBLIC_URL =
  process.env.PUBLIC_URL ||
  "http://127.0.0.1:7000";


builder.defineSubtitlesHandler(async (args) => {

  console.log("=== SUBTITLE REQUEST ===");
  console.log(JSON.stringify(args, null, 2));
  console.log("========================");

  const timestamp = Date.now();

  return {
    subtitles: [
      {
        id: `subtito-bridge-${timestamp}`,
        lang: "slv",
        url: `${PUBLIC_URL}/bridge.srt?v=${timestamp}`
      }
    ],
    cacheMaxAge: 0
  };
});


const app = express();


/*
 * Subtitle bridge
 *
 * Ne prenašamo SRT preko Renderja.
 * Android TV samo preusmerimo direktno na Subtito URL.
 */
app.get("/bridge.srt", (req, res) => {

  const subtitoUrl = process.env.TEST_SUBTITLE_URL;

  if (!subtitoUrl) {

    console.log("TEST_SUBTITLE_URL missing");

    return res
      .status(500)
      .send("TEST_SUBTITLE_URL missing");
  }

  console.log("=== BRIDGE REQUEST ===");
  console.log("Redirecting client to Subtito");
  console.log("======================");

  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0"
  });

  res.redirect(302, subtitoUrl);
});


/*
 * Stremio addon routes:
 *
 * /manifest.json
 * /subtitles/...
 */
app.use(getRouter(builder.getInterface()));


const PORT = process.env.PORT || 7000;

app.listen(PORT, () => {

  console.log(`Addon running on port ${PORT}`);
  console.log(`Public URL: ${PUBLIC_URL}`);

});