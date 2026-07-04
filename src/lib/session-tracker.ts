import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "ip.session.id";
const PING_INTERVAL_MS = 60_000;

function parseUA(ua: string) {
  const os =
    /Windows NT 10/.test(ua) ? "Windows 10/11" :
    /Windows/.test(ua) ? "Windows" :
    /Mac OS X/.test(ua) ? "macOS" :
    /Android/.test(ua) ? "Android" :
    /iPhone|iPad|iPod/.test(ua) ? "iOS" :
    /Linux/.test(ua) ? "Linux" : "Desconhecido";
  const browser =
    /Edg\//.test(ua) ? "Edge" :
    /OPR\//.test(ua) ? "Opera" :
    /Chrome\//.test(ua) ? "Chrome" :
    /Firefox\//.test(ua) ? "Firefox" :
    /Safari\//.test(ua) ? "Safari" : "Desconhecido";
  const device =
    /Mobi|Android|iPhone/.test(ua) ? "Smartphone" :
    /iPad|Tablet/.test(ua) ? "Tablet" :
    /TV|SmartTV/.test(ua) ? "Smart TV" : "Desktop";
  return { os, browser, device };
}

export function getCurrentSessionId(): string | null {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

let pingTimer: ReturnType<typeof setInterval> | null = null;

export async function trackSession() {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return;

    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const { os, browser, device } = parseUA(ua);
    const existingId = getCurrentSessionId();

    // Ping existing
    if (existingId) {
      const { data: existing } = await supabase
        .from("user_sessions")
        .select("id,status")
        .eq("id", existingId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (existing && existing.status === "active") {
        await supabase
          .from("user_sessions")
          .update({ last_activity_at: new Date().toISOString() })
          .eq("id", existingId);
        startPinging(existingId);
        return;
      }
    }

    // Create new
    const { data: session } = await supabase.auth.getSession();
    const expiresAt = session.session?.expires_at
      ? new Date(session.session.expires_at * 1000).toISOString()
      : null;

    const { data: created, error } = await supabase
      .from("user_sessions")
      .insert({
        user_id: user.id,
        device,
        browser,
        os,
        user_agent: ua,
        auth_method: user.app_metadata?.provider ?? "password",
        status: "active",
        expires_at: expiresAt,
      })
      .select("id")
      .single();
    if (error || !created) return;

    try { localStorage.setItem(STORAGE_KEY, created.id); } catch {}
    await supabase.from("session_events").insert({
      user_id: user.id,
      session_id: created.id,
      event_type: "login",
      result: "success",
      user_agent: ua,
    });
    startPinging(created.id);
  } catch {
    // silencioso; tracking não deve quebrar app
  }
}

function startPinging(sessionId: string) {
  if (pingTimer) return;
  pingTimer = setInterval(async () => {
    try {
      await supabase
        .from("user_sessions")
        .update({ last_activity_at: new Date().toISOString() })
        .eq("id", sessionId);
    } catch {}
  }, PING_INTERVAL_MS);
}

export async function endCurrentSession() {
  const id = getCurrentSessionId();
  if (!id) return;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;
  await supabase
    .from("user_sessions")
    .update({ status: "ended", ended_at: new Date().toISOString() })
    .eq("id", id);
  await supabase.from("session_events").insert({
    user_id: userData.user.id,
    session_id: id,
    event_type: "logout",
    result: "success",
  });
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
  if (pingTimer) { clearInterval(pingTimer); pingTimer = null; }
}
