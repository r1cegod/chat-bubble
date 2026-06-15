import { createHash } from "node:crypto";
import { basename, resolve } from "node:path";
import { readFile, writeFile, appendFile } from "node:fs/promises";

const API_ROOT = "https://www.virustotal.com/api/v3";
const DIRECT_UPLOAD_LIMIT = 32 * 1024 * 1024;
const MAX_UPLOAD_SIZE = 650 * 1024 * 1024;
const POLL_INTERVAL_MS = 30_000;
const POLL_TIMEOUT_MS = 20 * 60_000;

const [fileArgument, outputDirectoryArgument = "."] = process.argv.slice(2);
const apiKey = process.env.VIRUSTOTAL_API_KEY;

if (!fileArgument) {
  throw new Error(
    "Usage: node tools/virustotal-scan.mjs <file> [output-directory]"
  );
}

if (!apiKey) {
  throw new Error(
    "VIRUSTOTAL_API_KEY is missing. Add it as a GitHub Actions secret."
  );
}

const filePath = resolve(fileArgument);
const outputDirectory = resolve(outputDirectoryArgument);
const fileContents = await readFile(filePath);

if (fileContents.byteLength > MAX_UPLOAD_SIZE) {
  throw new Error("VirusTotal accepts files up to 650 MB.");
}

const sha256 = createHash("sha256").update(fileContents).digest("hex");

function delay(milliseconds) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));
}

async function parseResponse(response) {
  const text = await response.text();
  let body = {};

  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text.slice(0, 500) };
    }
  }

  if (!response.ok) {
    const detail =
      body?.error?.message ||
      body?.raw ||
      `${response.status} ${response.statusText}`;
    throw new Error(`VirusTotal request failed: ${detail}`);
  }

  return body;
}

async function getJson(url) {
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        "x-apikey": apiKey
      }
    });

    if (response.status !== 429 && response.status < 500) {
      return parseResponse(response);
    }

    if (attempt === 5) {
      return parseResponse(response);
    }

    const retryAfterSeconds = Number(response.headers.get("retry-after"));
    const waitMilliseconds = Number.isFinite(retryAfterSeconds)
      ? retryAfterSeconds * 1000
      : 60_000;

    await delay(waitMilliseconds);
  }

  throw new Error("VirusTotal request retry loop ended unexpectedly.");
}

function assertVirusTotalUploadUrl(url) {
  const parsed = new URL(url);
  const trustedHost =
    parsed.hostname === "virustotal.com" ||
    parsed.hostname.endsWith(".virustotal.com");

  if (parsed.protocol !== "https:" || !trustedHost) {
    throw new Error("VirusTotal returned an untrusted upload URL.");
  }
}

async function uploadFile() {
  let uploadUrl = `${API_ROOT}/files`;

  if (fileContents.byteLength > DIRECT_UPLOAD_LIMIT) {
    const uploadUrlResponse = await getJson(`${API_ROOT}/files/upload_url`);
    uploadUrl = uploadUrlResponse.data;
    assertVirusTotalUploadUrl(uploadUrl);
  }

  const form = new FormData();
  form.append(
    "file",
    new Blob([fileContents], { type: "application/zip" }),
    basename(filePath)
  );

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      accept: "application/json",
      "x-apikey": apiKey
    },
    body: form
  });
  const body = await parseResponse(response);

  if (!body?.data?.id) {
    throw new Error("VirusTotal upload did not return an analysis ID.");
  }

  return body.data.id;
}

async function waitForAnalysis(analysisId) {
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    await delay(POLL_INTERVAL_MS);

    const analysis = await getJson(`${API_ROOT}/analyses/${analysisId}`);
    const status = analysis?.data?.attributes?.status;

    if (status === "completed") {
      return analysis;
    }

    if (status && status !== "queued" && status !== "in-progress") {
      throw new Error(`VirusTotal analysis ended with status "${status}".`);
    }
  }

  throw new Error("VirusTotal analysis did not finish within 20 minutes.");
}

function normalizedStats(stats = {}) {
  return {
    malicious: Number(stats.malicious || 0),
    suspicious: Number(stats.suspicious || 0),
    harmless: Number(stats.harmless || 0),
    undetected: Number(stats.undetected || 0),
    timeout: Number(stats.timeout || 0),
    failure: Number(stats.failure || 0),
    unsupported: Number(stats["type-unsupported"] || 0)
  };
}

function markdownReport(report) {
  const verdict = report.safe ? "PASS" : "BLOCKED";

  return [
    "## Release safety",
    "",
    `**Verdict:** ${verdict}`,
    "",
    `- SHA-256: \`${report.sha256}\``,
    `- Malicious: **${report.stats.malicious}**`,
    `- Suspicious: **${report.stats.suspicious}**`,
    `- Harmless: ${report.stats.harmless}`,
    `- Undetected: ${report.stats.undetected}`,
    `- VirusTotal report: ${report.reportUrl}`,
    "",
    report.safe
      ? "The release gate found no malicious or suspicious engine results."
      : "Release publication was blocked by the VirusTotal gate.",
    ""
  ].join("\n");
}

const analysisId = await uploadFile();
const analysis = await waitForAnalysis(analysisId);
const fileReport = await getJson(`${API_ROOT}/files/${sha256}`);
const stats = normalizedStats(
  fileReport?.data?.attributes?.last_analysis_stats ||
    analysis?.data?.attributes?.stats
);
const report = {
  safe: stats.malicious === 0 && stats.suspicious === 0,
  file: basename(filePath),
  size: fileContents.byteLength,
  sha256,
  analysisId,
  stats,
  reportUrl: `https://www.virustotal.com/gui/file/${sha256}`
};
const jsonPath = resolve(outputDirectory, "release-safety.json");
const markdownPath = resolve(outputDirectory, "release-safety.md");
const markdown = markdownReport(report);

await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await writeFile(markdownPath, markdown, "utf8");

if (process.env.GITHUB_STEP_SUMMARY) {
  await appendFile(process.env.GITHUB_STEP_SUMMARY, markdown, "utf8");
}

if (process.env.GITHUB_OUTPUT) {
  await appendFile(
    process.env.GITHUB_OUTPUT,
    [
      `safe=${report.safe}`,
      `sha256=${report.sha256}`,
      `malicious=${report.stats.malicious}`,
      `suspicious=${report.stats.suspicious}`,
      `report_url=${report.reportUrl}`,
      ""
    ].join("\n"),
    "utf8"
  );
}

console.log(markdown);

if (!report.safe) {
  process.exitCode = 1;
}
