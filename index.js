const {
  addonBuilder,
  getRouter
} = require("stremio-addon-sdk");

const express = require("express");

const manifest = {
  id: "com.matej.dummy-subtitles",
  version: "1.0.1",
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

  return {
    subtitles: [
      {
        id: "subtito-bridge",
        lang: "slv",

        // vsak request dobi unikaten URL
        url: `${PUBLIC_URL}/bridge.srt?v=${Date.now()}`
      }
    ],

    cacheMaxAge: 0
  };
});

const app = express();

app.get("/bridge.srt", async (req, res) => {

  try {

    const subtitoUrl = process.env.TEST_SUBTITLE_URL;

    if (!subtitoUrl) {
      return res.status(500).send("TEST_SUBTITLE_URL missing");
    }

    console.log("Fetching fresh subtitle from Subtito...");

    const response = await fetch(subtitoUrl);

    if (!response.ok) {
      console.log("Subtito error:", response.status);
      return res
        .status(502)
        .send(`Subtito returned ${response.status}`);
    }

    const subtitle = await response.text();

    console.log(
      "Subtitle received:",
      subtitle.length,
      "characters"
    );

    res.set({
      "Content-Type": "application/x-subrip; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    });

    res.send(subtitle);

  } catch (error) {

    console.error("Bridge error:", error);

    res.status(500).send("Subtitle bridge error");
  }
});

app.use(getRouter(builder.getInterface()));

const PORT = process.env.PORT || 7000;

app.listen(PORT, () => {
  console.log(`Addon running on port ${PORT}`);
});