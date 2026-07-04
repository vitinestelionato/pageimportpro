import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentSessionId, trackSession } from "@/lib/session-tracker";
import { toast } from "sonner";
import {
  Monitor, Smartphone, Tablet, Tv, Globe, ShieldCheck, LogOut,
  RefreshCw, Search, Plug, Clock, Activity,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/sessoes")({
  head: () => ({
    meta: [
      { title: "Gerenciador de Sessões — ImportPro" },
      { name: "description", content: "Visualize e controle todas as sessões ativas da sua conta." },
    ],
  }),
  component: SessoesPage,
});

type SessionRow = {
  id: string;
  device: string | null;
  browser: string | null;
  os: string | null;
  ip_masked: string | null;
  city: string | null;
  country: string | null;
  auth_method: string | null;
  status: string;
  started_at: string;
  last_activity_at: string;
  expires_at: string | null;
  ended_at: string | null;
};

type EventRow = {
  id: string;
  event_type: string;
  result: string;
  created_at: string;
  metadata: Record<string, unknown>;
};

type IntegrationRow = {
  id: string;
  status: string;
  last_sync_at: string | null;
  connected_at: string | null;
  expires_at: string | null;
  integrations: { name: string | null; slug: string | null } | null;
};

function DeviceIcon({ device }: { device: string | null }) {
  const d = (device ?? "").toLowerCase();
  if (d.includes("smart")) return <Smartphone className="h-4 w-4" />;
  if (d.includes("tablet")) return <Tablet className="h-4 w-4" />;
  if (d.includes("tv")) return <Tv className="h-4 w-4" />;
  return <Monitor className="h-4 w-4" />;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    ended: "bg-muted text-muted-foreground border-border",
    expired: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    revoked: "bg-destructive/10 text-destructive border-destructive/20",
  };
  const label: Record<string, string> = {
    active: "Ativa", ended: "Encerrada", expired: "Expirada", revoked: "Revogada",
  };
  return (
    <Badge variant="outline" className={map[status] ?? map.ended}>
      {label[status] ?? status}
    </Badge>
  );
}

