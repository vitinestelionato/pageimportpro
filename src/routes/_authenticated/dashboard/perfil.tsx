import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { User } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard/perfil")({
  head: () => ({ meta: [{ title: "Meu Perfil · ImportPro" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: PerfilPage,
});

function PerfilPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    id: "", full_name: "", email: "", phone: "", plan: "", provider: "",
    purchase_date: "" as string | null,
  });

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", userData.user.id).maybeSingle();
      if (data) {
        setProfile({
          id: data.id,
          full_name: data.full_name ?? "",
          email: data.email ?? userData.user.email ?? "",
          phone: data.phone ?? "",
          plan: data.plan ?? "",
          provider: data.provider ?? "",
          purchase_date: data.purchase_date,
        });
      }
      setLoading(false);
    })();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: profile.full_name, phone: profile.phone })
      .eq("id", profile.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Perfil atualizado");
  };

  return (
    <DashboardShell breadcrumb="Perfil" title="Meu Perfil">
      {loading ? (
        <div className="rounded-2xl border border-white/5 bg-card/40 p-12 text-center text-muted-foreground">Carregando...</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <form onSubmit={save} className="space-y-4 rounded-2xl border border-white/5 bg-card/60 p-6">
            <h2 className="flex items-center gap-2 font-semibold"><User className="h-4 w-4 text-primary" /> Dados pessoais</h2>
            <Field label="Nome completo"><input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} className="input" /></Field>
            <Field label="Email"><input value={profile.email} disabled className="input opacity-60" /></Field>
            <Field label="Telefone"><input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="input" /></Field>
            <button disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </form>
          <aside className="space-y-4 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent p-6">
            <h2 className="font-semibold">Meu Plano</h2>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Plano atual</div>
              <div className="mt-1 font-display text-2xl font-bold text-primary">{(profile.plan || "FREE").toUpperCase()}</div>
            </div>
            <Info label="Origem" value={profile.provider || "—"} />
            <Info label="Data de compra" value={profile.purchase_date ? new Date(profile.purchase_date).toLocaleDateString("pt-BR") : "—"} />
          </aside>
        </div>
      )}
      <style>{`.input{width:100%;height:40px;border-radius:8px;border:1px solid rgba(255,255,255,.1);background:rgba(0,0,0,.2);padding:0 12px;font-size:14px;outline:none}`}</style>
    </DashboardShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>{children}</label>;
}
function Info({ label, value }: { label: string; value: string }) {
  return <div><div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div><div className="text-sm font-medium">{value}</div></div>;
}
