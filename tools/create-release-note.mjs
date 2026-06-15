import { execFileSync } from "node:child_process";
import { appendFile, readdir, stat, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";

const recordingsRoot =
  process.platform === "win32"
    ? "D:\\OBS Recordings"
    : "/mnt/d/OBS Recordings";
const releaseNotesPath = resolve("src/server/RELEASE NOTES.md");
const devNotesPath = resolve("src/server/DEV NOTES.md");
const version = process.argv[2];
const checkMode = process.argv.includes("--check");
const guide = process.env.RELEASE_GUIDE?.trim();

if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
  throw new Error(
    "Usage: node tools/create-release-note.mjs <semantic-version>"
  );
}

if (!checkMode && !guide) {
  throw new Error("A release guide/dev note is required.");
}

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...await collectFiles(entryPath));
    } else if (
      entry.isFile() &&
      entry.name.toLowerCase().includes("cblog")
    ) {
      files.push(entryPath);
    }
  }

  return files;
}

async function findActiveCapCutRecording(directory, cblogFiles) {
  const entries = await readdir(directory, { withFileTypes: true });
  const cblogPaths = new Set(cblogFiles.map((filePath) => resolve(filePath)));
  const candidates = [];

  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }

    const filePath = join(directory, entry.name);
    const extension = entry.name.toLowerCase().split(".").pop();

    if (
      cblogPaths.has(resolve(filePath)) ||
      !["mkv", "mp4", "mov", "webm"].includes(extension)
    ) {
      continue;
    }

    const fileStats = await stat(filePath);
    candidates.push({ filePath, modifiedAt: fileStats.mtimeMs });
  }

  candidates.sort((left, right) => right.modifiedAt - left.modifiedAt);
  return candidates[0]?.filePath || "";
}

function readDurationSeconds(filePath) {
  const ffprobeCommand =
    process.platform === "win32" ? "ffprobe.exe" : "ffprobe";
  const output = execFileSync(
    ffprobeCommand,
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      filePath
    ],
    { encoding: "utf8" }
  ).trim();
  const duration = Number(output);

  if (!Number.isFinite(duration) || duration < 0) {
    throw new Error(`Could not read duration: ${basename(filePath)}`);
  }

  return duration;
}

function localDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDuration(totalSeconds) {
  let remaining = Math.round(totalSeconds);
  const hours = Math.floor(remaining / 3600);
  remaining -= hours * 3600;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining - minutes * 60;

  return `${hours}h ${minutes}m ${seconds}s`;
}

const now = new Date();
const todayKey = localDateKey(now);
const cblogFiles = await collectFiles(recordingsRoot);
const activeCapCutRecording = await findActiveCapCutRecording(
  recordingsRoot,
  cblogFiles
);
const files = activeCapCutRecording
  ? [...cblogFiles, activeCapCutRecording]
  : cblogFiles;
let allTimeSeconds = 0;
let todaySeconds = 0;
let todayFileCount = 0;

for (const filePath of files) {
  const duration = readDurationSeconds(filePath);
  const fileStats = await stat(filePath);

  allTimeSeconds += duration;

  if (localDateKey(fileStats.mtime) === todayKey) {
    todaySeconds += duration;
    todayFileCount += 1;
  }
}

const timestamp = now.toLocaleString("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZoneName: "short"
});
const workTime = [
  `- Today: ${formatDuration(todaySeconds)} (${todayFileCount} recordings)`,
  `- All time: ${formatDuration(allTimeSeconds)} (${files.length} recordings)`,
  `- Named CBlog recordings: ${cblogFiles.length}`,
  activeCapCutRecording
    ? `- Active CapCut recording: \`${basename(activeCapCutRecording)}\``
    : "- Active CapCut recording: none found"
].join("\n");

if (checkMode) {
  console.log(
    `Today: ${formatDuration(todaySeconds)} (${todayFileCount} recordings)`
  );
  console.log(
    `All time: ${formatDuration(allTimeSeconds)} (${files.length} recordings)`
  );
  console.log(`Named CBlog recordings: ${cblogFiles.length}`);
  console.log(
    activeCapCutRecording
      ? `Active CapCut recording: ${basename(activeCapCutRecording)}`
      : "Active CapCut recording: none found"
  );
  process.exit(0);
}

const entry = [
  `## v${version} - ${timestamp}`,
  "",
  "### Guide",
  "",
  guide,
  "",
  "### Recorded Work Time",
  "",
  workTime,
  ""
].join("\n");
const latestNotes = [
  `# Chat Bubble v${version}`,
  "",
  `Released: ${timestamp}`,
  "",
  "## Guide",
  "",
  guide,
  "",
  "## Developer Note",
  "",
  workTime,
  "",
  "Work time is the summed media duration of files containing `CBlog` in",
  "`D:\\OBS Recordings` plus the newest non-CBlog recording currently used",
  "as the active CapCut source. Today is grouped by last-modified date.",
  ""
].join("\n");

await writeFile(releaseNotesPath, latestNotes, "utf8");

try {
  await stat(devNotesPath);
} catch {
  await writeFile(
    devNotesPath,
    "# Chat Bubble Developer Notes\n\n",
    "utf8"
  );
}

await appendFile(devNotesPath, `${entry}\n`, "utf8");

console.log(`Release notes: ${releaseNotesPath}`);
console.log(`Developer notes: ${devNotesPath}`);
console.log(`Today: ${formatDuration(todaySeconds)}`);
console.log(`All time: ${formatDuration(allTimeSeconds)}`);
