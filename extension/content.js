const EMAIL_SELECTORS = [
  '[role="main"] [data-message-id] .ii.gt',
  '[role="main"] .a3s.aiL',
  '[role="main"] [data-testid="message-body"]'
];

function getEmailText() {
  // Use the first selector that finds messages so overlapping Gmail selectors
  // do not cause the same message to be sent more than once.
  const messageNodes = EMAIL_SELECTORS.map((selector) => Array.from(document.querySelectorAll(selector)))
    .find((nodes) => nodes.length > 0) || [];

  const messages = messageNodes
    .map((node, index) => {
      const text = (node.innerText || "").replace(/\n{3,}/g, "\n\n").trim();
      return text ? `--- Conversation message ${index + 1} ---\n${text}` : "";
    })
    .filter(Boolean);

  if (messages.length > 0) {
    return messages.join("\n\n").slice(0, 12000);
  }

  const fallback = document.querySelector('[role="main"]') || document.body;
  return (fallback.innerText || "").replace(/\n{3,}/g, "\n\n").trim().slice(0, 12000);
}

function findReplyEditor() {
  return document.querySelector('[contenteditable="true"][aria-label*="reply" i], [contenteditable="true"][role="textbox"]');
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "getEmailText") {
    sendResponse({ text: getEmailText() });
    return true;
  }
  if (message?.type === "insertDraft") {
    const editor = findReplyEditor();
    if (!editor) {
      sendResponse({ inserted: false });
      return true;
    }
    editor.focus();
    editor.innerText = message.draft;
    editor.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: message.draft }));
    sendResponse({ inserted: true });
    return true;
  }
});
