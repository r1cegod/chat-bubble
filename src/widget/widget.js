////field to css
let widgetSettings = {
  assetBase: "",
  maxVisible: 10
};
function setCssVar(name, value, unit = "") {
  if (value === undefined || value === null || value === "") return;
  document.documentElement.style.setProperty(name, `${value}${unit}`);
}
function applyFieldData(fieldData = {}) {
    widgetSettings = {
        assetBase: fieldData.assetBase || "",
        maxVisible: fieldData.maxVisible || 10
    };

    setCssVar("--chat-canvas-height", fieldData["chat-canvas-height"], "px");
    setCssVar("--chat-canvas-width", fieldData["chat-canvas-width"], "px");
    setCssVar("--name-font-size", fieldData["name-font-size"], "px");
    setCssVar("--message-font-size", fieldData["message-font-size"], "px");
    setCssVar("--sticker-size", fieldData["sticker-size"], "px");
    setCssVar("--emoji-size", fieldData["emoji-size"], "px");
}

//////bubble renderer
////give message access to yt emoji
const YOUTUBE_EMOJI_BASE =
  "https://www.youtube.com/s/gaming/emoji/828cb648";

const EMOJI_DATASOURCE_URL =
  "https://cdn.jsdelivr.net/npm/emoji-datasource@16.0.0/emoji.json";

const YOUTUBE_EMOJI_ASSETS = {};
let youtubeEmojiReady = Promise.resolve();

function unifiedToYoutubePath(unified) {
  return unified
    .toLowerCase()
    .split("-")
    .filter((part) => part !== "fe0f")
    .join("_");
}

async function loadYoutubeEmojiAssets() {
  const response = await fetch(EMOJI_DATASOURCE_URL);
  const data = await response.json();

  for (const emoji of data) {
    if (!Array.isArray(emoji.short_names) || !emoji.unified) continue;

    const path = unifiedToYoutubePath(emoji.non_qualified || emoji.unified);
    const url = `${YOUTUBE_EMOJI_BASE}/emoji_u${path}.png`;

    for (const name of emoji.short_names) {
      YOUTUBE_EMOJI_ASSETS[name.toLowerCase()] = url;
    }
  }
}

youtubeEmojiReady = loadYoutubeEmojiAssets();
////give message access to custom emoji and gif
//image url generator
const DEFAULT_ASSET_BASE =
  "https://cdn.jsdelivr.net/gh/r1cegod/chat-bubble@main/src/widget/mediasrc";

