import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Truck,
  Plus,
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronUp,
  MapPin,
  CircleAlert,
  Loader2,
  Radio,
} from "lucide-react";
import {
  listShipments,
  createShipment,
  refreshShipment,
  refreshAllShipments,
  deleteShipment,
  detectCarrier,
} from "@/lib/shipments.functions";

type ShipmentEvent = {
  at: string;
  location: string;
  description: string;
  detail: string;
};

type Shipment = {
  id: string;
  product_name: string;
  tracking_code: string;
  carrier: string;
  status: string;
  last_event_at: string | null;
  last_event_description: string | null;
  events: ShipmentEvent[];
  last_synced_at: string | null;
  sync_error: string | null;
  created_at: string;
};

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function ShipmentTracker() {
  const qc = useQueryClient();
  const fetchList = useServerFn(listShipments);
  const create = useServerFn(createShipment);
  const refresh = useServerFn(refreshShipment);
  const refreshAll = useServerFn(refreshAllShipments);
  const remove = useServerFn(deleteShipment);

  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ["shipments", "list"],
    queryFn: async () => (await fetchList()) as unknown as Shipment[],
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchOnWindowFocus: true,
  });

  const [expanded, setExpanded] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const detected = useMemo(
    () => (code.trim().length >= 6 ? detectCarrier(code) : null),
    [code],
  );

  const invalidate = () => qc.invalidateQueries({ queryKey: ["shipments"] });

  const createMut = useMutation({
    mutationFn: () =>
      create({
        data: {
          product_name: name.trim(),
          tracking_code: code.trim(),
        },
      }),
    onSuccess: () => {
      toast.success("Rastreio adicionado");
      setName("");
      setCode("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message ?? "Falha ao adicionar"),
  });

  const refreshMut = useMutation({
    mutationFn: (id: string) => refresh({ data: { id } }),
    onSuccess: () => {
      invalidate();
      toast.success("Status atualizado");
    },
    onError: (e: Error) => toast.error(e.message ?? "Falha ao atualizar"),
  });

  const refreshAllMut = useMutation({
    mutationFn: () => refreshAll(),
    onSuccess: (res: { refreshed: number }) => {
      invalidate();
      toast.success(`${res.refreshed} rastreios atualizados`);
    },
    onError: (e: Error) => toast.error(e.message ?? "Falha ao atualizar"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      invalidate();
      toast.success("Rastreio removido");
    },
    onError: (e: Error) => toast.error(e.message ?? "Falha ao remover"),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      toast.error("Informe nome e código.");
      return;
    }
    createMut.mutate();
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-card/60 p-6 backdrop-blur">
      <header className="flex flex-wrap items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Truck className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold">Rastreamento em tempo real</h2>
          <p className="text-xs text-muted-foreground">
            Adicione o código, a gente identifica a transportadora e atualiza automaticamente.
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
            <Radio className="h-3 w-3 animate-pulse" /> Ao vivo
          </span>
          <button
            type="button"
            onClick={() => refreshAllMut.mutate()}
            disabled={refreshAllMut.isPending || shipments.length === 0}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-background/40 px-3 text-xs font-semibold hover:border-primary/40 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshAllMut.isPending ? "animate-spin" : ""}`} />
            Atualizar agora
          </button>
        </div>
      </header>

      <form onSubmit={submit} className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do produto (ex.: Fone Bluetooth XYZ)"
          className="h-11 rounded-lg border border-white/10 bg-background/40 px-3 text-sm outline-none focus:border-primary/50"
        />
        <div className="relative">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Código de rastreio (ex.: AA123456789BR)"
            className="h-11 w-full rounded-lg border border-white/10 bg-background/40 px-3 pr-24 text-sm uppercase outline-none focus:border-primary/50"
          />
          {detected && (
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-primary/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
              {carrierLabel(detected)}
            </span>
          )}
        </div>
        <button
          type="submit"
          disabled={createMut.isPending}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Rastrear
        </button>
      </form>

      <div className="mt-6">
        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Carregando rastreios...</div>
        ) : shipments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-background/20 py-10 text-center">
            <Truck className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">Nenhum rastreio ativo</p>
            <p className="text-xs text-muted-foreground">Adicione um código acima para começar.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {shipments.map((s) => (
              <ShipmentCard
                key={s.id}
                shipment={s}
                expanded={expanded === s.id}
                onToggle={() => setExpanded((prev) => (prev === s.id ? null : s.id))}
                onRefresh={() => refreshMut.mutate(s.id)}
                onDelete={() => {
                  if (confirm(`Remover rastreio de "${s.product_name}"?`)) deleteMut.mutate(s.id);
                }}
                refreshing={refreshMut.isPending && refreshMut.variables === s.id}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function ShipmentCard({
  shipment,
  expanded,
  onToggle,
  onRefresh,
  onDelete,
  refreshing,
}: {
  shipment: Shipment;
  expanded: boolean;
  onToggle: () => void;
  onRefresh: () => void;
  onDelete: () => void;
  refreshing: boolean;
}) {
  const badge = statusBadge(shipment.status);
  const lastSync = shipment.last_synced_at
    ? new Date(shipment.last_synced_at).toLocaleString("pt-BR")
    : "—";

  return (
    <li className="overflow-hidden rounded-xl border border-white/10 bg-background/30">
      <div className="flex flex-wrap items-center gap-3 p-4">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${badge.wrap}`}>
          <badge.Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold">{shipment.product_name}</p>
            <span className="rounded-md border border-white/10 bg-background/40 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {carrierLabel(shipment.carrier)}
            </span>
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <span className="font-mono uppercase tracking-wider">{shipment.tracking_code}</span>
            <span>·</span>
            <span className={badge.textClass}>{badge.label}</span>
          </p>
          {shipment.last_event_description && (
            <p className="mt-1 flex items-center gap-1 text-xs text-foreground/80">
              <MapPin className="h-3 w-3 shrink-0" /> {shipment.last_event_description}
            </p>
          )}
          {shipment.sync_error && (
            <p className="mt-1 flex items-center gap-1 text-xs text-amber-400">
              <CircleAlert className="h-3 w-3 shrink-0" /> {shipment.sync_error}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            title="Atualizar agora"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 hover:border-primary/40 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={onToggle}
            title="Ver histórico"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 hover:border-primary/40"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={onDelete}
            title="Remover"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-destructive hover:border-destructive/40"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/5 bg-background/40 px-4 py-4">
          <div className="mb-3 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Última sincronização: {lastSync}</span>
            <span>Atualização automática a cada 5 min</span>
          </div>
          {shipment.events.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem eventos ainda. Clique em atualizar em alguns minutos.</p>
          ) : (
            <ol className="space-y-3">
              {shipment.events.map((ev, i) => (
                <li key={`${ev.at}-${i}`} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`h-2.5 w-2.5 rounded-full ${i === 0 ? "bg-primary shadow-[0_0_10px_2px] shadow-primary/50" : "bg-white/20"}`} />
                    {i < shipment.events.length - 1 && <div className="w-px flex-1 bg-white/10" />}
                  </div>
                  <div className="flex-1 pb-2">
                    <p className="text-sm font-medium">{ev.description}</p>
                    {ev.detail && <p className="text-xs text-muted-foreground">{ev.detail}</p>}
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {ev.location && <span>{ev.location} · </span>}
                      {new Date(ev.at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </li>
  );
}

function carrierLabel(c: string): string {
  const map: Record<string, string> = {
    correios: "Correios",
    jadlog: "Jadlog",
    transportadora: "Transportadora",
    outros: "Outros",
    desconhecido: "—",
  };
  return map[c] ?? c;
}

function statusBadge(status: string) {
  const map: Record<
    string,
    { label: string; wrap: string; textClass: string; Icon: typeof Truck }
  > = {
    pendente: { label: "Aguardando dados", wrap: "bg-white/5 text-muted-foreground", textClass: "text-muted-foreground", Icon: Loader2 },
    postado: { label: "Postado", wrap: "bg-primary/15 text-primary", textClass: "text-primary", Icon: Truck },
    em_transito: { label: "Em trânsito", wrap: "bg-primary/15 text-primary", textClass: "text-primary", Icon: Truck },
    em_andamento: { label: "Em andamento", wrap: "bg-primary/15 text-primary", textClass: "text-primary", Icon: Truck },
    saiu_para_entrega: { label: "Saiu para entrega", wrap: "bg-amber-500/15 text-amber-400", textClass: "text-amber-400", Icon: Truck },
    aguardando_retirada: { label: "Aguardando retirada", wrap: "bg-amber-500/15 text-amber-400", textClass: "text-amber-400", Icon: MapPin },
    entregue: { label: "Entregue", wrap: "bg-emerald-500/15 text-emerald-400", textClass: "text-emerald-400", Icon: Truck },
    devolvido: { label: "Devolvido", wrap: "bg-rose-500/15 text-rose-400", textClass: "text-rose-400", Icon: CircleAlert },
    problema: { label: "Problema", wrap: "bg-rose-500/15 text-rose-400", textClass: "text-rose-400", Icon: CircleAlert },
  };
  return map[status] ?? map.pendente;
}
