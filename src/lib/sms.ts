/**
 * SMS sending via Twilio REST API (no SDK dependency).
 *
 * Required env vars:
 *   TWILIO_ACCOUNT_SID  — your Twilio Account SID
 *   TWILIO_AUTH_TOKEN   — your Twilio Auth Token
 *   TWILIO_FROM         — your Twilio phone number in E.164 format, e.g. +12025551234
 *
 * If any var is missing, sendSms() silently no-ops (so email still works without SMS configured).
 */

export async function sendSms(to: string, body: string): Promise<void> {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_FROM;

  if (!sid || !token || !from) {
    // SMS not configured — silently skip
    return;
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;

  const params = new URLSearchParams({ To: to, From: from, Body: body });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[sendSms] Twilio error:", res.status, text);
  }
}
