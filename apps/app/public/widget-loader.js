/**
 * Embeddable chat widget loader — plain vanilla JS, zero dependencies, no
 * build step. Drop this on any third-party site with:
 *
 *   <script src="https://your-domain/app/widget-loader.js" data-chatbot-id="..."></script>
 *
 * It renders a small floating launcher button that toggles an <iframe>
 * pointed at this same app's public /widget/{chatbotId} page. The origin
 * (and any path prefix, e.g. this app's Next.js `basePath`) is derived from
 * this script's own <script src>, never hardcoded, so the same file works
 * in local dev (http://localhost:3001/app/widget-loader.js) and behind
 * nginx path-based routing in production alike.
 */
(function () {
  "use strict";

  var currentScript = document.currentScript;
  if (!currentScript) {
    console.error("[cbb-widget] widget-loader.js: could not resolve document.currentScript.");
    return;
  }

  var chatbotId = currentScript.getAttribute("data-chatbot-id");
  if (!chatbotId) {
    console.error("[cbb-widget] widget-loader.js: missing required data-chatbot-id attribute.");
    return;
  }

  // Everything before this script's own filename is the prefix (origin +
  // whatever basePath the app is deployed under) — e.g.
  // "https://host/app/widget-loader.js" -> prefix "https://host/app/".
  var scriptSrc = currentScript.src;
  var prefix = scriptSrc.slice(0, scriptSrc.lastIndexOf("/") + 1);
  var widgetUrl = prefix + "widget/" + encodeURIComponent(chatbotId);

  var WIDTH = 380;
  var MAX_HEIGHT = 600;
  var MIN_HEIGHT = 80;
  var BUTTON_SIZE = 56;
  var MARGIN = 20;

  var isOpen = false;

  var iframe = document.createElement("iframe");
  iframe.src = widgetUrl;
  iframe.title = "Chat widget";
  iframe.setAttribute("frameborder", "0");
  iframe.style.position = "fixed";
  iframe.style.right = MARGIN + "px";
  iframe.style.bottom = BUTTON_SIZE + MARGIN * 2 + "px";
  iframe.style.width = WIDTH + "px";
  iframe.style.height = MIN_HEIGHT + "px";
  iframe.style.maxHeight = MAX_HEIGHT + "px";
  iframe.style.border = "none";
  iframe.style.borderRadius = "12px";
  iframe.style.boxShadow = "0 8px 30px rgba(0, 0, 0, 0.2)";
  iframe.style.zIndex = "2147483646";
  iframe.style.display = "none";
  iframe.style.colorScheme = "normal";

  var button = document.createElement("button");
  button.setAttribute("aria-label", "Open chat");
  button.style.position = "fixed";
  button.style.right = MARGIN + "px";
  button.style.bottom = MARGIN + "px";
  button.style.width = BUTTON_SIZE + "px";
  button.style.height = BUTTON_SIZE + "px";
  button.style.borderRadius = "50%";
  button.style.border = "none";
  button.style.background = "#17A673";
  button.style.color = "#ffffff";
  button.style.cursor = "pointer";
  button.style.boxShadow = "0 4px 14px rgba(23, 166, 115, 0.35)";
  button.style.zIndex = "2147483647";
  button.style.display = "flex";
  button.style.alignItems = "center";
  button.style.justifyContent = "center";
  button.style.padding = "0";
  button.style.fontFamily = "-apple-system, BlinkMacSystemFont, sans-serif";

  var CHAT_ICON =
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M4 4H20V16H7.5L4 19.5V4Z" stroke="white" stroke-width="2" stroke-linejoin="round"/>' +
    "</svg>";
  var CLOSE_ICON =
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M6 6L18 18M18 6L6 18" stroke="white" stroke-width="2" stroke-linecap="round"/>' +
    "</svg>";

  button.innerHTML = CHAT_ICON;

  function setOpen(open) {
    isOpen = open;
    iframe.style.display = open ? "block" : "none";
    button.innerHTML = open ? CLOSE_ICON : CHAT_ICON;
    button.setAttribute("aria-label", open ? "Close chat" : "Open chat");
  }

  button.addEventListener("click", function () {
    setOpen(!isOpen);
  });

  // Resize the iframe based on the widget page's own content height, so it
  // grows to fit its messages instead of always rendering at a fixed size.
  window.addEventListener("message", function (event) {
    if (event.source !== iframe.contentWindow) return;
    var data = event.data;
    if (!data || data.type !== "cbb-widget-resize") return;
    var height = Number(data.height);
    if (!isFinite(height) || height <= 0) return;
    var clamped = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, height));
    iframe.style.height = clamped + "px";
  });

  function mount() {
    document.body.appendChild(iframe);
    document.body.appendChild(button);
  }

  if (document.body) {
    mount();
  } else {
    document.addEventListener("DOMContentLoaded", mount);
  }
})();
