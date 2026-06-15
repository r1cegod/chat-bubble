////give message access to emoji and gif
//lock path
const STICKER_ASSETS = Object.freeze({
    bonk: "./bonk.gif",
    patpat: "./patpat.gif"
});
const EMOJI_ASSETS = Object.freeze({
    lilyahem: "./emoji!/ahem.png",
    lilyahhhh: "./emoji!/ahhhh.png",
    lilyangel: "./emoji!/angel.png",
    lilysmug: "./emoji!/baka~.png",
    lilyblehh: "./emoji!/blehh.png",
    lilycheering: "./emoji!/cheering.png",
    lilydevil: "./emoji!/devil.png",
    lilyshy: "./emoji!/ehhh.png",
    lilyloveletter: "./emoji!/foryou.png",
    lilyheart: "./emoji!/heart.png",
    lilyknife: "./emoji!/heheh.png",
    lilyboard: "./emoji!/heyy.png",
    lilyhiii: "./emoji!/hiii.png",
    lilymad: "./emoji!/hmmmm.png",
    lilyhmph: "./emoji!/hmph.png",
    lilysad: "./emoji!/huhu.png",
    lilyquestionmark: "./emoji!/hum.png",
    lilylike: "./emoji!/like.png",
    lilybonk1: "./emoji!/nonono.png",
    lilypatpat: "./emoji!/patpat.png",
    lilyshutup: "./emoji!/shutup!!.png",
    lilystaree: "./emoji!/staree.png",
    lilytehee: "./emoji!/tehee.png",
    lilyloading: "./emoji!/um.png",
    lilynervous: "./emoji!/umm.png",
    lilyuwaa: "./emoji!/uwaa.png",
    lilygun: "./emoji!/wannadie.png",
    lilywao: "./emoji!/wao.png",
});
//tokenizer
function tokenizeMessage(message) {
    const pattern = /:([a-z0-9_]+):/gi;
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
                src: EMOJI_ASSETS[name]
            });
        } else if (STICKER_ASSETS[name]) {
            tokens.push({
                type: "sticker",
                name,
                src: STICKER_ASSETS[name]
            });
        } else {
            tokens.push({
                type: "text",
                value: match[0]
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
export function renderMessage(messageData) {
    //role check
    const roleAllowed = ["viewer", "fox", "rice"]
    const roleRequested = messageData.role
        ?.trim()
        .toLowerCase();

    const fallbackAvatar = "./hiii.png";
    
    let role = "viewer";
    if (roleAllowed.includes(roleRequested)) {
        role = roleRequested;
    }
    if (messageData.name === "ricy_rice") {
        role = "rice";
    }

    let extraImage = "";
    if (role === "fox") {
        extraImage = "./smolears.png";
    }

    let imageStatus = "./heartyheart.png";
    if (role === "rice") {
        imageStatus = "./whiteheart.png";
    }
    if (role === "fox") {
        imageStatus = "./smallmoon.png";
    }

    let sparkImage = "";
    if (role === "fox") {
        sparkImage = "./lightpinkheart.png";
    }

    let toprightImage = "./moon.png";
    if (role === "fox") {
        toprightImage = "";
    }

    let botright1Image = "./flawa.png";
    if (role === "fox") {
        botright1Image = "./lilytail.png";
    }

    let botright2Image = "./flawe.png";
    if (role === "fox") {
        botright2Image = "";
    }

    let avatarUrl = messageData.avatarUrl;
    if (role === "rice") {
        avatarUrl = "./patpat.gif";
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

    avatarBubble.append(avatarBox, statusImage);

    //hold message box, nameplate, decs
    const contentBubble = document.createElement("div");
    contentBubble.className = "bubble-content";

    // message box
    const messageBox = document.createElement("div");
    messageBox.className = "messagebox";

    const messageText = document.createElement("span");
    messageText.className = "message";
    messageText.append(createMessageNodes(messageData.message));

    const cloudTemplate = document.querySelector(".cloud-template");
    const cloud = cloudTemplate.content.cloneNode(true);

    messageBox.append(messageText, cloud);

    //nameplate
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

    //extra imgs
    const imageTopright = document.createElement("img");
    imageTopright.className = "topright";
    imageTopright.src = toprightImage;
    imageTopright.alt = "";

    const imageBotright1 = document.createElement("img");
    imageBotright1.className = "botright1";
    imageBotright1.src = botright1Image;
    imageBotright1.alt = "";

    const imageBotright2 = document.createElement("img");
    imageBotright2.className = "botright2";
    imageBotright2.src = botright2Image;
    imageBotright2.alt = "";

    //put all that shi together
    contentBubble.append(messageBox, nameplateBox, imageTopright, imageBotright1, imageBotright2, nameplateExtra);
    messageBubble.append(avatarBubble, contentBubble);

    return messageBubble;
}

/* const messageData = {
    name: "LilyAyakoCh",
    message: "",
    role: "fox",
    avatarUrl: "https://yt3.googleusercontent.com/X_H9lzop7tRexsylX2aO121HZZMhRYB90-Dl66JcX4pn-ZW_OymfwleO031_DaiN-3mum2SX3A=s160-c-k-c0x00ffffff-no-rj"
};

const stage = document.querySelector(".stage");
const renderedBubble = renderMessage(messageData);
stage.append(renderedBubble); */
