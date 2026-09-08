const EMAIL_SELECTORS = [
  '[role="main"] [data-message-id] .ii.gt',
  '[role="main"] .a3s.aiL',
  '[role="main"] [data-testid="message-body"]'
];

function getEmailText() {
  const source = EMAIL_SELECTORS.map((selector) => document.querySelector(selector)).find(Boolean)
    || document.querySelector('[role="main"]') || document.body;
  return (source.innerText || "").replace(/\n{3,}/g, "\n\n").trim().slice(0, 12000);
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
