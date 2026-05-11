# My Budget

A personal budget tracker that syncs to Google Sheets via a lightweight Apps Script backend — no OAuth, no Cloud Console setup required.

## Google Sheets Integration Setup

### 1 — Create your spreadsheet

Go to [Google Sheets](https://sheets.google.com) and create a new blank spreadsheet. Copy the sheet ID from the URL:

```
https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
```

### 2 — Add the Apps Script

In your spreadsheet, go to **Extensions → Apps Script**. Delete any existing code and paste the contents of [`apps-script/Code.gs`](./apps-script/Code.gs).

Update the two constants at the top:

```js
const SHEET_ID     = "your-spreadsheet-id";
const SECRET_TOKEN = "pick-any-random-string"; // e.g. "mybudget-abc123"
```

### 3 — Deploy as a web app

1. Click **Deploy → New deployment**
2. Click the gear icon next to "Type" and select **Web app**
3. Set **Execute as:** Me
4. Set **Who has access:** Anyone
5. Click **Deploy** and authorize when prompted
6. Copy the **Web app URL** (looks like `https://script.google.com/macros/s/…/exec`)

> After any code change, create a **New deployment** (not "Manage deployments") to pick up the update.

### 4 — Configure the app

Open **My Budget → Settings → Google Sheets** and paste:
- **Apps Script URL** — the web app URL from step 3
- **Secret Token** — the same token you set in `Code.gs`

The app will auto-sync your budget data to the sheet 20 seconds after any change.

### Optional — pre-configure via env vars

Copy `.env.example` to `.env.local` and fill in your values. These are used as the defaults the first time the app loads (user settings in the app always take precedence).

```sh
cp .env.example .env.local
```

## Development

```sh
npm install
npm run dev       # start dev server
npm run build     # production build
npm run preview   # preview production build
```
