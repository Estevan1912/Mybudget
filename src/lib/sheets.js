// Thin client for the MyBudget Apps Script web app.
// The Apps Script URL accepts a JSON POST with { token, action, sheets }.

export async function syncToAppsScript(sheetsData, url, secret) {
  const res = await fetch(url, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({token: secret, action: "sync", sheets: sheetsData}),
    redirect: "follow",
  });

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch (_) { data = {}; }

  if (!res.ok || data.error) {
    throw new Error(data.error || `Sync failed (${res.status})`);
  }
  return data;
}