const Assets = (() => {
  function base() {
    return String(widgetSettings.assetBase || DEFAULT_ASSET_BASE).replace(/\/+$/, "");
  }

  function url(...parts) {
    return [base(), ...parts.map((part) => encodeURIComponent(part))].join("/");
  }

  return {
    emoji: (filename) => url("emoji", filename),
    sticker: (filename) => url("sticker", filename),
    decor: (filename) => url("decor", filename)
  };
})();
//lock path
const STICKER_ASSETS = Object.freeze({
    bonk: "bonk.gif",
    patpat: "patpat.gif"
});
const EMOJI_ASSETS = Object.freeze({
    lilyahem: "ahem.png",
    lilyahhhh: "ahhhh.png",
    lilyangel: "angel.png",
    lilysmug: "baka~.png",
    lilyblehh: "blehh.png",
    lilycheering: "cheering.png",
    lilydevil: "devil.png",
    lilyshy: "ehhh.png",
    lilyloveletter: "foryou.png",
    lilyheart: "heart.png",
    lilyknife: "heheh.png",
    lilyboard: "heyy.png",
    lilyhiii: "hiii.png",
    lilymad: "hmmmm.png",
    lilyhmph: "hmph.png",
    lilysad: "huhu.png",
    lilyquestionmark: "hum.png",
    lilylike: "like.png",
    lilybonk1: "nonono.png",
    lilypatpat: "patpat.png",
    lilyshutup: "shutup!!.png",
    lilystaree: "staree.png",
    lilytehee: "tehee.png",
    lilyloading: "um.png",
    lilynervous: "umm.png",
    lilyuwaa: "uwaa.png",
    lilygun: "wannadie.png",
    lilywao: "wao.png",
});
//tokenizer
function tokenizeMessage(message) {
    const pattern = /:([a-z0-9_-]+):/gi;
    const tokens = [];
    let cursor = 0;

    for (const match of message.matchAll(pattern)) {
        const start = match.index;
        const end = start + match[0].length;
        const name = match[1].toLowerCase();

        if (start > cursor) {
            tokens.push({
                type: "text",
                value: message.slice(cursor, start)
            });
        }

        if (EMOJI_ASSETS[name]) {
            tokens.push({
                type: "emoji",
                name,
                src: Assets.emoji(EMOJI_ASSETS[name])
            });
        } else if (STICKER_ASSETS[name]) {
            return [{
                type: "sticker",
                name,
                src: Assets.sticker(STICKER_ASSETS[name])
            }];
        } else if (YOUTUBE_EMOJI_ASSETS[name]) {
            tokens.push({
                type: "emoji",
                name,
                src: YOUTUBE_EMOJI_ASSETS[name]
            });
        }
        cursor = end;
    }

    if (cursor < message.length) {
        tokens.push({
            type: "text",
            value: message.slice(cursor)
        });
    }

    return tokens;
}
//assemble message
function createMessageNodes(message) {
    const fragment = document.createDocumentFragment();
    const tokens = tokenizeMessage(String(message ?? ""));

    for (const token of tokens) {
        if (token.type === "text") {
            fragment.append(
                document.createTextNode(token.value)
            );
            continue;
        }

        if(token.type === "sticker") {
            const image = document.createElement("img");
            image.className = "message-sticker";
            image.src = token.src;
            image.alt = `:${token.name}:`;
            image.draggable = false;

            fragment.append(image);
            continue;
        }

        const image = document.createElement("img");
        image.className = "message-emoji";
        image.src = token.src;
        image.alt = `:${token.name}:`;
        image.draggable = false;

        fragment.append(image);
    }

    return fragment;
}


