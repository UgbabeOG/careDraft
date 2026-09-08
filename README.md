# CareDraft

CareDraft is a standalone Chrome extension and local API for online-pharmacy customer support teams. It is independent of RoyaBridge Travels.

## Run the API locally

```bash
cd care-draft
npm install
cp .env.example .env
# Add GEMINI_API_KEY to .env
npm start
```

The API listens on `http://127.0.0.1:8787`.

Open `http://127.0.0.1:8787/` to verify that the server is running. The root endpoint returns a small JSON status response; the extension uses `/api/draft-response`.

## Load the extension

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Choose the `care-draft/extension` folder.
5. Open Gmail or Outlook, open a customer email, and click the CareDraft toolbar button.
6. Set the API endpoint to `http://127.0.0.1:8787/api` if it is not already populated.

The Gemini key stays in the standalone API server and is never shipped in the extension.

## Deploy the API on Render

1. Push this repository to GitHub. Do not commit `.env`; create a new Gemini key if a real key was ever placed in a committed file.
2. In Render, choose **New > Web Service**, connect the repository, and select this project.
3. Use these settings:
	- **Build command:** `npm install`
	- **Start command:** `npm start`
	- **Environment variable:** `GEMINI_API_KEY` = your Gemini API key
4. Deploy and open the generated `https://<service-name>.onrender.com/` URL. It should return the CareDraft status JSON. Render supplies `PORT` automatically.
5. Load or reload the extension, then set **API endpoint** to `https://<service-name>.onrender.com/api`.

After that, the API runs on Render and your computer does not need to run `npm start`. A free Render service may sleep when idle, so the first request after a quiet period can take longer. For a Chrome Web Store release, zip the contents of the `extension` folder (the files must be at the zip root), upload it from the Chrome Developer Dashboard, complete the store listing and privacy disclosures, and submit it for review. Keep the Gemini key only in Render environment variables, never in the extension or the uploaded zip.
