// Thin client for the MyBudget Apps Script web app.
// No Content-Type header — avoids CORS preflight that blocks Apps Script.
// Apps Script reads e.postData.contents regardless of content-type.

export async function syncToAppsScript(sheetsData, url, secret) {
  const res = await fetch(url, {
    method: "POST",
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
