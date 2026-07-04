import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Bell, Plus, Search, Filter, X, Trash2, Play, Pause, RefreshCw,
  Zap, Clock, DollarSign, Package, TrendingDown, Truck, StickyNote,
  AlertTriangle, CheckCircle2, ExternalLink, Mail, Smartphone, Edit3,
  Target, Sparkles,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { listAlerts, upsertAlert, deleteAlert, setAlertStatus, checkAlert } from "@/lib/alerts.functions";

export const Route = createFileRoute("/_authenticated/dashboard/alertas")({
  head: () => ({ meta: [{ title: "Alertas · ImportPro" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AlertsPage,
});

type AlertRow = {
  id: string;
  type: AlertType;
  title: string;
  description: string | null;
  target_value: number | null;
  current_value: number | null;
  comparison: Comparison | null;
  reference_url: string | null;
  reference_label: string | null;
  status: "active" | "paused" | "triggered";
  priority: "low" | "medium" | "high" | "critical";
  notify_email: boolean;
  notify_in_app: boolean;
  trigger_count: number;
  last_checked_at: string | null;
  last_triggered_at: string | null;
  due_at: string | null;
  created_at: string;
  updated_at: string;
};

type AlertType = "price_target" | "price_drop" | "exchange_rate" | "stock_low" | "shipment_update" | "custom_reminder";
type Comparison = "lt" | "gt" | "eq" | "lte" | "gte";

const TYPE_META: Record<AlertType, { label: string; icon: typeof Bell; color: string; hint: string; unit?: string }> = {
  price_target: { label: "Alvo de preço", icon: Target, color: "text-emerald-400", hint: "Notifica quando o preço bater um valor alvo.", unit: "R$" },
  price_drop: { label: "Queda de preço", icon: TrendingDown, color: "text-rose-400", hint: "Notifica quando o preço cair abaixo do valor de referência.", unit: "R$" },
  exchange_rate: { label: "Cotação USD/BRL", icon: DollarSign, color: "text-amber-400", hint: "Notifica quando a cotação atingir seu alvo.", unit: "R$" },
  stock_low: { label: "Estoque baixo", icon: Package, color: "text-orange-400", hint: "Notifica quando o estoque ficar abaixo do mínimo.", unit: "un" },
  shipment_update: { label: "Rastreio de encomenda", icon: Truck, color: "text-sky-400", hint: "Lembre-se de checar uma encomenda em uma data." },
  custom_reminder: { label: "Lembrete personalizado", icon: StickyNote, color: "text-violet-400", hint: "Um lembrete simples com data e hora." },
};

const COMP_LABEL: Record<Comparison, string> = {
  lt: "menor que (<)", lte: "menor ou igual (≤)",
  gt: "maior que (>)", gte: "maior ou igual (≥)",
  eq: "igual a (=)",
};

type FormState = {
  id?: string;
  type: AlertType;
  title: string;
  description: string;
  target_value: string;
  current_value: string;
  comparison: Comparison;
  reference_url: string;
  reference_label: string;
  priority: "low" | "medium" | "high" | "critical";
  notify_email: boolean;
  notify_in_app: boolean;
  due_at: string;
};

const EMPTY_FORM: FormState = {
  type: "price_target", title: "", description: "",
  target_value: "", current_value: "", comparison: "lte",
  reference_url: "", reference_label: "",
  priority: "medium", notify_email: false, notify_in_app: true, due_at: "",
};

function AlertsPage() {
  const qc = useQueryClient();
  const fetchList = useServerFn(listAlerts);
  const saveFn = useServerFn(upsertAlert);
  const delFn = useServerFn(deleteAlert);
  const statusFn = useServerFn(setAlertStatus);
  const checkFn = useServerFn(checkAlert);

  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => fetchList() as Promise<AlertRow[]>,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["alerts"] });

  const saveMut = useMutation({
    mutationFn: (payload: Record<string, unknown>) => saveFn({ data: payload as never }) as Promise<{ id: string }>,
    onSuccess: () => { invalidate(); setFormOpen(false); setForm(EMPTY_FORM); toast.success("Alerta salvo"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }) as Promise<{ ok: boolean }>,
    onSuccess: () => { invalidate(); toast.success("Alerta excluído"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const statusMut = useMutation({
    mutationFn: (v: { id: string; status: "active" | "paused" | "triggered" }) => statusFn({ data: v }) as Promise<{ ok: boolean }>,
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });
  const checkMut = useMutation({
    mutationFn: (v: { id: string; current_value?: number | null }) => checkFn({ data: v }) as Promise<{ ok: boolean; triggered: boolean }>,
    onSuccess: (r) => { invalidate(); toast.success(r.triggered ? "Alerta disparado!" : "Verificado — sem disparo"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    return alerts.filter((a) => {
      if (typeFilter !== "all" && a.type !== typeFilter) return false;
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (priorityFilter !== "all" && a.priority !== priorityFilter) return false;
      if (q) {
        const hay = `${a.title} ${a.description ?? ""} ${a.reference_label ?? ""}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [alerts, q, typeFilter, statusFilter, priorityFilter]);

  const stats = useMemo(() => ({
    total: alerts.length,
    active: alerts.filter((a) => a.status === "active").length,
    triggered: alerts.filter((a) => a.status === "triggered").length,
    critical: alerts.filter((a) => a.priority === "critical" && a.status !== "paused").length,
  }), [alerts]);

  const openCreate = () => { setForm(EMPTY_FORM); setFormOpen(true); };
  const openEdit = (a: AlertRow) => {
    setForm({
      id: a.id, type: a.type, title: a.title, description: a.description ?? "",
      target_value: a.target_value?.toString() ?? "", current_value: a.current_value?.toString() ?? "",
      comparison: a.comparison ?? "lte", reference_url: a.reference_url ?? "",
      reference_label: a.reference_label ?? "", priority: a.priority,
      notify_email: a.notify_email, notify_in_app: a.notify_in_app,
      due_at: a.due_at ? a.due_at.slice(0, 16) : "",
    });
    setFormOpen(true);
  };

  const submit = () => {
    if (!form.title.trim()) return toast.error("Dê um título ao alerta");
    const payload: Record<string, unknown> = {
      id: form.id, type: form.type, title: form.title.trim(),
      description: form.description || null, priority: form.priority,
      notify_email: form.notify_email, notify_in_app: form.notify_in_app,
      reference_url: form.reference_url || null,
      reference_label: form.reference_label || null,
      target_value: form.target_value ? Number(form.target_value) : null,
      current_value: form.current_value ? Number(form.current_value) : null,
      comparison: form.comparison,
      due_at: form.due_at ? new Date(form.due_at).toISOString() : null,
    };
    saveMut.mutate(payload);
  };

  return (
    <DashboardShell breadcrumb="Alertas" title="Central de Alertas">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Configure monitoramentos para preços, cotação, estoque, encomendas e lembretes. Você é notificado quando o alvo for atingido.
        </p>
        <button
          onClick={openCreate}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Novo alerta
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-3 md:grid-cols-4">
        <StatCard icon={<Bell className="h-4 w-4" />} label="Total" value={String(stats.total)} />
        <StatCard icon={<Play className="h-4 w-4" />} label="Ativos" value={String(stats.active)} tone="emerald" />
        <StatCard icon={<Zap className="h-4 w-4" />} label="Disparados" value={String(stats.triggered)} tone="rose" />
        <StatCard icon={<AlertTriangle className="h-4 w-4" />} label="Prioridade crítica" value={String(stats.critical)} tone="amber" />
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-white/5 bg-card/60 p-4 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar alertas..."
              className="h-10 w-full rounded-lg border border-white/10 bg-black/20 pl-9 pr-9 text-sm outline-none focus:border-primary/50"
            />
            {q && (
              <button onClick={() => setQ("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <FilterSelect value={typeFilter} onChange={setTypeFilter} label="Tipo" options={[
            { v: "all", l: "Todos os tipos" },
            ...Object.entries(TYPE_META).map(([v, m]) => ({ v, l: m.label })),
          ]} />
          <FilterSelect value={statusFilter} onChange={setStatusFilter} label="Status" options={[
            { v: "all", l: "Qualquer status" },
            { v: "active", l: "Ativos" }, { v: "triggered", l: "Disparados" }, { v: "paused", l: "Pausados" },
          ]} />
          <FilterSelect value={priorityFilter} onChange={setPriorityFilter} label="Prioridade" options={[
            { v: "all", l: "Qualquer prioridade" },
            { v: "critical", l: "Crítica" }, { v: "high", l: "Alta" }, { v: "medium", l: "Média" }, { v: "low", l: "Baixa" },
          ]} />
        </div>
        <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Filter className="h-3 w-3" /> {filtered.length} de {alerts.length}
        </p>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl border border-white/5 bg-black/20" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState onCreate={openCreate} hasAlerts={alerts.length > 0} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((a) => (
            <AlertCard
              key={a.id}
              alert={a}
              onEdit={() => openEdit(a)}
              onDelete={() => confirm("Excluir este alerta?") && delMut.mutate(a.id)}
              onToggle={() => statusMut.mutate({ id: a.id, status: a.status === "active" ? "paused" : "active" })}
              onCheck={() => checkMut.mutate({ id: a.id })}
              checking={checkMut.isPending && checkMut.variables?.id === a.id}
            />
          ))}
        </div>
      )}

      {formOpen && (
        <AlertFormModal
          form={form}
          setForm={setForm}
          onClose={() => setFormOpen(false)}
          onSubmit={submit}
          saving={saveMut.isPending}
        />
      )}
    </DashboardShell>
  );
}

function AlertCard({ alert: a, onEdit, onDelete, onToggle, onCheck, checking }: {
  alert: AlertRow; onEdit: () => void; onDelete: () => void; onToggle: () => void; onCheck: () => void; checking: boolean;
}) {
  const meta = TYPE_META[a.type];
  const Icon = meta.icon;

  return (
    <article className={`group relative flex flex-col rounded-2xl border p-5 backdrop-blur transition ${
      a.status === "triggered" ? "border-rose-500/40 bg-rose-500/5" :
      a.status === "paused" ? "border-white/5 bg-card/40 opacity-70" :
      "border-white/5 bg-card/60 hover:border-primary/30"
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ${meta.color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold leading-tight">{a.title}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-muted-foreground">{meta.label}</span>
              <PriorityBadge p={a.priority} />
              <StatusBadge s={a.status} />
            </div>
          </div>
        </div>
      </div>

      {a.description && <p className="mt-3 line-clamp-2 text-xs text-foreground/85">{a.description}</p>}

      {(a.target_value != null || a.due_at) && (
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg border border-white/5 bg-black/20 p-3">
          {a.target_value != null && (
            <>
              <MiniField label={`Alvo (${meta.unit ?? ""})`} value={fmtNum(a.target_value)} tone="primary" />
              <MiniField
                label={a.comparison ? COMP_LABEL[a.comparison] : "Atual"}
                value={a.current_value != null ? fmtNum(a.current_value) : "—"}
                tone={a.status === "triggered" ? "rose" : undefined}
              />
            </>
          )}
          {a.due_at && (
            <MiniField label="Prazo" value={fmtDate(a.due_at)} tone={new Date(a.due_at) < new Date() ? "rose" : "amber"} />
          )}
        </div>
      )}

      {a.reference_url && (
        <a
          href={a.reference_url} target="_blank" rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 truncate text-xs text-primary hover:underline"
        >
          <ExternalLink className="h-3 w-3 shrink-0" />
          <span className="truncate">{a.reference_label || a.reference_url}</span>
        </a>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
        {a.notify_in_app && <span className="inline-flex items-center gap-1"><Smartphone className="h-3 w-3" /> Notificação</span>}
        {a.notify_email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> Email</span>}
        {a.trigger_count > 0 && <span className="inline-flex items-center gap-1"><Zap className="h-3 w-3 text-rose-400" /> {a.trigger_count} disparos</span>}
        {a.last_checked_at && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {fmtRelative(a.last_checked_at)}</span>}
      </div>

      <div className="mt-4 flex items-center gap-1.5 border-t border-white/5 pt-3">
        <button onClick={onCheck} disabled={checking} className="inline-flex h-8 items-center gap-1 rounded-md border border-white/10 bg-black/20 px-2.5 text-[11px] font-semibold hover:border-primary/40 hover:text-primary disabled:opacity-50">
          <RefreshCw className={`h-3 w-3 ${checking ? "animate-spin" : ""}`} /> Verificar
        </button>
        <button onClick={onToggle} className="inline-flex h-8 items-center gap-1 rounded-md border border-white/10 bg-black/20 px-2.5 text-[11px] font-semibold hover:border-primary/40 hover:text-primary">
          {a.status === "active" ? <><Pause className="h-3 w-3" /> Pausar</> : <><Play className="h-3 w-3" /> Ativar</>}
        </button>
        <button onClick={onEdit} className="inline-flex h-8 items-center gap-1 rounded-md border border-white/10 bg-black/20 px-2.5 text-[11px] font-semibold hover:border-primary/40 hover:text-primary">
          <Edit3 className="h-3 w-3" /> Editar
        </button>
        <button onClick={onDelete} className="ml-auto inline-flex h-8 items-center gap-1 rounded-md border border-rose-500/20 bg-rose-500/5 px-2.5 text-[11px] font-semibold text-rose-300 hover:border-rose-500/40 hover:bg-rose-500/10">
          <Trash2 className="h-3 w-3" /> Excluir
        </button>
      </div>
    </article>
  );
}

function AlertFormModal({ form, setForm, onClose, onSubmit, saving }: {
  form: FormState; setForm: (f: FormState) => void; onClose: () => void; onSubmit: () => void; saving: boolean;
}) {
  const meta = TYPE_META[form.type];
  const needsValue = form.type !== "shipment_update" && form.type !== "custom_reminder";
  const needsDate = form.type === "custom_reminder" || form.type === "shipment_update";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold">{form.id ? "Editar alerta" : "Novo alerta"}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{meta.hint}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <Label>Tipo de alerta</Label>
            <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3">
              {(Object.keys(TYPE_META) as AlertType[]).map((t) => {
                const m = TYPE_META[t]; const Ic = m.icon; const active = form.type === t;
                return (
                  <button key={t} type="button" onClick={() => setForm({ ...form, type: t })}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition ${
                      active ? "border-primary/50 bg-primary/10 text-foreground" : "border-white/10 bg-black/20 text-muted-foreground hover:border-white/20"
                    }`}>
                    <Ic className={`h-4 w-4 ${m.color}`} />
                    <span className="font-semibold">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label>Título *</Label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: Fone Bluetooth abaixo de R$ 80"
              className="mt-1.5 h-10 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm outline-none focus:border-primary/50" />
          </div>

          <div>
            <Label>Descrição (opcional)</Label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Detalhes ou contexto sobre o monitoramento"
              rows={2}
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-primary/50" />
          </div>

          {needsValue && (
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <Label>Condição</Label>
                <Select value={form.comparison} onValueChange={(v) => setForm({ ...form, comparison: v as Comparison })}>
                  <SelectTrigger className="mt-1.5 h-10 rounded-lg border-white/10 bg-black/20 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(COMP_LABEL) as Comparison[]).map((c) => (
                      <SelectItem key={c} value={c}>{COMP_LABEL[c]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valor alvo ({meta.unit ?? ""})</Label>
                <input type="number" step="0.01" value={form.target_value} onChange={(e) => setForm({ ...form, target_value: e.target.value })}
                  placeholder="0,00"
                  className="mt-1.5 h-10 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm outline-none focus:border-primary/50" />
              </div>
              <div>
                <Label>Valor atual (opcional)</Label>
                <input type="number" step="0.01" value={form.current_value} onChange={(e) => setForm({ ...form, current_value: e.target.value })}
                  placeholder="0,00"
                  className="mt-1.5 h-10 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm outline-none focus:border-primary/50" />
              </div>
            </div>
          )}

          {needsDate && (
            <div>
              <Label>Data e hora do lembrete</Label>
              <input type="datetime-local" value={form.due_at} onChange={(e) => setForm({ ...form, due_at: e.target.value })}
                className="mt-1.5 h-10 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm outline-none focus:border-primary/50" />
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Link de referência (opcional)</Label>
              <input value={form.reference_url} onChange={(e) => setForm({ ...form, reference_url: e.target.value })}
                placeholder="https://..."
                className="mt-1.5 h-10 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm outline-none focus:border-primary/50" />
            </div>
            <div>
              <Label>Rótulo do link</Label>
              <input value={form.reference_label} onChange={(e) => setForm({ ...form, reference_label: e.target.value })}
                placeholder="Ex: Produto na Shopee"
                className="mt-1.5 h-10 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm outline-none focus:border-primary/50" />
            </div>
          </div>

          <div>
            <Label>Prioridade</Label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {(["low", "medium", "high", "critical"] as const).map((p) => (
                <button key={p} type="button" onClick={() => setForm({ ...form, priority: p })}
                  className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${
                    form.priority === p ? "border-primary/50 bg-primary/15 text-primary" : "border-white/10 bg-black/20 text-muted-foreground hover:border-white/20"
                  }`}>{PR_LABEL[p]}</button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-black/20 p-3">
            <Label>Canais de notificação</Label>
            <div className="mt-2 space-y-2">
              <ToggleRow icon={<Smartphone className="h-4 w-4" />} label="Notificação in-app"
                checked={form.notify_in_app} onChange={(v) => setForm({ ...form, notify_in_app: v })} />
              <ToggleRow icon={<Mail className="h-4 w-4" />} label="Email"
                checked={form.notify_email} onChange={(v) => setForm({ ...form, notify_email: v })} />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="h-10 rounded-lg border border-white/10 bg-black/20 px-4 text-sm font-semibold hover:border-white/20">Cancelar</button>
          <button onClick={onSubmit} disabled={saving}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {saving ? <Sparkles className="h-4 w-4 animate-pulse" /> : <CheckCircle2 className="h-4 w-4" />}
            {form.id ? "Salvar" : "Criar alerta"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* --- helpers --- */

const PR_LABEL = { low: "Baixa", medium: "Média", high: "Alta", critical: "Crítica" } as const;

function EmptyState({ onCreate, hasAlerts }: { onCreate: () => void; hasAlerts: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-card/40 p-12 text-center backdrop-blur">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
        <Bell className="h-7 w-7 text-primary" />
      </div>
      <h3 className="mt-4 font-display text-lg font-bold">{hasAlerts ? "Nenhum alerta com esses filtros" : "Crie seu primeiro alerta"}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        {hasAlerts ? "Ajuste os filtros para ver todos os alertas." : "Monitore preços, cotação, estoque, rastreios e lembretes. A gente te avisa quando algo mudar."}
      </p>
      {!hasAlerts && (
        <button onClick={onCreate} className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Criar alerta
        </button>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone?: "emerald" | "rose" | "amber" }) {
  const cls = tone === "emerald" ? "text-emerald-400" : tone === "rose" ? "text-rose-400" : tone === "amber" ? "text-amber-400" : "text-foreground";
  return (
    <div className="rounded-2xl border border-white/5 bg-card/60 p-4 backdrop-blur">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span className={cls}>{icon}</span> {label}
      </div>
      <div className={`mt-2 font-display text-2xl font-bold ${cls}`}>{value}</div>
    </div>
  );
}

function MiniField({ label, value, tone }: { label: string; value: string; tone?: "primary" | "rose" | "amber" }) {
  const cls = tone === "primary" ? "text-primary" : tone === "rose" ? "text-rose-400" : tone === "amber" ? "text-amber-400" : "text-foreground";
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-0.5 font-display text-sm font-bold ${cls}`}>{value}</div>
    </div>
  );
}

function PriorityBadge({ p }: { p: AlertRow["priority"] }) {
  const map = {
    critical: "border-rose-500/50 bg-rose-500/15 text-rose-300",
    high: "border-orange-500/50 bg-orange-500/15 text-orange-300",
    medium: "border-amber-500/40 bg-amber-500/15 text-amber-300",
    low: "border-white/20 bg-white/5 text-white/70",
  } as const;
  return <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${map[p]}`}>{PR_LABEL[p]}</span>;
}

function StatusBadge({ s }: { s: AlertRow["status"] }) {
  const map = {
    active: { cls: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300", label: "Ativo" },
    paused: { cls: "border-white/20 bg-white/5 text-white/60", label: "Pausado" },
    triggered: { cls: "border-rose-500/50 bg-rose-500/20 text-rose-300", label: "Disparado" },
  } as const;
  const d = map[s];
  return <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${d.cls}`}>{d.label}</span>;
}

function FilterSelect({ value, onChange, label, options }: { value: string; onChange: (v: string) => void; label: string; options: { v: string; l: string }[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-10 min-w-[170px] rounded-lg border-white/10 bg-black/20 text-sm" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{children}</label>;
}

function ToggleRow({ icon, label, checked, onChange }: { icon: React.ReactNode; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-primary">{icon}</span> {label}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function fmtNum(n: number): string {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}
function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}
function fmtRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `há ${m}min`;
  const h = Math.round(m / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.round(h / 24);
  return `há ${d}d`;
}
