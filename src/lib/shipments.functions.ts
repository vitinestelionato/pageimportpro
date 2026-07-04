import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// --- Carrier detection ---------------------------------------------------

const CORREIOS_RE = /^[A-Z]{2}\d{9}[A-Z]{2}$/i; // e.g. AA123456789BR

export function detectCarrier(codeRaw: string): string {
  const code = codeRaw.trim().toUpperCase();
  if (CORREIOS_RE.test(code)) return "correios";
  if (/^JAD/i.test(code)) return "jadlog";
  if (/^\d{10,14}$/.test(code)) return "transportadora";
  return "outros";
}

// --- LinkeTrack integration ---------------------------------------------

type LinkeEvent = {
  data?: string;
  hora?: string;
  local?: string;
  status?: string;
  subStatus?: string[];
};

type LinkeResponse = {
  codigo?: string;
  servico?: string;
  quantidade?: number;
  eventos?: LinkeEvent[];
  ultimo_status?: string;
  message?: string;
};

type NormalizedEvent = {
  at: string; // ISO
  location: string;
  description: string;
  detail: string;
};

type TrackingResult = {
  status: string;
  lastEventAt: string | null;
  lastEventDescription: string | null;
  events: NormalizedEvent[];
  error?: string;
};

function parseBrDate(date?: string, time?: string): string | null {
  if (!date) return null;
  // "27/06/2026" + "14:32"
  const [d, m, y] = date.split("/");
  if (!d || !m || !y) return null;
  const hhmm = (time ?? "00:00").padEnd(5, "0");
  const iso = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T${hhmm}:00-03:00`;
  const parsed = new Date(iso);
  return isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function classifyStatus(lastStatus: string | undefined | null): string {
  const s = (lastStatus ?? "").toLowerCase();
  if (!s) return "pendente";
  if (s.includes("entregue")) return "entregue";
  if (s.includes("saiu para entrega") || s.includes("em rota")) return "saiu_para_entrega";
  if (s.includes("aguardando retirada")) return "aguardando_retirada";
  if (s.includes("devolvido") || s.includes("devolução")) return "devolvido";
  if (s.includes("problema") || s.includes("extraviado")) return "problema";
  if (s.includes("postado") || s.includes("objeto postado")) return "postado";
  if (s.includes("trânsito") || s.includes("transito") || s.includes("encaminhado")) return "em_transito";
  return "em_andamento";
}

async function fetchLinkeTrack(code: string): Promise<TrackingResult> {
  const user = process.env.LINKETRACK_USER;
  const token = process.env.LINKETRACK_TOKEN;
  if (!user || !token) {
    return {
      status: "pendente",
      lastEventAt: null,
      lastEventDescription: null,
      events: [],
      error: "LinkeTrack não configurado",
    };
  }
  const url = `https://api.linketrack.com/track/json?user=${encodeURIComponent(
    user,
  )}&token=${encodeURIComponent(token)}&codigo=${encodeURIComponent(code)}`;
  let json: LinkeResponse;
  try {
    const resp = await fetch(url, { headers: { Accept: "application/json" } });
    const text = await resp.text();
    try {
      json = JSON.parse(text) as LinkeResponse;
    } catch {
      return {
        status: "pendente",
        lastEventAt: null,
        lastEventDescription: null,
        events: [],
        error: `Resposta inválida do rastreador (${resp.status})`,
      };
    }
    if (!resp.ok) {
      return {
        status: "pendente",
        lastEventAt: null,
        lastEventDescription: null,
        events: [],
        error: json.message ?? `HTTP ${resp.status}`,
      };
    }
  } catch (e) {
    return {
      status: "pendente",
      lastEventAt: null,
      lastEventDescription: null,
      events: [],
      error: (e as Error).message,
    };
  }

  const events: NormalizedEvent[] = (json.eventos ?? []).map((e) => ({
    at: parseBrDate(e.data, e.hora) ?? new Date().toISOString(),
    location: e.local ?? "",
    description: e.status ?? "",
    detail: (e.subStatus ?? []).join(" · "),
  }));

  // sort desc by time
  events.sort((a, b) => (a.at < b.at ? 1 : -1));
  const latest = events[0];
  const rawLastStatus = json.ultimo_status ?? latest?.description ?? null;

  return {
    status: classifyStatus(rawLastStatus),
    lastEventAt: latest?.at ?? null,
    lastEventDescription: latest ? [latest.description, latest.location].filter(Boolean).join(" — ") : null,
    events,
  };
}

// --- Server functions ----------------------------------------------------

export const listShipments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("shipments")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const createInput = z.object({
  product_name: z.string().trim().min(1).max(200),
  tracking_code: z.string().trim().min(6).max(40),
  product_id: z.string().uuid().optional().nullable(),
});

export const createShipment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => createInput.parse(data))
  .handler(async ({ data, context }) => {
    const code = data.tracking_code.trim().toUpperCase();
    const carrier = detectCarrier(code);

    // Insert first with pending status, then attempt initial sync.
    const { data: inserted, error: insertErr } = await context.supabase
      .from("shipments")
      .insert({
        user_id: context.userId,
        product_id: data.product_id ?? null,
        product_name: data.product_name.trim(),
        tracking_code: code,
        carrier,
        status: "pendente",
      })
      .select("*")
      .single();

    if (insertErr) {
      if (insertErr.code === "23505") {
        throw new Error("Você já está rastreando esse código.");
      }
      throw new Error(insertErr.message);
    }

    // First sync attempt (best-effort; UI can retry via refreshShipment)
    const tracking = await fetchLinkeTrack(code);
    const { data: updated } = await context.supabase
      .from("shipments")
      .update({
        status: tracking.status,
        last_event_at: tracking.lastEventAt,
        last_event_description: tracking.lastEventDescription,
        events: tracking.events,
        last_synced_at: new Date().toISOString(),
        sync_error: tracking.error ?? null,
      })
      .eq("id", inserted.id)
      .eq("user_id", context.userId)
      .select("*")
      .single();

    return updated ?? inserted;
  });

const refreshInput = z.object({ id: z.string().uuid() });

export const refreshShipment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => refreshInput.parse(data))
  .handler(async ({ data, context }) => {
    const { data: current, error: selErr } = await context.supabase
      .from("shipments")
      .select("*")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (selErr) throw new Error(selErr.message);
    if (!current) throw new Error("Rastreio não encontrado");

    const tracking = await fetchLinkeTrack(current.tracking_code);
    const { data: updated, error: updErr } = await context.supabase
      .from("shipments")
      .update({
        status: tracking.status,
        last_event_at: tracking.lastEventAt,
        last_event_description: tracking.lastEventDescription,
        events: tracking.events,
        last_synced_at: new Date().toISOString(),
        sync_error: tracking.error ?? null,
      })
      .eq("id", current.id)
      .eq("user_id", context.userId)
      .select("*")
      .single();
    if (updErr) throw new Error(updErr.message);
    return updated;
  });

export const refreshAllShipments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: all, error } = await context.supabase
      .from("shipments")
      .select("id, tracking_code, status")
      .eq("user_id", context.userId)
      .not("status", "in", "(entregue,devolvido)");
    if (error) throw new Error(error.message);

    let refreshed = 0;
    for (const row of all ?? []) {
      const tracking = await fetchLinkeTrack(row.tracking_code);
      await context.supabase
        .from("shipments")
        .update({
          status: tracking.status,
          last_event_at: tracking.lastEventAt,
          last_event_description: tracking.lastEventDescription,
          events: tracking.events,
          last_synced_at: new Date().toISOString(),
          sync_error: tracking.error ?? null,
        })
        .eq("id", row.id)
        .eq("user_id", context.userId);
      refreshed += 1;
    }
    return { refreshed };
  });

export const deleteShipment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("shipments")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
