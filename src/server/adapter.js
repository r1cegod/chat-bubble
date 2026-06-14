//loading hell
const path = require("node:path");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

const protoPath = path.join(
  __dirname,
  "proto",
  "stream_list.proto"
);

const googleProtoRoot = path.dirname(
  require.resolve("google-proto-files/package.json")
);

const packageDefinition = protoLoader.loadSync(
  protoPath,
  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
    includeDirs: [googleProtoRoot]
  }
);

const descriptor =
  grpc.loadPackageDefinition(packageDefinition);

const YouTubeLiveChatService =
  descriptor.youtube.api.v3
    .V3DataLiveChatMessageService;

console.log("proto type:", typeof YouTubeLiveChatService);


///////////////////////////////////////////////////////////////////


//general fetch
async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `YouTube request failed (${response.status}): ${body}`
    );
  }

  return response.json();
}

//get livechatid
function buildVideoUrl(apiKey, videoId) {
  const url = new URL(
    "https://www.googleapis.com/youtube/v3/videos"
  );

  url.searchParams.set(
    "part",
    "liveStreamingDetails"
  );
  url.searchParams.set("id", videoId);
  url.searchParams.set("key", apiKey);

  return url;
}

async function getLiveChatId(apiKey, videoId) {
  const url = buildVideoUrl(apiKey, videoId);
  const data = await fetchJson(url);
  const video = data.items?.[0];

  if (!video) {
    throw new Error(
      "yt video not found or inaccessible"
    );
  }

  const liveChatId = video.liveStreamingDetails ?.activeLiveChatId;
  if (!liveChatId) {
    throw new Error(
      "video has no active live chat"
    );
  }

  return liveChatId;
}

//create client
const youtubeClient = new YouTubeLiveChatService(
  "dns:///youtube.googleapis.com:443",
  grpc.credentials.createSsl()
);
console.log("type of streamList:", typeof youtubeClient.streamList);

//ID helper
function rememberMessageId(
  seenMessageIds,
  messageId
) {
  const maximumRemembered = 200;

  seenMessageIds.add(messageId);
  if (seenMessageIds.size > maximumRemembered) {
    const oldestId =
      seenMessageIds.values().next().value;

    seenMessageIds.delete(oldestId);
  }
}


//normalizer
function normalizeMessage(item) {
  const snippet = item.snippet;
  const author = item.author_details;

  if (!item.id || !snippet || !author) {
    return null;
  }

  if (snippet.type !== "TEXT_MESSAGE_EVENT") {
    return null;
  }

  const message = snippet.display_message?.trim();

  if (!message) {
    return null;
  }

  let role = "viewer";

  if (author.is_chat_owner) {
    role = "fox";
  }

  if (author.channel_id === "UC7OCsHMf-2UtZIc59hN8uug") {
    role = "rice"
  }

  return {
    id: item.id,
    name: author.display_name?.trim() || "viewer",
    message,
    role,
    avatarUrl: author.profile_image_url || "",
    publishedAt: snippet.published_at || ""
  };
}


//Open connection
function startChatStream(apiKey, liveChatId, onMessage) {
  const seenMessageIds = new Set();

  let initialSyncComplete = false;
  let nextPageToken;
  let activeCall;
  let stopped = false;

  const metadata = new grpc.Metadata();
  metadata.set("x-goog-api-key", apiKey);

  function openNextCall() {
    const request = {
      live_chat_id: liveChatId,
      part: ["snippet", "authorDetails"],
      profile_image_size: 88
    };

    if (nextPageToken) {
      request.page_token = nextPageToken;
    }

    activeCall = youtubeClient.streamList(
      request,
      metadata
    );

    activeCall.on("data", (response) => {
      if (response.next_page_token) {
        nextPageToken = response.next_page_token
      }
      const items = response.items ?? [];

      if (!initialSyncComplete) {
        for (const item of items) {
          if (item.id) {
            rememberMessageId(
              seenMessageIds,
              item.id
            );
          }
        }
        initialSyncComplete = true;

        console.log(`Discarded ${items.length} startup items`);
        return;
      }

      for (const item of items) {
        const normalized = normalizeMessage(item);
        if (!normalized) {
          continue;
        }

        if (seenMessageIds.has(normalized.id)) {
          continue;
        }

        rememberMessageId(seenMessageIds, normalized.id);
        onMessage(normalized);
      }
    });

    activeCall.on("error", (error) => {
      console.error(
        "YouTube stream error:",
        error.code,
        error.details
      );
    });

    activeCall.on("end", () => {
      if (!stopped && nextPageToken) {
        openNextCall();
      }
    });

    activeCall.on("status", (status) => {
      console.log(
        "YouTube stream status:",
        status.code,
        status.details
      );
    });
  }

  openNextCall();

  return {
    stop() {
      stopped = true;
      activeCall?.cancel();
    }
  };
}


////////////////////////////////////////////////////////////////////////////


module.exports = {
  getLiveChatId,
  startChatStream
};