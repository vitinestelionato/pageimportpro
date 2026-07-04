import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Package, Plus, Pencil, Trash2, ExternalLink, Search, Sparkles, Link2 } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ShipmentTracker } from "@/components/dashboard/ShipmentTracker";
import { listProducts, createProduct, updateProduct, deleteProduct } from "@/lib/products.functions";
import { enrichProductFromUrl } from "@/lib/enrich-product.functions";

export const Route = createFileRoute("/_authenticated/dashboard/produtos")({
  head: () => ({ meta: [{ title: "Produtos · ImportPro" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: ProductsPage,
});

type Product = {
  id: string;
  name: string;
  supplier_url: string | null;
  origin_price: number;
  origin_currency: string;
  weight_kg: number;
  category: string | null;
  image_url: string | null;
  status: string;
  notes: string | null;
  created_at: string;
};

type FormState = {
  id?: string;
  name: string;
  supplier_url: string;
  origin_price: string;
  origin_currency: "USD" | "EUR" | "CNY" | "BRL";
  weight_kg: string;
  category: string;
  image_url: string;
  status: "analise" | "importado" | "arquivado";
  notes: string;
};

const emptyForm = (): FormState => ({
  name: "", supplier_url: "", origin_price: "0", origin_currency: "USD",
  weight_kg: "0", category: "", image_url: "", status: "analise", notes: "",
});

function ProductsPage() {
  const qc = useQueryClient();
  const fetchList = useServerFn(listProducts);
  const create = useServerFn(createProduct);
  const update = useServerFn(updateProduct);
  const remove = useServerFn(deleteProduct);
  const enrich = useServerFn(enrichProductFromUrl);
  const [autoUrl, setAutoUrl] = useState("");

  const enrichMut = useMutation({
    mutationFn: (url: string) => enrich({ data: { url } }),
    onSuccess: (r) => {
      setForm((f) => ({
        ...f,
        name: r.name ?? f.name,
        supplier_url: r.supplier_url || f.supplier_url,
        image_url: r.image_url ?? f.image_url,
        origin_price: r.origin_price != null ? String(r.origin_price) : f.origin_price,
        origin_currency: (r.origin_currency ?? f.origin_currency) as FormState["origin_currency"],
        weight_kg: r.weight_kg != null ? String(r.weight_kg) : f.weight_kg,
        category: r.category ?? f.category,
        notes: r.notes ?? f.notes,
      }));
      toast.success("Dados preenchidos automaticamente. Revise e salve.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", "list"],
    queryFn: () => fetchList() as Promise<Product[]>,
  });

  const [filter, setFilter] = useState<"all" | "analise" | "importado" | "arquivado">("all");
  const [q, setQ] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());

  const filtered = products.filter((p) => {
    if (filter !== "all" && p.status !== filter) return false;
    if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        supplier_url: form.supplier_url.trim() || undefined,
        origin_price: Number(form.origin_price) || 0,
        origin_currency: form.origin_currency,
        weight_kg: Number(form.weight_kg) || 0,
        category: form.category.trim() || undefined,
        image_url: form.image_url.trim() || undefined,
        status: form.status,
        notes: form.notes.trim() || undefined,
      };
      if (form.id) return update({ data: { id: form.id, patch: payload } });
      return create({ data: payload });
    },
    onSuccess: () => {
      toast.success(form.id ? "Produto atualizado" : "Produto criado");
      setModalOpen(false);
      setForm(emptyForm());
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => { toast.success("Produto removido"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => { setForm(emptyForm()); setAutoUrl(""); setModalOpen(true); };
  const openEdit = (p: Product) => {
    setForm({
      id: p.id, name: p.name, supplier_url: p.supplier_url ?? "",
      origin_price: String(p.origin_price), origin_currency: p.origin_currency as FormState["origin_currency"],
      weight_kg: String(p.weight_kg), category: p.category ?? "", image_url: p.image_url ?? "",
      status: p.status as FormState["status"], notes: p.notes ?? "",
    });
    setModalOpen(true);
  };

  return (
    <DashboardShell breadcrumb="Produtos" title="Gestão de Produtos">
      <ShipmentTracker />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar produto..." className="h-10 w-full rounded-lg border border-white/10 bg-card/60 pl-9 pr-3 text-sm outline-none focus:border-primary/50" />
        </div>
        <div className="flex gap-1 rounded-lg border border-white/10 bg-card/60 p-1">
          {(["all","analise","importado","arquivado"] as const).map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={`rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${filter===s?"bg-primary/20 text-primary":"text-muted-foreground hover:text-foreground"}`}>
              {s === "all" ? "Todos" : s}
            </button>
          ))}
        </div>
        <button onClick={openNew} className="ml-auto inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Novo produto
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-white/5 bg-card/40 p-12 text-center text-muted-foreground">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-card/40 p-12 text-center">
          <Package className="mx-auto h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 font-semibold">Nenhum produto ainda</h3>
          <p className="mt-1 text-sm text-muted-foreground">Comece cadastrando seu primeiro item de importação.</p>
          <button onClick={openNew} className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">
            <Plus className="h-4 w-4" /> Novo produto
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <article key={p.id} className="group overflow-hidden rounded-2xl border border-white/5 bg-card/60 backdrop-blur transition hover:border-primary/30">
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className="h-40 w-full object-cover" />
              ) : (
                <div className="flex h-40 items-center justify-center bg-gradient-to-br from-primary/10 to-transparent">
                  <Package className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="line-clamp-2 font-semibold">{p.name}</h3>
                  <StatusBadge status={p.status} />
                </div>
                {p.category && <p className="mt-1 text-xs text-muted-foreground">{p.category}</p>}
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-display text-xl font-bold">{p.origin_currency} {Number(p.origin_price).toFixed(2)}</span>
                  <span className="text-xs text-muted-foreground">· {p.weight_kg}kg</span>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  {p.supplier_url && (
                    <a href={p.supplier_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-xs hover:border-primary/40">
                      <ExternalLink className="h-3 w-3" /> Fornecedor
                    </a>
                  )}
                  <button onClick={() => openEdit(p)} className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 hover:border-primary/40">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => { if (confirm(`Remover "${p.name}"?`)) deleteMut.mutate(p.id); }} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-destructive hover:border-destructive/40">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setModalOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-card p-6">
            <h2 className="mb-4 font-display text-2xl font-bold">{form.id ? "Editar produto" : "Novo produto"}</h2>

            {!form.id && (
              <div className="mb-5 rounded-xl border border-primary/30 bg-primary/5 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
                  <Sparkles className="h-4 w-4" /> Preenchimento automático
                </div>
                <p className="mb-3 text-xs text-muted-foreground">
                  Cole o link do produto (AliExpress, Shopee, Mercado Livre, Amazon, etc.) e o sistema busca nome, imagem, preço e mais.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="url"
                      value={autoUrl}
                      onChange={(e) => setAutoUrl(e.target.value)}
                      onPaste={(e) => {
                        const v = e.clipboardData.getData("text").trim();
                        if (/^https?:\/\//i.test(v)) {
                          setAutoUrl(v);
                          setTimeout(() => enrichMut.mutate(v), 50);
                          e.preventDefault();
                        }
                      }}
                      placeholder="Cole aqui o link do produto..."
                      className="input pl-9"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={enrichMut.isPending || !autoUrl.trim()}
                    onClick={() => enrichMut.mutate(autoUrl.trim())}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    <Sparkles className="h-4 w-4" />
                    {enrichMut.isPending ? "Buscando..." : "Buscar dados"}
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); if (!form.name.trim()) { toast.error("Nome é obrigatório"); return; } saveMut.mutate(); }} className="space-y-4">
              <Field label="Nome *"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" /></Field>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Link do fornecedor"><input type="url" placeholder="https://..." value={form.supplier_url} onChange={(e) => setForm({ ...form, supplier_url: e.target.value })} className="input" /></Field>
                <Field label="URL da imagem"><input type="url" placeholder="https://..." value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="input" /></Field>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <Field label="Preço origem"><input type="number" step="0.01" min="0" value={form.origin_price} onChange={(e) => setForm({ ...form, origin_price: e.target.value })} className="input" /></Field>
                <Field label="Moeda">
                  <select value={form.origin_currency} onChange={(e) => setForm({ ...form, origin_currency: e.target.value as FormState["origin_currency"] })} className="input">
                    <option value="USD">USD</option><option value="EUR">EUR</option><option value="CNY">CNY</option><option value="BRL">BRL</option>
                  </select>
                </Field>
                <Field label="Peso (kg)"><input type="number" step="0.001" min="0" value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} className="input" /></Field>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Categoria"><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input" /></Field>
                <Field label="Status">
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as FormState["status"] })} className="input">
                    <option value="analise">Em análise</option><option value="importado">Importado</option><option value="arquivado">Arquivado</option>
                  </select>
                </Field>
              </div>
              <Field label="Observações"><textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input" /></Field>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-white/10 px-4 py-2 text-sm">Cancelar</button>
                <button type="submit" disabled={saveMut.isPending} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                  {saveMut.isPending ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`.input{width:100%;height:40px;border-radius:8px;border:1px solid rgba(255,255,255,.1);background:rgba(0,0,0,.2);padding:0 12px;font-size:14px;outline:none}.input:focus{border-color:oklch(0.65 0.19 255/.5)}textarea.input{height:auto;padding:10px 12px}`}</style>
    </DashboardShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    analise: "border-amber-500/40 bg-amber-500/10 text-amber-400",
    importado: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
    arquivado: "border-white/20 bg-white/5 text-muted-foreground",
  };
  const label: Record<string, string> = { analise: "Análise", importado: "Importado", arquivado: "Arquivado" };
  return <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${map[status] ?? map.arquivado}`}>{label[status] ?? status}</span>;
}