function fmt(ts: string | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function duration(from: string, to: string | null) {
  const start = new Date(from).getTime();
  const end = to ? new Date(to).getTime() : Date.now();
  const s = Math.max(0, Math.floor((end - start) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}min`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
}

function SessoesPage() {
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationRow[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "ended">("all");
  const currentId = getCurrentSessionId();

  const load = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const [s, e, i] = await Promise.all([
      supabase.from("user_sessions").select("*").eq("user_id", userData.user.id)
        .order("last_activity_at", { ascending: false }).limit(200),
      supabase.from("session_events").select("id,event_type,result,created_at,metadata")
        .eq("user_id", userData.user.id).order("created_at", { ascending: false }).limit(100),
      supabase.from("user_integrations")
        .select("id,status,last_sync_at,connected_at,expires_at,integrations(name,slug)")
        .eq("user_id", userData.user.id),
    ]);
    setSessions((s.data as SessionRow[] | null) ?? []);
    setEvents((e.data as EventRow[] | null) ?? []);
    setIntegrations((i.data as unknown as IntegrationRow[] | null) ?? []);
  };

  useEffect(() => {
    trackSession().then(load);
  }, []);

  const filtered = useMemo(() => {
    if (!sessions) return [];
    const q = query.trim().toLowerCase();
    return sessions.filter((s) => {
      if (filter === "active" && s.status !== "active") return false;
      if (filter === "ended" && s.status === "active") return false;
      if (!q) return true;
      return [s.device, s.browser, s.os, s.ip_masked, s.city, s.country]
        .filter(Boolean).join(" ").toLowerCase().includes(q);
    });
  }, [sessions, query, filter]);

  const stats = useMemo(() => {
    const list = sessions ?? [];
    const active = list.filter((s) => s.status === "active");
    const devices = new Set(active.map((s) => `${s.device}-${s.os}`));
    const avg = list.length
      ? Math.round(list.reduce((acc, s) => acc + (new Date(s.last_activity_at).getTime() - new Date(s.started_at).getTime()), 0) / list.length / 60000)
      : 0;
    return {
      activeCount: active.length,
      devices: devices.size,
      recentlyEnded: list.filter((s) => s.status !== "active").slice(0, 100).length,
      avgMinutes: avg,
    };
  }, [sessions]);

  const revoke = async (id: string) => {
    await supabase.from("user_sessions")
      .update({ status: "revoked", ended_at: new Date().toISOString() }).eq("id", id);
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      await supabase.from("session_events").insert({
        user_id: userData.user.id, session_id: id, event_type: "revoked", result: "success",
      });
    }
    toast.success("Sessão encerrada");
    load();
  };

  const revokeAllOthers = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const q = supabase.from("user_sessions")
      .update({ status: "revoked", ended_at: new Date().toISOString() })
      .eq("user_id", userData.user.id).eq("status", "active");
    if (currentId) q.neq("id", currentId);
    await q;
    // signOut apenas dos outros dispositivos via Supabase
    await supabase.auth.signOut({ scope: "others" });
    toast.success("Outras sessões encerradas");
    load();
  };

  const revokeAll = async () => {
    await supabase.auth.signOut({ scope: "global" });
    toast.success("Todas as sessões foram encerradas");
    window.location.href = "/login";
  };

  const renewCurrent = async () => {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) return toast.error("Falha ao renovar sessão");
    toast.success("Sessão renovada");
    if (currentId) {
      await supabase.from("user_sessions").update({
        expires_at: data.session?.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : null,
        last_activity_at: new Date().toISOString(),
      }).eq("id", currentId);
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        await supabase.from("session_events").insert({
          user_id: userData.user.id, session_id: currentId, event_type: "renewed", result: "success",
        });
      }
    }
    load();
  };

  return (
    <DashboardShell title="Gerenciador de Sessões" breadcrumb="Dashboard / Sistema / Sessões">
      <div className="space-y-6">
        {/* Painel de monitoramento */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Sessões ativas", value: stats.activeCount, icon: <Activity className="h-4 w-4" /> },
            { label: "Dispositivos conectados", value: stats.devices, icon: <Monitor className="h-4 w-4" /> },
            { label: "Encerradas recentes", value: stats.recentlyEnded, icon: <LogOut className="h-4 w-4" /> },
            { label: "Duração média (min)", value: stats.avgMinutes, icon: <Clock className="h-4 w-4" /> },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="flex items-center justify-between py-5">
                <div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                  <div className="text-2xl font-semibold">{s.value}</div>
                </div>
                <div className="text-muted-foreground">{s.icon}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Ações e filtros */}
        <Card>
          <CardContent className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Buscar por dispositivo, navegador, IP..." className="pl-9"
                  value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <div className="flex gap-1 rounded-md border p-1">
                {(["all", "active", "ended"] as const).map((f) => (
                  <Button key={f} size="sm" variant={filter === f ? "default" : "ghost"} onClick={() => setFilter(f)}>
                    {f === "all" ? "Todas" : f === "active" ? "Ativas" : "Encerradas"}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={renewCurrent}>
                <RefreshCw className="mr-2 h-4 w-4" /> Renovar atual
              </Button>
              <ConfirmButton
                label="Encerrar outras" variant="outline"
                title="Encerrar todas as outras sessões?"
                description="Sua sessão atual será mantida. Todas as outras precisarão fazer login novamente."
                onConfirm={revokeAllOthers}
              />
              <ConfirmButton
                label="Encerrar todas" variant="destructive"
                title="Encerrar todas as sessões?"
                description="Você será desconectado de todos os dispositivos, incluindo este."
                onConfirm={revokeAll}
              />
            </div>
          </CardContent>
        </Card>

        {/* Lista de sessões */}
        <div className="grid gap-3">
          {sessions === null ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
          ) : filtered.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              Nenhuma sessão encontrada.
            </CardContent></Card>
          ) : (
            filtered.map((s) => {
              const isCurrent = s.id === currentId;
              return (
                <Card key={s.id} className={isCurrent ? "border-primary/40 ring-1 ring-primary/20" : undefined}>
                  <CardContent className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="rounded-md border bg-muted/40 p-2"><DeviceIcon device={s.device} /></div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-medium">{s.device ?? "Dispositivo"} · {s.browser ?? "—"}</div>
                          <StatusBadge status={s.status} />
                          {isCurrent && (
                            <Badge className="bg-primary/10 text-primary border-primary/20" variant="outline">
                              <ShieldCheck className="mr-1 h-3 w-3" /> Sessão atual
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {s.os ?? "—"} · {s.ip_masked ?? "IP oculto"}
                          {(s.city || s.country) && <> · {[s.city, s.country].filter(Boolean).join(", ")}</>}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Início {fmt(s.started_at)} · Última atividade {fmt(s.last_activity_at)} ·
                          Duração {duration(s.started_at, s.ended_at)} · Método {s.auth_method ?? "password"}
                          {s.expires_at && <> · Expira {fmt(s.expires_at)}</>}
                        </div>
                      </div>
                    </div>
                    {s.status === "active" && !isCurrent && (
                      <ConfirmButton
                        label="Encerrar" variant="outline" size="sm"
                        title="Encerrar esta sessão?"
                        description="O dispositivo precisará fazer login novamente."
                        onConfirm={() => revoke(s.id)}
                      />
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Sessões de integrações */}
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <Plug className="h-4 w-4" /> Sessões de integrações
          </h2>
          {integrations.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma integração conectada. Vá para a Central de Conexões para conectar serviços externos.
            </CardContent></Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {integrations.map((it) => (
                <Card key={it.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <div className="font-medium">{it.integrations?.name ?? it.integrations?.slug ?? "Integração"}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Conectada {fmt(it.connected_at)} · Última sync {fmt(it.last_sync_at)}
                        {it.expires_at && <> · Válida até {fmt(it.expires_at)}</>}
                      </div>
                    </div>
                    <Badge variant="outline" className={
                      it.status === "active"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-muted text-muted-foreground"
                    }>{it.status}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Histórico */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" /> Histórico de eventos
          </CardTitle></CardHeader>
          <CardContent className="p-0">
            {events.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Sem eventos registrados.</div>
            ) : (
              <ul className="divide-y">
                {events.map((e) => (
                  <li key={e.id} className="flex items-center justify-between px-4 py-3 text-sm">
                    <div>
                      <span className="font-medium">{e.event_type}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{fmt(e.created_at)}</span>
                    </div>
                    <Badge variant="outline" className={
                      e.result === "success"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-destructive/10 text-destructive border-destructive/20"
                    }>{e.result}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

function ConfirmButton({
  label, title, description, onConfirm, variant = "default", size = "default",
}: {
  label: string; title: string; description: string; onConfirm: () => void | Promise<void>;
  variant?: "default" | "outline" | "destructive" | "ghost"; size?: "default" | "sm";
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size={size}>{label}</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => onConfirm()}>Confirmar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
