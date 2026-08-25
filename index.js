const { addonBuilder, getRouter } = require("stremio-addon-sdk");
const express = require("express");

const manifest = {
  id: "com.matej.dummy-subtitles",
  version: "1.1.0",
  name: "Subtito Slovenian Bridge",
  description: "Android TV compatibility bridge for Subtito Slovenian subtitles",
  resources: ["subtitles"],
  types: ["movie", "series"],
  catalogs: []
};

const builder = new addonBuilder(manifest);

const PUBLIC_URL =
  process.env.PUBLIC_URL ||
  "http://127.0.0.1:7000";

const SUBTITO_BASE_URL = process.env.SUBTITO_BASE_URL;


// ---------------------------------------------------------
// Build Subtito addon request
// ---------------------------------------------------------

function buildSubtitoRequest(args) {

  const type = encodeURIComponent(args.type);
  const id = encodeURIComponent(args.id);

  const extra = args.extra || {};

  const extraParts = [];

  /*
   * TV praviloma pošlje filename + videoSize.
   * Točno tak request sva videla tudi pri delujočem
   * Subtito requestu na PC-ju.
   */
  if (extra.filename) {
    extraParts.push(
      `filename=${encodeURIComponent(extra.filename)}`
    );
  }

  if (extra.videoSize) {
    extraParts.push(
      `videoSize=${encodeURIComponent(extra.videoSize)}`
    );
  }

  /*
   * Če filename ni na voljo, uporabimo videoHash kot fallback.
   */
  if (!extra.filename && extra.videoHash) {
    extraParts.push(
      `videoHash=${encodeURIComponent(extra.videoHash)}`
    );
  }

  let url =
    `${SUBTITO_BASE_URL}/subtitles/${type}/${id}`;

  if (extraParts.length > 0) {
    url += `/${extraParts.join("&")}`;
  }

  url += ".json";

  return url;
}


// ---------------------------------------------------------
// Stremio subtitle handler
// ---------------------------------------------------------

builder.defineSubtitlesHandler(async (args) => {

  console.log("");
  console.log("=== STREMIO SUBTITLE REQUEST ===");
  console.log(JSON.stringify(args, null, 2));

  if (!SUBTITO_BASE_URL) {

    console.log("SUBTITO_BASE_URL missing");

    return {
      subtitles: [],
      cacheMaxAge: 0
    };
  }

  try {

    const subtitoRequestUrl =
      buildSubtitoRequest(args);

    console.log(
      "Requesting subtitles from Subtito"
    );

    /*
     * Namenoma ne izpisujemo celega URL-ja,
     * ker vsebuje uporabniški Subtito ključ.
     */

    const response = await fetch(
      subtitoRequestUrl,
      {
        headers: {
          "Accept": "application/json",
          "User-Agent": "Stremio-Subtito-Android-Bridge/1.1"
        }
      }
    );

    console.log(
      "Subtito response status:",
      response.status
    );

    if (!response.ok) {

      console.log(
        "Subtito request failed:",
        response.status
      );

      return {
        subtitles: [],
        cacheMaxAge: 0
      };
    }

    const data = await response.json();

    console.log(
      "Subtitles returned:",
      data.subtitles?.length || 0
    );

    if (
      !data.subtitles ||
      data.subtitles.length === 0
    ) {

      return {
        subtitles: [],
        cacheMaxAge: 0
      };
    }


    /*
     * Pretvorimo Subtito rezultate.
     *
     * Ključna sprememba:
     *
     * Subtito:
     * lang = "🟢 slovenski jezik"
     *
     * Android bridge:
     * lang = "slv"
     */

    const subtitles =
      data.subtitles.map((subtitle, index) => {

        /*
         * Originalni Subtito SRT URL zakodiramo.
         * Bridge ga bo nato dekodiral in naredil
         * 302 redirect.
         */

        const encodedUrl =
          Buffer
            .from(subtitle.url, "utf8")
            .toString("base64url");

        const timestamp = Date.now();

        return {
          id:
            `subtito-sl-${index}-${timestamp}`,

          lang: "slv",

          url:
            `${PUBLIC_URL}/bridge.srt` +
            `?u=${encodedUrl}` +
            `&v=${timestamp}`
        };
      });


    console.log(
      "Returning subtitles to Android TV:",
      subtitles.length
    );

    return {
      subtitles,
      cacheMaxAge: 0
    };

  } catch (error) {

    console.error(
      "Subtitle handler error:",
      error
    );

    return {
      subtitles: [],
      cacheMaxAge: 0
    };
  }

});


// ---------------------------------------------------------
// Express
// ---------------------------------------------------------

const app = express();


// ---------------------------------------------------------
// Subtitle redirect bridge
// ---------------------------------------------------------

app.get("/bridge.srt", (req, res) => {

  try {

    const encodedUrl = req.query.u;

    if (!encodedUrl) {
      return res
        .status(400)
        .send("Missing subtitle URL");
    }

    const subtitoUrl =
      Buffer
        .from(encodedUrl, "base64url")
        .toString("utf8");


    /*
     * Security:
     *
     * Ker je addon javno dostopen, preverimo,
     * da /bridge.srt ne postane poljuben
     * internet redirect endpoint.
     */

    const parsedUrl =
      new URL(subtitoUrl);

    if (
      parsedUrl.protocol !== "https:" ||
      (
        parsedUrl.hostname !== "subtito.com" &&
        !parsedUrl.hostname.endsWith(".subtito.com")
      )
    ) {

      console.log(
        "Blocked invalid redirect target"
      );

      return res
        .status(403)
        .send("Invalid subtitle target");
    }


    console.log(
      "Redirecting client to Subtito SRT"
    );


    res.set({
      "Cache-Control":
        "no-store, no-cache, must-revalidate",

      "Pragma": "no-cache",

      "Expires": "0"
    });


    res.redirect(
      302,
      subtitoUrl
    );

  } catch (error) {

    console.error(
      "Bridge redirect error:",
      error
    );

    res
      .status(500)
      .send("Subtitle bridge error");
  }

});


// ---------------------------------------------------------
// Stremio addon routes
// ---------------------------------------------------------

app.use(
  getRouter(
    builder.getInterface()
  )
);


// ---------------------------------------------------------
// Start server
// ---------------------------------------------------------

const PORT =
  process.env.PORT || 7000;


app.listen(
  PORT,
  () => {

    console.log(
      `Addon running on port ${PORT}`
    );

    console.log(
      `Public URL: ${PUBLIC_URL}`
    );

    console.log(
      `Subtito configured: ${Boolean(SUBTITO_BASE_URL)}`
    );

  }
);