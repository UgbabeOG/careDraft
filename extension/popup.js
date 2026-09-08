const $ = (id) => document.getElementById(id);
const views = [$("empty-state"), $("loading-state"), $("draft-state")];
let activeTab;

function showView(view) {
  views.forEach((item) => item.classList.toggle("hidden", item !== view));
  $("error").classList.add("hidden");
}

function showError(message) {
  $("error").textContent = message;
  $("error").classList.remove("hidden");
}

async function getSettings() {
  const settings = await chrome.storage.local.get({ apiBaseUrl: "http://127.0.0.1:8787/api" });
  $("api-url").value = settings.apiBaseUrl;
  return settings;
}

async function generateDraft() {
  showView($("loading-state"));
  try {
    const email = await chrome.tabs.sendMessage(activeTab.id, { type: "getEmailText" });
    if (!email?.text?.trim()) throw new Error("No email text found. Open a customer message and try again.");
    const { apiBaseUrl } = await getSettings();
    const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/draft-response`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailText: email.text })
    });
    const contentType = response.headers.get("content-type") || "";
    const responseText = await response.text();
    if (!contentType.includes("application/json")) {
      throw new Error(`The API returned an unexpected response (${response.status}). Check that the API URL ends with /api.`);
    }
    const data = JSON.parse(responseText);
    if (!response.ok || !data.success) throw new Error(data.error || "Unable to create a draft.");
    $("draft").value = data.draft;
    showView($("draft-state"));
  } catch (error) {
    showView($("empty-state"));
    showError(error.message || "Unable to create a draft.");
  }
}

async function init() {
  [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await getSettings();
  $("draft-button").addEventListener("click", generateDraft);
  $("retry-button").addEventListener("click", generateDraft);
  $("api-url").addEventListener("change", () => chrome.storage.local.set({ apiBaseUrl: $("api-url").value.trim() }));
  $("copy-button").addEventListener("click", async () => {
    await navigator.clipboard.writeText($("draft").value);
    $("copy-button").textContent = "Copied";
    setTimeout(() => { $("copy-button").textContent = "Copy draft"; }, 1400);
  });
  $("insert-button").addEventListener("click", async () => {
    const result = await chrome.tabs.sendMessage(activeTab.id, { type: "insertDraft", draft: $("draft").value });
    if (result?.inserted) window.close();
    else showError("Open a reply box in the email before inserting the draft.");
  });
}

init().catch((error) => showError(error.message || "Unable to start CareDraft."));
