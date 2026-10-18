// Google Sheet mirror for ESENet registrations.
// 1. Create a Google Sheet. Extensions > Apps Script > paste this file.
// 2. Set SECRET below to a long random string (same value as GOOGLE_SHEET_SECRET).
// 3. Deploy > New deployment > Web app > Execute as: Me, Access: Anyone.
// 4. Copy the web app URL into GOOGLE_SHEET_WEBHOOK_URL.
// Tabs "visitors" and "exhibitors" are created automatically with headers.
const SECRET = "CHANGE_ME";

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  if (data.secret !== SECRET) return ContentService.createTextOutput("forbidden");
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(data.tab) || ss.insertSheet(data.tab);
  const keys = Object.keys(data.row);
  if (sheet.getLastRow() === 0) sheet.appendRow(keys);
  const header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  sheet.appendRow(header.map((h) => (data.row[h] === undefined ? "" : data.row[h])));
  return ContentService.createTextOutput("ok");
}
