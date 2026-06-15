const fs = require("node:fs");
const path = require("node:path");
const readline = require("node:readline/promises");

const envPath = path.join(__dirname, ".env");

function readSavedApiKey() {
  if (!fs.existsSync(envPath)) {
    return "";
  }

  const contents = fs.readFileSync(envPath, "utf8");
  const match = contents.match(/^YOUTUBE_API_KEY=(.*)$/m);

  return match?.[1].trim() || "";
}

function extractVideoId(input) {
  const patterns = [
    /youtube\.com\/watch\?.*?[?&]v=([A-Za-z0-9_-]+)/,
    /youtube\.com\/live\/([A-Za-z0-9_-]+)/,
    /youtu\.be\/([A-Za-z0-9_-]+)/
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);

    if (match) {
      return match[1];
    }
  }

  return input;
}

async function configure() {
  const prompt = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    let apiKey = readSavedApiKey();

    if (!apiKey) {
      console.log("");
      console.log("First-time setup:");
      console.log("Paste your YouTube Data API v3 key.");
      console.log("It is saved only in this folder.");
      apiKey = (await prompt.question("API key: ")).trim();
    }

    if (!apiKey) {
      throw new Error("A YouTube API key is required.");
    }

    console.log("");
    console.log("Get the livestream link:");
    console.log("  1. Open the livestream on YouTube.");
    console.log("  2. Click Share.");
    console.log("  3. Click Copy.");
    console.log("  4. Paste the full link below.");
    console.log("");
    console.log("Example: https://youtu.be/AbCdEf12345");

    const videoInput = (
      await prompt.question("Livestream link: ")
    ).trim();
    const videoId = extractVideoId(videoInput);

    if (!/^[A-Za-z0-9_-]{6,}$/.test(videoId)) {
      throw new Error(
        "That is not a video link. Open the livestream's normal " +
        "YouTube page, then click Share > Copy."
      );
    }

    fs.writeFileSync(
      envPath,
      `YOUTUBE_API_KEY=${apiKey}\nYOUTUBE_VIDEO_ID=${videoId}\n`,
      { encoding: "utf8", mode: 0o600 }
    );

    console.log("Livestream selected.");
  } finally {
    prompt.close();
  }
}

configure().catch((error) => {
  console.error("");
  console.error(error.message);
  process.exitCode = 1;
});
