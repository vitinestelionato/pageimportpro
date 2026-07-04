import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Plug,
  Search,
  RefreshCw,
  Plug2,
  Settings,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  listIntegrations,
  connectIntegration,
  disconnectIntegration,
  syncIntegration,
  listIntegrationEvents,
} from "@/lib/integrations.functions";

export const Route = createFileRoute("/_authenticated/dashboard/integracoes")({
  head: () => ({
    meta: [
      { title: "Central de Conexões · ImportPro" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: IntegrationsPage,
});

type Integration = {
  slug: string;
  name: string;
  description: string | null;
  category: string;
  auth_type: "oauth2" | "api_key" | "bearer" | "webhook" | "custom" | "builtin";
  is_coming_soon: boolean;
  connection: {
    id: string;
    status: "connected" | "disconnected" | "error" | "pending" | "revoked";
    last_sync_at: string | null;
    last_error: string | null;
    account_label: string | null;
  } | null;
};

const AUTH_LABEL: Record<Integration["auth_type"], string> = {
  oauth2: "OAuth 2.0",
  api_key: "API Key",
  bearer: "Bearer Token",
  webhook: "Webhook",
  custom: "Personalizado",
  builtin: "Nativo",
};

function IntegrationsPage() {
  const qc = useQueryClient();
  const fetchList = useServerFn(listIntegrations);
  const doConnect = useServerFn(connectIntegration);
  const doDisconnect = useServerFn(disconnectIntegration);
  const doSync = useServerFn(syncIntegration);
  const fetchLogs = useServerFn(listIntegrationEvents);

  const { data, isLoading } = useQuery({
    queryKey: ["integrations"],
    queryFn: () => fetchList(),
  });

  const { data: logs } = useQuery({
    queryKey: ["integration-events"],
    queryFn: () => fetchLogs({ data: {} }),
  });

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [dialogFor, setDialogFor] = useState<Integration | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [label, setLabel] = useState("");

  const items = (data ?? []) as Integration[];
  const categories = useMemo(
    () => ["all", ...Array.from(new Set(items.map((i) => i.category)))],
    [items],
  );
  const filtered = items.filter((i) => {
    const okCat = category === "all" || i.category === category;
    const q = search.trim().toLowerCase();
    const okSearch = !q || i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q);
    return okCat && okSearch;
  });

  const connectMut = useMutation({
    mutationFn: (payload: { slug: string; credentials: Record<string, string>; account_label?: string }) =>
      doConnect({ data: payload }),
    onSuccess: () => {
      toast.success("Integração conectada.");
      qc.invalidateQueries({ queryKey: ["integrations"] });
      qc.invalidateQueries({ queryKey: ["integration-events"] });
      setDialogFor(null);
      setApiKey("");
      setLabel("");
    },
    onError: (e: Error) => toast.error(e.message ?? "Não foi possível conectar."),
  });

  const disconnectMut = useMutation({
    mutationFn: (slug: string) => doDisconnect({ data: { slug } }),
    onSuccess: () => {
      toast.success("Integração desconectada.");
      qc.invalidateQueries({ queryKey: ["integrations"] });
      qc.invalidateQueries({ queryKey: ["integration-events"] });
    },
    onError: (e: Error) => toast.error(e.message ?? "Erro ao desconectar."),
  });

  const syncMut = useMutation({
    mutationFn: (slug: string) => doSync({ data: { slug } }),
    onSuccess: () => {
      toast.success("Sincronização concluída.");
      qc.invalidateQueries({ queryKey: ["integrations"] });
      qc.invalidateQueries({ queryKey: ["integration-events"] });
    },
    onError: (e: Error) => toast.error(e.message ?? "Falha ao sincronizar."),
  });

  function openConnect(item: Integration) {
    if (item.is_coming_soon) {
      toast.info(`${item.name} estará disponível em breve.`);
      return;
    }
    if (item.auth_type === "oauth2") {
      toast.info("OAuth ainda não configurado para este provedor.");
      return;
    }
    setDialogFor(item);
  }

  function submitConnect() {
    if (!dialogFor) return;
    const creds: Record<string, string> = {};
    if (dialogFor.auth_type === "api_key") creds.api_key = apiKey.trim();
    if (dialogFor.auth_type === "bearer") creds.token = apiKey.trim();
    if ((dialogFor.auth_type === "api_key" || dialogFor.auth_type === "bearer") && !apiKey.trim()) {
      toast.error("Informe a credencial.");
      return;
    }
    connectMut.mutate({
      slug: dialogFor.slug,
      credentials: creds,
      account_label: label.trim() || undefined,
    });
  }

  return (
    <DashboardShell title="Central de Conexões" breadcrumb="Integrações">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-6">
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Plug className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold tracking-tight">Central de Conexões</h1>
              <p className="text-sm text-muted-foreground">
                Conecte, sincronize e monitore integrações externas em um só lugar.
              </p>
            </div>
          </div>
        </header>

        <Tabs defaultValue="catalog" className="w-full">
          <TabsList>
            <TabsTrigger value="catalog">Catálogo</TabsTrigger>
            <TabsTrigger value="logs">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="catalog" className="mt-4 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar integração…"
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      category === c
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-ring/40 hover:text-foreground"
                    }`}
                  >
                    {c === "all" ? "Todas" : c}
                  </button>
                ))}
              </div>
            </div>

            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-44 rounded-xl" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((item) => (
                  <IntegrationCard
                    key={item.slug}
                    item={item}
                    onConnect={() => openConnect(item)}
                    onDisconnect={() => disconnectMut.mutate(item.slug)}
                    onSync={() => syncMut.mutate(item.slug)}
                    syncing={syncMut.isPending && syncMut.variables === item.slug}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="logs" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Histórico de eventos</CardTitle>
                <CardDescription>Últimas ações executadas em suas integrações.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[520px]">
                  <div className="divide-y divide-border">
                    {(logs ?? []).length === 0 ? (
                      <div className="p-8 text-center text-sm text-muted-foreground">
                        Ainda não há eventos registrados.
                      </div>
                    ) : (
                      (logs ?? []).map((row) => (
                        <div key={row.id} className="flex items-start gap-3 px-4 py-3">
                          <StatusDot status={row.status} />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium">{row.integration_slug}</span>
                              <Badge variant="outline" className="text-[10px] uppercase">
                                {row.action}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(row.created_at).toLocaleString("pt-BR")}
                              </span>
                            </div>
                            {row.message ? (
                              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                {row.message}
                              </p>
                            ) : null}
                          </div>
                          {row.duration_ms != null ? (
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {row.duration_ms}ms
                            </span>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog conectar */}
      <Dialog open={!!dialogFor} onOpenChange={(o) => !o && setDialogFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conectar {dialogFor?.name}</DialogTitle>
            <DialogDescription>
              Informe as credenciais fornecidas por {dialogFor?.name}. Suas credenciais ficam
              armazenadas de forma privada e podem ser removidas a qualquer momento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="int-cred">
                {dialogFor?.auth_type === "bearer" ? "Bearer token" : "API key"}
              </Label>
              <Input
                id="int-cred"
                type="password"
                autoComplete="off"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Cole a credencial…"
              />
            </div>
            <div>
              <Label htmlFor="int-label">Rótulo da conta (opcional)</Label>
              <Input
                id="int-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ex.: conta principal"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogFor(null)}>
              Cancelar
            </Button>
            <Button onClick={submitConnect} disabled={connectMut.isPending}>
              {connectMut.isPending ? "Conectando…" : "Conectar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}

function IntegrationCard({
  item,
  onConnect,
  onDisconnect,
  onSync,
  syncing,
}: {
  item: Integration;
  onConnect: () => void;
  onDisconnect: () => void;
  onSync: () => void;
  syncing: boolean;
}) {
  const connected = item.connection?.status === "connected";
  const hasError = item.connection?.status === "error";

  return (
    <Card interactive className="flex h-full flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted text-foreground">
              <Plug2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <CardTitle className="truncate text-base">{item.name}</CardTitle>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                <Badge variant="outline" className="text-[10px]">
                  {item.category}
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  {AUTH_LABEL[item.auth_type]}
                </Badge>
              </div>
            </div>
          </div>
          <StatusBadge
            status={
              item.is_coming_soon
                ? "soon"
                : hasError
                  ? "error"
                  : connected
                    ? "connected"
                    : "disconnected"
            }
          />
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
        {connected && item.connection?.last_sync_at ? (
          <p className="text-xs text-muted-foreground">
            Última sincronização:{" "}
            {new Date(item.connection.last_sync_at).toLocaleString("pt-BR")}
          </p>
        ) : null}
        {hasError && item.connection?.last_error ? (
          <p className="line-clamp-2 rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
            {item.connection.last_error}
          </p>
        ) : null}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
          {item.is_coming_soon ? (
            <Button size="sm" variant="secondary" disabled className="gap-1">
              <Sparkles className="h-3.5 w-3.5" /> Em breve
            </Button>
          ) : connected ? (
            <>
              <Button size="sm" variant="secondary" onClick={onSync} disabled={syncing}>
                <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
                Sincronizar
              </Button>
              <Button size="sm" variant="ghost" onClick={onDisconnect}>
                Desconectar
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={onConnect}>
              Conectar
            </Button>
          )}
          <Button size="sm" variant="ghost" className="ml-auto" disabled>
            <Settings className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({
  status,
}: {
  status: "connected" | "disconnected" | "error" | "soon";
}) {
  const map = {
    connected: {
      icon: <CheckCircle2 className="h-3 w-3" />,
      label: "Conectado",
      cls: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    },
    disconnected: {
      icon: <XCircle className="h-3 w-3" />,
      label: "Desconectado",
      cls: "bg-muted text-muted-foreground border-border",
    },
    error: {
      icon: <AlertTriangle className="h-3 w-3" />,
      label: "Erro",
      cls: "bg-destructive/10 text-destructive border-destructive/20",
    },
    soon: {
      icon: <Clock className="h-3 w-3" />,
      label: "Em breve",
      cls: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    },
  }[status];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${map.cls}`}
    >
      {map.icon}
      {map.label}
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "success"
      ? "bg-emerald-500"
      : status === "error"
        ? "bg-destructive"
        : status === "warning"
          ? "bg-amber-500"
          : "bg-primary";
  return <span className={`mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${color}`} />;
}

function EmptyState() {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed py-16 text-center">
      <Plug className="mb-3 h-8 w-8 text-muted-foreground" />
      <p className="text-sm font-medium">Nenhuma integração encontrada</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Ajuste a busca ou selecione outra categoria.
      </p>
    </div>
  );
}
