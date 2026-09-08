chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get("apiBaseUrl", (settings) => {
    if (!settings.apiBaseUrl) {
      chrome.storage.local.set({ apiBaseUrl: "http://127.0.0.1:8787/api" });
    }
  });
});
