import { renderMessage } from "./message_renderer.js";

export function addMessage(messagePackage) {
  const chatStack = document.querySelector(".chat-stack");
  const maxiumVisible = 15;
  const bubble = renderMessage(messagePackage);

  chatStack.append(bubble);

  if (chatStack.children.length > maximumVisible) {
    chatStack.firstElementChild.remove();
  }
}

const events = new EventSource("/events");

events.onmessage = (event) => {
  const messagePackage = JSON.parse(event.data);

  addMessage(messagePackage);
};