////bubble renderer
function renderMessage(messageData) {
    //role check
    const roleAllowed = ["viewer", "fox", "rice"]
    const roleRequested = messageData.role
        ?.trim()
        .toLowerCase();

    const fallbackAvatar = Assets.emoji("hiii.png");
    
    let role = "viewer";
    let extraImage = "";
    let imageStatus = Assets.decor("heartyheart.png");
    let sparkImage = "";
    let toprightImage = Assets.decor("moon.png");
    let botright1Image = Assets.decor("flawa.png");
    let botright2Image = Assets.decor("flawe.png");
    let imageStatus2 = "";
    let avatarUrl = messageData.avatarUrl;

    if (roleAllowed.includes(roleRequested)) {
        role = roleRequested;
    }

    //foxy
    if (role === "fox") {
        extraImage = Assets.decor("smolears.png");
    }
    if (role === "fox") {
        imageStatus = Assets.decor("smallmoon.png");
    }
    if (role === "fox") {
        sparkImage = Assets.decor("lightpinkheart.png");
    }
    if (role === "fox") {
        toprightImage = "";
    }
    if (role === "fox") {
        botright1Image = Assets.decor("lilytail.png");
    }
    if (role === "fox") {
        botright2Image = "";
    }

    //ricy
    /*if (role === "rice") {
        avatarUrl = Assets.sticker("patpat.gif");
    }*/
    if (role === "rice") {
        imageStatus = Assets.decor("whiteheart.png");
    }
    if (role === "rice") {
        sparkImage = Assets.decor("sparkyspark.png");
    }

    ////special date
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Bangkok',
        month: '2-digit',
        day: '2-digit'
    });
    const parts = formatter.formatToParts(now);
    const gmt7 = Object.fromEntries(parts.map(p => [p.type, p.value]));
    const month = gmt7.month;
    const day = gmt7.day;

    //fox birthday
    if (month === "06" && day === "14" && role === "fox") {
        imageStatus2 = Assets.decor("birthdayhat.png");
        imageStatus = "";
    }
    //Woman's day
    if (month === "03" && day === "08" && role === "fox") {
        botright1Image = Assets.decor("rose.png")
    }


    const messageBubble = document.createElement("article");
    messageBubble.className = "message-bubble";
    messageBubble.dataset.role = role;


    // avatar
    const avatarBubble = document.createElement("div");
    avatarBubble.className = "bubble-avatar";

    const avatarBox = document.createElement("div");
    avatarBox.className = "avatarbox";

    const avatarImage = document.createElement("img");
    avatarImage.className = "avatarbox-image";
    avatarImage.alt = "";
    avatarImage.addEventListener("error", () => {
        avatarImage.src = fallbackAvatar;
    }, {once: true});
    avatarImage.src = avatarUrl || fallbackAvatar;

    avatarBox.append(avatarImage);

    const statusImage = document.createElement("img");
    statusImage.className = "status-image";
    statusImage.src = imageStatus;
    statusImage.alt = "";
    const statusImage2 = document.createElement("img");
    statusImage2.className = "status-image2";
    statusImage2.src = imageStatus2;
    statusImage2.alt = "";

    avatarBubble.append(avatarBox, statusImage, statusImage2);

    //hold message box, nameplate, decs
    const contentBubble = document.createElement("div");
    contentBubble.className = "bubble-content";

    // message box
    const messageBox = document.createElement("div");
    messageBox.className = "messagebox";

    const messageBoxBg = document.createElement("div");
    messageBoxBg.className = "messagebox-bg";

    const messageBoxOutline = document.createElement("div");
    messageBoxOutline.className = "messagebox-outline";

    const messageText = document.createElement("span");
    messageText.className = "message";
    messageText.append(createMessageNodes(messageData.message));

    const imageBotright1 = document.createElement("img");
    imageBotright1.className = "botright1";
    imageBotright1.src = botright1Image;
    imageBotright1.alt = "";

    const imageBotright2 = document.createElement("img");
    imageBotright2.className = "botright2";
    imageBotright2.src = botright2Image;
    imageBotright2.alt = "";

    const bigCloudTemplate = document.querySelector(".bigcloud-template");
    const bigCloud = bigCloudTemplate?.content.cloneNode(true) ?? document.createDocumentFragment();
    const smallCloudTemplate = document.querySelector(".smallcloud-template");
    const smallCloud = smallCloudTemplate?.content.cloneNode(true) ?? document.createDocumentFragment();

    messageBox.append(messageBoxBg, messageBoxOutline, messageText, imageBotright1, imageBotright2, bigCloud, smallCloud);

    //nameplate
    const nameplateBoxC = document.createElement("div");
    nameplateBoxC.className = "nameplateC";
    const nameplateBox = document.createElement("div");
    nameplateBox.className = "nameplate";

    const nameplateText = document.createElement("span");
    nameplateText.className = "nameplate-text";
    nameplateText.textContent = messageData.name;

    const nameplateSpark1 = document.createElement("img");
    nameplateSpark1.className = "spark1";
    nameplateSpark1.src = sparkImage;
    nameplateSpark1.alt = "";

    const nameplateSpark2 = document.createElement("img");
    nameplateSpark2.className = "spark2";
    nameplateSpark2.src = sparkImage;
    nameplateSpark2.alt = "";

    const nameplateExtra = document.createElement("img");
    nameplateExtra.className = "extra";
    nameplateExtra.src = extraImage;
    nameplateExtra.alt = "";

    nameplateBox.append(nameplateText, nameplateSpark1, nameplateSpark2);
    nameplateBoxC.append(nameplateExtra);

    //extra imgs
    const imageTopright = document.createElement("img");
    imageTopright.className = "topright";
    imageTopright.src = toprightImage;
    imageTopright.alt = "";

    //put all that shi together
    contentBubble.append(messageBox, nameplateBoxC, nameplateBox, imageTopright);
    messageBubble.append(avatarBubble, contentBubble);

    return messageBubble;
}

