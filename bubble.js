const DEFAULT_BUBBLE = {
  name: "ricy_rice",
  message: "Hewoo hawooo haiii hiii",
};

const nameOutput = document.querySelector("[data-bubble-name]");
const messageOutput = document.querySelector("[data-bubble-message]");
const nameInput = document.querySelector("#name-input");
const messageInput = document.querySelector("#message-input");

function normalizeBubble(input = {}) {
  return {
    name: String(input.name ?? "").trim() || "viewer",
    message:
      String(input.message ?? "").trim() ||
      "Type a message below to preview the bubble.",
  };
}

function syncUrl(bubble) {
  const url = new URL(window.location.href);
  url.searchParams.set("name", bubble.name);
  url.searchParams.set("message", bubble.message);
  window.history.replaceState({}, "", url);
}

function renderBubble(input, { updateControls = true, updateUrl = false } = {}) {
  const bubble = normalizeBubble(input);

  nameOutput.textContent = bubble.name;
  messageOutput.textContent = bubble.message;

  if (updateControls) {
    nameInput.value = bubble.name;
    messageInput.value = bubble.message;
  }

  if (updateUrl) {
    syncUrl(bubble);
  }

  return bubble;
}

function readControls() {
  return {
    name: nameInput.value,
    message: messageInput.value,
  };
}

function updatePreviewScale() {
  const controlsHeight = document.querySelector(".preview-controls").offsetHeight;
  const availableWidth = Math.max(window.innerWidth - 24, 320);
  const availableHeight = Math.max(window.innerHeight - controlsHeight - 24, 180);
  const scale = Math.min(1, availableWidth / 2000, availableHeight / 1000);

  document.documentElement.style.setProperty("--preview-scale", scale.toFixed(4));
}

const params = new URLSearchParams(window.location.search);
const initialBubble = {
  name: params.get("name") ?? DEFAULT_BUBBLE.name,
  message: params.get("message") ?? DEFAULT_BUBBLE.message,
};

nameInput.addEventListener("input", () => {
  renderBubble(readControls(), { updateControls: false, updateUrl: true });
});

messageInput.addEventListener("input", () => {
  renderBubble(readControls(), { updateControls: false, updateUrl: true });
});

window.addEventListener("resize", updatePreviewScale);

window.setBubble = (input) => renderBubble(input, { updateUrl: true });

renderBubble(initialBubble);
updatePreviewScale();
