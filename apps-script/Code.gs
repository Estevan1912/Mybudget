// ╔══════════════════════════════════════════════════════════════╗
// ║  MyBudget — Google Apps Script Backend                      ║
// ╚══════════════════════════════════════════════════════════════╝
//
// SETUP (one-time, ~2 minutes):
// 1. Open Extensions → Apps Script inside your Google Sheet
// 2. Delete all existing code and paste this entire file
// 3. Replace YOUR_SECRET_TOKEN_HERE with the token shown in
//    MyBudget → Settings → Google Sheets
// 4. Deploy → New deployment → Web app
//      Execute as: Me
//      Who has access: Anyone
// 5. Copy the Web App URL and paste it into MyBudget → Settings

const SECRET_TOKEN = "YOUR_SECRET_TOKEN_HERE";

// ── doGet: returns all sheet data ────────────────────────────────
function doGet(e) {
  if ((e.parameter || {}).token !== SECRET_TOKEN) {
    return json({error: "Unauthorized"});
  }
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = ss.getSheets().map(sheet => ({
      name: sheet.getName(),
      rows: sheet.getDataRange().getValues()
    }));
    return json({sheets});
  } catch (err) {
    return json({error: err.message});
  }
}

// ── doPost: sync sheet data ──────────────────────────────────────
//  Expects JSON body: { token, action, sheets }
//  action "sync": writes all sheets from the payload
function doPost(e) {
  let payload;
  try {
    payload = JSON.parse(e.postData.contents);
  } catch (_) {
    return json({error: "Invalid JSON"});
  }

  if (payload.token !== SECRET_TOKEN) {
    return json({error: "Unauthorized"});
  }

  try {
    if (payload.action === "sync" && Array.isArray(payload.sheets)) {
      syncSheets(payload.sheets);
      return json({ok: true});
    }
    return json({error: "Unknown action"});
  } catch (err) {
    return json({error: err.message});
  }
}

// ── syncSheets: write all sheet tabs ────────────────────────────
function syncSheets(sheetsData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  sheetsData.forEach(({name, rows, types}) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);

    sheet.clearContents();
    sheet.clearFormats();

    if (!rows || rows.length === 0) return;

    const maxCols = Math.max(...rows.map(r => r.length), 1);
    const paddedRows = rows.map(r => {
      const copy = r.slice();
      while (copy.length < maxCols) copy.push("");
      return copy;
    });

    sheet.getRange(1, 1, paddedRows.length, maxCols).setValues(paddedRows);
    applyFormatting(sheet, rows, types, maxCols);
  });
}

// ── applyFormatting: style each row based on type tag ───────────
//  T   = title row (big navy header)
//  S   = subtitle row (lighter navy)
//  SEC = section header
//  H   = column header row
//  TOT = totals row
//  D   = data row (alternating white/light-gray)
//  B   = blank spacer row
function applyFormatting(sheet, rows, types, maxCols) {
  if (!types) return;

  const NAVY     = "#1B3A6B";
  const NAVY2    = "#2A5496";
  const BLUE_HDR = "#D6E4F7";
  const BLUE_TOT = "#E4EEFF";
  const WHITE    = "#FFFFFF";
  const LGRAY    = "#F5F7FA";

  let dataIdx = 0;

  rows.forEach((row, ri) => {
    const t = types[ri] || "D";
    const numCols = Math.max(row.length, 1);
    const range = sheet.getRange(ri + 1, 1, 1, numCols);

    if (t === "T") {
      range.setBackground(NAVY)
           .setFontColor(WHITE)
           .setFontWeight("bold")
           .setFontSize(14);
      if (numCols > 1) range.mergeAcross();
    } else if (t === "S") {
      range.setBackground(NAVY2)
           .setFontColor(WHITE)
           .setFontSize(9);
      if (numCols > 1) range.mergeAcross();
    } else if (t === "SEC") {
      range.setBackground(NAVY)
           .setFontColor(WHITE)
           .setFontWeight("bold")
           .setFontSize(11);
      if (numCols > 1) range.mergeAcross();
    } else if (t === "H") {
      range.setBackground(BLUE_HDR)
           .setFontColor(NAVY)
           .setFontWeight("bold")
           .setFontSize(9)
           .setHorizontalAlignment("center");
    } else if (t === "TOT") {
      range.setBackground(BLUE_TOT)
           .setFontColor(NAVY)
           .setFontWeight("bold")
           .setFontSize(10)
           .setHorizontalAlignment("center");
      range.setBorder(
        true, false, true, false, false, false,
        NAVY, SpreadsheetApp.BorderStyle.SOLID_MEDIUM
      );
    } else if (t === "D") {
      const bg = dataIdx++ % 2 === 0 ? WHITE : LGRAY;
      range.setBackground(bg).setFontSize(10);
    }
  });

  sheet.setColumnWidth(1, 220);
  for (let c = 2; c <= maxCols; c++) sheet.setColumnWidth(c, 120);
  sheet.setFrozenRows(Math.min(2, rows.length));
}

// ── json: helper to return JSON with CORS headers ────────────────
function json(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