//////chatrenderer
const flipDuration = 220;
function addMessage(messagePackage) {
  const chatStack = document.querySelector(".chat-stack");
  const maximumVisible = Number(widgetSettings.maxVisible) || 10;

  const oldBubbles = [...chatStack.children];
  const firstRects = new Map(
    oldBubbles.map((bubble) => [
      bubble,
      bubble.getBoundingClientRect()
    ])
  );

  const bubble = renderMessage(messagePackage);
  chatStack.append(bubble);

  if (chatStack.children.length > maximumVisible) {
    chatStack.firstElementChild.remove();
  }

  for (const bubble of oldBubbles) {
    if (!bubble.isConnected) continue;

    const first = firstRects.get(bubble);
    const last = bubble.getBoundingClientRect();

    const deltaY = first.top - last.top;

    if (deltaY === 0) continue;
    
    bubble.animate([
      { transform: `translateY(${deltaY}px)` },
      { transform: "translateY(0)" }
    ], {
      duration: flipDuration,
      easing: "ease-out"
    });
  }

  const lastestBubble = chatStack.lastElementChild;
  const lastestBubbleHeight = lastestBubble.getBoundingClientRect().height;
  lastestBubble.animate([
    { transform: `translateY(calc(${lastestBubbleHeight}px + 75px))` },
    { transform: "translateY(0)" }
  ], {
    duration: flipDuration,
    easing: "ease-out"
  });
}
//normalizers
const RICE_YOUTUBE_CHANNEL_ID = "UC7OCsHMf-2UtZIc59hN8uug";
function normalizeRole(data) {
  const author = data.authorDetails || {};
  if (author.channelId === RICE_YOUTUBE_CHANNEL_ID || data.userId === RICE_YOUTUBE_CHANNEL_ID) {
    return "rice";
  }
  if (author.isChatOwner) {
    return "fox";
  }
  return "viewer";
}
function normalizeStreamElementsMessage(data = {}) {
  const snippet = data.snippet || {};
  const textDetails = snippet.textMessageDetails || {};

  return {
    id: data.msgId || data.id || "",
    userId: data.userId || data.authorDetails?.channelId || "",
    name: data.displayName || data.authorDetails?.displayName || data.nick || "viewer",
    message: data.text || textDetails.messageText || snippet.displayMessage || "",
    avatarUrl: data.avatar || data.authorDetails?.profileImageUrl || "",
    role: normalizeRole(data),
    platform: "youtube",
    timestamp: data.time || Date.parse(snippet.publishedAt) || Date.now(),
    eventType: snippet.type || "message",
    nativeEmotes: Array.isArray(data.emotes) ? data.emotes : []
  };
}


//////Listenours
window.addEventListener("onWidgetLoad", (obj) => {
  applyFieldData(obj.detail.fieldData);
});

////message queue
const messageQueue = [];
let isRenderingQueue = false;
const MIN_RENDER_GAP_MS = 220;
const MAX_RENDER_GAP_MS = 2000;

//add random delay
function randomRenderGap() {
  return Math.floor(
    MIN_RENDER_GAP_MS +
    Math.random() * (MAX_RENDER_GAP_MS - MIN_RENDER_GAP_MS)
  );
}

//da pump
async function pumpMessageQueue() {
  const nextMessage = messageQueue.shift();

  if (!nextMessage) {
    isRenderingQueue = false;
    return;
  }

  isRenderingQueue = true;
  await youtubeEmojiReady;
  addMessage(nextMessage);

  setTimeout(pumpMessageQueue, randomRenderGap());
}

//da queue
function enqueueMessage(messagePackage) {
  messageQueue.push(messagePackage);

  if (!isRenderingQueue) {
    pumpMessageQueue();
  }
}


//// message listenour
window.addEventListener("onEventReceived", (obj) => {
  if (obj.detail.listener !== "message") return;
  const messagePackage = normalizeStreamElementsMessage(obj.detail.event.data);
  enqueueMessage(messagePackage);
});
