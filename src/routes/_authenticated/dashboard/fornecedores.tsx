import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Search, Plus, Star, Heart, ExternalLink, Phone, Mail, MessageCircle,
  MapPin, Clock, Package, Pencil, Trash2, X, Filter, Building2, Globe,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  listSuppliers,
  upsertSupplier,
  deleteSupplier,
  toggleSupplierFavorite,
} from "@/lib/suppliers.functions";

export const Route = createFileRoute("/_authenticated/dashboard/fornecedores")({
  head: () => ({ meta: [{ title: "Fornecedores · ImportPro" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: SuppliersPage,
});

type Supplier = {
  id: string;
  name: string;
  platform: string | null;
  country: string | null;
  url: string | null;
  contact_name: string | null;
  whatsapp: string | null;
  email: string | null;
  wechat: string | null;
  category: string | null;
  min_order: number | null;
  lead_time_days: number | null;
  rating: number;
  favorite: boolean;
  status: string;
  tags: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  ativo: { label: "Ativo", cls: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300" },
  avaliando: { label: "Avaliando", cls: "border-amber-500/40 bg-amber-500/15 text-amber-300" },
  pausado: { label: "Pausado", cls: "border-white/20 bg-white/5 text-white/70" },
};

function SuppliersPage() {
  const qc = useQueryClient();
  const fetchList = useServerFn(listSuppliers);
  const save = useServerFn(upsertSupplier);
  const remove = useServerFn(deleteSupplier);
  const toggleFav = useServerFn(toggleSupplierFavorite);

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => fetchList() as Promise<Supplier[]>,
  });

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [country, setCountry] = useState<string>("all");
  const [onlyFav, setOnlyFav] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const countries = useMemo(
    () => Array.from(new Set(suppliers.map((s) => s.country).filter(Boolean))).sort() as string[],
    [suppliers],
  );

  const filtered = useMemo(() => {
    return suppliers.filter((s) => {
      if (status !== "all" && s.status !== status) return false;
      if (country !== "all" && s.country !== country) return false;
      if (onlyFav && !s.favorite) return false;
      if (q) {
        const t = q.toLowerCase();
        const hay = [s.name, s.platform, s.category, s.contact_name, ...s.tags].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(t)) return false;
      }
      return true;
    });
  }, [suppliers, q, status, country, onlyFav]);

  const stats = useMemo(() => {
    const total = suppliers.length;
    const fav = suppliers.filter((s) => s.favorite).length;
    const ativos = suppliers.filter((s) => s.status === "ativo").length;
    const avgLead = suppliers.filter((s) => s.lead_time_days != null);
    const lead = avgLead.length ? Math.round(avgLead.reduce((s, x) => s + (x.lead_time_days ?? 0), 0) / avgLead.length) : 0;
    return { total, fav, ativos, lead };
  }, [suppliers]);

  const saveMut = useMutation({
    mutationFn: (payload: Parameters<typeof save>[0]["data"]) => save({ data: payload }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      setModalOpen(false);
      setEditing(null);
      toast.success("Fornecedor salvo");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Fornecedor removido");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const favMut = useMutation({
    mutationFn: (v: { id: string; favorite: boolean }) => toggleFav({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });

  return (
    <DashboardShell breadcrumb="Fornecedores" title="Meus Fornecedores">
      {/* Header actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Organize contatos, plataformas e prazos dos seus fornecedores em um só lugar.
        </p>
        <button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Novo fornecedor
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-3 md:grid-cols-4">
        <StatCard icon={<Building2 className="h-4 w-4" />} label="Cadastrados" value={String(stats.total)} />
        <StatCard icon={<Heart className="h-4 w-4" />} label="Favoritos" value={String(stats.fav)} tone="rose" />
        <StatCard icon={<Globe className="h-4 w-4" />} label="Ativos" value={String(stats.ativos)} tone="emerald" />
        <StatCard icon={<Clock className="h-4 w-4" />} label="Prazo médio" value={stats.lead ? `${stats.lead} dias` : "—"} tone="primary" />
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-white/5 bg-card/60 p-4 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nome, plataforma, tag..."
              className="h-10 w-full rounded-lg border border-white/10 bg-black/20 pl-9 pr-9 text-sm outline-none focus:border-primary/50"
            />
            {q && (
              <button onClick={() => setQ("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <FilterSelect
            value={status}
            onChange={setStatus}
            label="Status"
            options={[
              { v: "all", l: "Todos status" },
              { v: "ativo", l: "Ativos" },
              { v: "avaliando", l: "Avaliando" },
              { v: "pausado", l: "Pausados" },
            ]}
          />
          <FilterSelect
            value={country}
            onChange={setCountry}
            label="País"
            options={[{ v: "all", l: "Todos países" }, ...countries.map((c) => ({ v: c, l: c }))]}
          />
          <button
            onClick={() => setOnlyFav((v) => !v)}
            className={`inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition ${
              onlyFav ? "border-primary/50 bg-primary/15 text-primary" : "border-white/10 bg-black/20 text-muted-foreground hover:text-foreground"
            }`}
          >
            <Heart className={`h-4 w-4 ${onlyFav ? "fill-current" : ""}`} /> Favoritos
          </button>
        </div>
        <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Filter className="h-3 w-3" /> {filtered.length} de {suppliers.length} fornecedores
        </p>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-2xl border border-white/5 bg-card/40" />
          ))}
        </div>
      ) : suppliers.length === 0 ? (
        <EmptyState onCreate={() => { setEditing(null); setModalOpen(true); }} />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-card/40 p-12 text-center">
          <Search className="mx-auto h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 font-semibold">Nenhum fornecedor encontrado</h3>
          <p className="mt-1 text-sm text-muted-foreground">Ajuste os filtros ou limpe a busca.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => (
            <SupplierCard
              key={s.id}
              supplier={s}
              onEdit={() => { setEditing(s); setModalOpen(true); }}
              onDelete={() => {
                if (confirm(`Remover o fornecedor "${s.name}"?`)) delMut.mutate(s.id);
              }}
              onFav={() => favMut.mutate({ id: s.id, favorite: !s.favorite })}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <SupplierModal
          initial={editing}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSave={(data) => saveMut.mutate(data)}
          saving={saveMut.isPending}
        />
      )}
    </DashboardShell>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-card/40 p-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Building2 className="h-7 w-7" />
      </div>
      <h3 className="mt-5 font-display text-xl font-bold">Nenhum fornecedor cadastrado</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Cadastre seus fornecedores para centralizar contatos, prazos e avaliações. Você pode salvar links do 1688, Alibaba, Goofish e outras plataformas.
      </p>
      <button
        onClick={onCreate}
        className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
      >
        <Plus className="h-4 w-4" /> Cadastrar fornecedor
      </button>
    </div>
  );
}

function SupplierCard({ supplier, onEdit, onDelete, onFav }: { supplier: Supplier; onEdit: () => void; onDelete: () => void; onFav: () => void }) {
  const s = supplier;
  const st = STATUS_META[s.status] ?? STATUS_META.ativo;
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white/5 bg-card/60 p-5 backdrop-blur transition hover:border-primary/30">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-display text-lg font-bold">{s.name}</h3>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${st.cls}`}>{st.label}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {s.platform && <span className="inline-flex items-center gap-1"><Package className="h-3 w-3" />{s.platform}</span>}
            {s.country && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{s.country}</span>}
            {s.category && <span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5">{s.category}</span>}
          </div>
        </div>
        <button
          onClick={onFav}
          aria-label="Favoritar"
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition ${
            s.favorite ? "border-rose-500/60 bg-rose-500/20 text-rose-400" : "border-white/10 bg-black/20 text-muted-foreground hover:text-rose-400"
          }`}
        >
          <Heart className={`h-4 w-4 ${s.favorite ? "fill-current" : ""}`} />
        </button>
      </div>

      {s.rating > 0 && (
        <div className="mt-3 flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`h-3.5 w-3.5 ${i < s.rating ? "fill-amber-400 text-amber-400" : "text-white/20"}`} />
          ))}
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg border border-white/5 bg-black/20 p-3 text-xs">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Pedido mín.</div>
          <div className="mt-0.5 font-bold">{s.min_order != null ? `${s.min_order} un` : "—"}</div>
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Prazo</div>
          <div className="mt-0.5 font-bold">{s.lead_time_days != null ? `${s.lead_time_days} dias` : "—"}</div>
        </div>
      </div>

      {(s.whatsapp || s.email || s.wechat || s.contact_name) && (
        <div className="mt-3 space-y-1 text-xs">
          {s.contact_name && <div className="text-muted-foreground">Contato: <span className="text-foreground">{s.contact_name}</span></div>}
          <div className="flex flex-wrap gap-2">
            {s.whatsapp && <ContactPill icon={<Phone className="h-3 w-3" />} label={s.whatsapp} href={`https://wa.me/${s.whatsapp.replace(/\D/g, "")}`} />}
            {s.email && <ContactPill icon={<Mail className="h-3 w-3" />} label={s.email} href={`mailto:${s.email}`} />}
            {s.wechat && <ContactPill icon={<MessageCircle className="h-3 w-3" />} label={s.wechat} />}
          </div>
        </div>
      )}

      {s.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {s.tags.map((t) => (
            <span key={t} className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground">#{t}</span>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        {s.url && (
          <a
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-black/20 px-3 text-xs font-semibold hover:border-primary/40 hover:text-primary"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Abrir loja
          </a>
        )}
        <button
          onClick={onEdit}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-black/20 px-3 text-xs font-semibold hover:border-primary/40 hover:text-primary"
        >
          <Pencil className="h-3.5 w-3.5" /> Editar
        </button>
        <button
          onClick={onDelete}
          aria-label="Excluir"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/20 text-muted-foreground hover:border-rose-500/40 hover:text-rose-400"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  );
}

function ContactPill({ icon, label, href }: { icon: React.ReactNode; label: string; href?: string }) {
  const cls = "inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-foreground/90 hover:border-primary/40 hover:text-primary";
  if (href) return <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{icon}{label}</a>;
  return <span className={cls}>{icon}{label}</span>;
}

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone?: "primary" | "emerald" | "rose" }) {
  const toneCls =
    tone === "primary" ? "text-primary" :
    tone === "emerald" ? "text-emerald-400" :
    tone === "rose" ? "text-rose-400" : "text-foreground";
  return (
    <div className="rounded-2xl border border-white/5 bg-card/60 p-4 backdrop-blur">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span className={toneCls}>{icon}</span> {label}
      </div>
      <div className={`mt-2 font-display text-2xl font-bold ${toneCls}`}>{value}</div>
    </div>
  );
}

function FilterSelect({ value, onChange, label, options }: { value: string; onChange: (v: string) => void; label: string; options: { v: string; l: string }[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-10 min-w-[180px] rounded-lg border-white/10 bg-black/20 text-sm" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

type FormState = {
  id?: string;
  name: string;
  platform: string;
  country: string;
  url: string;
  contact_name: string;
  whatsapp: string;
  email: string;
  wechat: string;
  category: string;
  min_order: string;
  lead_time_days: string;
  rating: number;
  favorite: boolean;
  status: "ativo" | "avaliando" | "pausado";
  tagsText: string;
  notes: string;
};

function emptyForm(): FormState {
  return {
    name: "", platform: "", country: "", url: "", contact_name: "", whatsapp: "",
    email: "", wechat: "", category: "", min_order: "", lead_time_days: "",
    rating: 0, favorite: false, status: "ativo", tagsText: "", notes: "",
  };
}

function fromSupplier(s: Supplier): FormState {
  return {
    id: s.id,
    name: s.name,
    platform: s.platform ?? "",
    country: s.country ?? "",
    url: s.url ?? "",
    contact_name: s.contact_name ?? "",
    whatsapp: s.whatsapp ?? "",
    email: s.email ?? "",
    wechat: s.wechat ?? "",
    category: s.category ?? "",
    min_order: s.min_order != null ? String(s.min_order) : "",
    lead_time_days: s.lead_time_days != null ? String(s.lead_time_days) : "",
    rating: s.rating,
    favorite: s.favorite,
    status: (s.status as FormState["status"]) ?? "ativo",
    tagsText: s.tags.join(", "),
    notes: s.notes ?? "",
  };
}

function SupplierModal({
  initial, onClose, onSave, saving,
}: {
  initial: Supplier | null;
  onClose: () => void;
  onSave: (data: {
    id?: string; name: string; platform?: string | null; country?: string | null; url?: string | null;
    contact_name?: string | null; whatsapp?: string | null; email?: string | null; wechat?: string | null;
    category?: string | null; min_order?: number | null; lead_time_days?: number | null;
    rating: number; favorite: boolean; status: "ativo" | "avaliando" | "pausado";
    tags: string[]; notes?: string | null;
  }) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<FormState>(initial ? fromSupplier(initial) : emptyForm());
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.name.trim()) return toast.error("Informe o nome do fornecedor");
    const tags = form.tagsText.split(",").map((t) => t.trim()).filter(Boolean);
    onSave({
      id: form.id,
      name: form.name.trim(),
      platform: form.platform.trim() || null,
      country: form.country.trim() || null,
      url: form.url.trim() || null,
      contact_name: form.contact_name.trim() || null,
      whatsapp: form.whatsapp.trim() || null,
      email: form.email.trim() || null,
      wechat: form.wechat.trim() || null,
      category: form.category.trim() || null,
      min_order: form.min_order ? Number(form.min_order) : null,
      lead_time_days: form.lead_time_days ? parseInt(form.lead_time_days, 10) : null,
      rating: form.rating,
      favorite: form.favorite,
      status: form.status,
      tags,
      notes: form.notes.trim() || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold">{form.id ? "Editar fornecedor" : "Novo fornecedor"}</h2>
            <p className="mt-1 text-xs text-muted-foreground">Cadastre os dados principais e contatos.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Nome *" required>
            <Input value={form.name} onChange={(v) => set("name", v)} placeholder="Ex: Shenzhen Trading Co." />
          </Field>
          <Field label="Plataforma">
            <Input value={form.platform} onChange={(v) => set("platform", v)} placeholder="1688, Alibaba, Goofish..." />
          </Field>
          <Field label="País">
            <Input value={form.country} onChange={(v) => set("country", v)} placeholder="China" />
          </Field>
          <Field label="Categoria">
            <Input value={form.category} onChange={(v) => set("category", v)} placeholder="Eletrônicos" />
          </Field>
          <Field label="Link da loja" full>
            <Input value={form.url} onChange={(v) => set("url", v)} placeholder="https://..." />
          </Field>

          <Field label="Contato">
            <Input value={form.contact_name} onChange={(v) => set("contact_name", v)} placeholder="Nome do vendedor" />
          </Field>
          <Field label="WhatsApp">
            <Input value={form.whatsapp} onChange={(v) => set("whatsapp", v)} placeholder="+86 138..." />
          </Field>
          <Field label="Email">
            <Input value={form.email} onChange={(v) => set("email", v)} placeholder="contato@..." />
          </Field>
          <Field label="WeChat">
            <Input value={form.wechat} onChange={(v) => set("wechat", v)} placeholder="ID do WeChat" />
          </Field>

          <Field label="Pedido mínimo (un)">
            <Input value={form.min_order} onChange={(v) => set("min_order", v)} placeholder="10" inputMode="decimal" />
          </Field>
          <Field label="Prazo (dias)">
            <Input value={form.lead_time_days} onChange={(v) => set("lead_time_days", v)} placeholder="15" inputMode="numeric" />
          </Field>

          <Field label="Status">
            <Select value={form.status} onValueChange={(v) => set("status", v as FormState["status"])}>
              <SelectTrigger className="h-10 rounded-lg border-white/10 bg-black/20"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="avaliando">Avaliando</SelectItem>
                <SelectItem value="pausado">Pausado</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Avaliação">
            <div className="flex h-10 items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => set("rating", form.rating === n ? 0 : n)}
                  className="rounded p-1 hover:bg-white/5"
                  aria-label={`${n} estrelas`}
                >
                  <Star className={`h-5 w-5 ${n <= form.rating ? "fill-amber-400 text-amber-400" : "text-white/25"}`} />
                </button>
              ))}
            </div>
          </Field>

          <Field label="Tags (separadas por vírgula)" full>
            <Input value={form.tagsText} onChange={(v) => set("tagsText", v)} placeholder="rápido, confiável, sample-grátis" />
          </Field>

          <Field label="Observações" full>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-white/10 bg-black/20 p-3 text-sm outline-none focus:border-primary/50"
              placeholder="Formas de pagamento, condições, histórico..."
            />
          </Field>

          <label className="col-span-full inline-flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" checked={form.favorite} onChange={(e) => set("favorite", e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-black/20" />
            Marcar como favorito
          </label>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button onClick={onClose} className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-4 text-sm font-semibold hover:bg-white/5">
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Salvando..." : (form.id ? "Salvar alterações" : "Cadastrar fornecedor")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, full, required }: { label: string; children: React.ReactNode; full?: boolean; required?: boolean }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
        {label}{required && <span className="text-rose-400"> *</span>}
      </label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, inputMode }: { value: string; onChange: (v: string) => void; placeholder?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"] }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      inputMode={inputMode}
      className="h-10 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm outline-none focus:border-primary/50"
    />
  );
}
