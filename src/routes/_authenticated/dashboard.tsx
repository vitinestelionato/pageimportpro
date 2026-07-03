import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Home,
  Package,
  BookOpen,
  Sparkles,
  Wrench,
  TrendingUp,
  LayoutGrid,
  Heart,
  Image as ImageIcon,
  Calculator,
  DollarSign,
  Truck,
  FileText,
  StickyNote,
  Flame,
  Layers,
  BarChart3,
  AlertTriangle,
  Bell,
  Eye,
  Sun,
  Moon,
  Zap,
  ChevronRight,
  User,
  CreditCard,
  HelpCircle,
  BookOpenCheck,
  LogOut,
  ArrowUpRight,
  Menu,
  PanelLeftClose,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ImportProLogo, ImportProWordmark } from "@/components/ImportProLogo";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard · ImportPro" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: DashboardPage,
});

type NavGroup = {
  label: string;
  items: { icon: React.ReactNode; label: string; badge?: string; active?: boolean }[];
};

const NAV: NavGroup[] = [
  {
    label: "Visão Geral",
    items: [{ icon: <Home className="h-4 w-4" />, label: "Dashboard", active: true }],
  },
  {
    label: "Meus Produtos",
    items: [{ icon: <Package className="h-4 w-4" />, label: "Gestão de Produtos" }],
  },
  {
    label: "Biblioteca",
    items: [
      { icon: <LayoutGrid className="h-4 w-4" />, label: "Catálogo" },
      { icon: <Heart className="h-4 w-4" />, label: "Favoritos" },
      { icon: <ImageIcon className="h-4 w-4" />, label: "Fornecedores" },
    ],
  },
  {
    label: "Ferramentas",
    items: [
      { icon: <Calculator className="h-4 w-4" />, label: "Calculadora de Impostos" },
      { icon: <DollarSign className="h-4 w-4" />, label: "Câmbio ao vivo" },
      { icon: <Truck className="h-4 w-4" />, label: "Rastreio de Encomenda", badge: "NOVO" },
      { icon: <FileText className="h-4 w-4" />, label: "Documentos" },
      { icon: <StickyNote className="h-4 w-4" />, label: "Anotações" },
    ],
  },
  {
    label: "Tendências",
    items: [
      { icon: <Flame className="h-4 w-4" />, label: "Produtos em Alta" },
      { icon: <Layers className="h-4 w-4" />, label: "Nichos Quentes" },
      { icon: <BarChart3 className="h-4 w-4" />, label: "Concorrentes" },
      { icon: <AlertTriangle className="h-4 w-4" />, label: "Alertas" },
    ],
  },
];

function DashboardPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{
    full_name: string | null;
    email: string | null;
    plan: string | null;
  } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const { data } = await supabase
        .from("profiles")
        .select("full_name,email,plan")
        .eq("id", userData.user.id)
        .maybeSingle();
      setProfile(data);
    })();
  }, []);

  const firstName = (profile?.full_name?.split(" ")[0] ?? "importador").trim();
  const initials = (profile?.full_name ?? profile?.email ?? "IP")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const planLabel = (profile?.plan ?? "FREE").toUpperCase();

  const today = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Sessão encerrada");
    navigate({ to: "/login" });
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-0 -translate-x-full"
        } fixed inset-y-0 left-0 z-40 flex flex-col border-r border-white/5 bg-card/60 backdrop-blur-xl transition-all lg:relative lg:translate-x-0`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/5 px-5">
          <ImportProWordmark />
        </div>

        <div className="p-4">
          <button className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[oklch(0.72_0.19_240)] to-[oklch(0.55_0.22_255)] text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(59,130,246,0.55)] hover:opacity-95">
            <Zap className="h-4 w-4" /> Fazer upgrade
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
          {NAV.map((group) => (
            <div key={group.label}>
              <div className="flex items-center justify-between px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span>{group.label}</span>
                <ChevronRight className="h-3 w-3" />
              </div>
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.label}>
                    <button
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                        item.active
                          ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_oklch(0.65_0.19_255/0.3)]"
                          : "text-foreground/80 hover:bg-white/5"
                      }`}
                    >
                      {item.icon}
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <span className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex min-h-screen flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-white/5 bg-background/70 px-5 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((s) => !s)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-muted-foreground hover:text-foreground"
            >
              {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Visão Geral</span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-semibold">Dashboard</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <IconBtn>
              <Eye className="h-4 w-4" />
            </IconBtn>
            <IconBtn>🇧🇷</IconBtn>
            <IconBtn>
              <Bell className="h-4 w-4" />
            </IconBtn>
            <IconBtn>
              <Moon className="h-4 w-4" />
            </IconBtn>

            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full border border-primary/50 bg-card/70 py-1 pl-3 pr-1 text-sm font-medium ring-1 ring-primary/20"
              >
                <span className="max-w-[100px] truncate">{firstName}</span>
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                  {planLabel}
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[oklch(0.72_0.19_240)] to-[oklch(0.55_0.22_255)] text-xs font-bold text-white">
                  {initials}
                </span>
              </button>

              {menuOpen && (
                <div
                  onMouseLeave={() => setMenuOpen(false)}
                  className="absolute right-0 top-12 z-40 w-72 overflow-hidden rounded-xl border border-white/10 bg-card/95 shadow-2xl backdrop-blur-xl"
                >
                  <div className="p-4">
                    <div className="font-semibold">{profile?.full_name ?? firstName}</div>
                    <div className="text-xs text-muted-foreground">{profile?.email}</div>
                    <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-semibold">
                      {planLabel} · Plano ativo
                    </div>
                  </div>
                  <div className="px-4 pb-3">
                    <button className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[oklch(0.72_0.19_240)] to-[oklch(0.55_0.22_255)] text-sm font-semibold text-white">
                      <Zap className="h-4 w-4" /> Fazer upgrade
                    </button>
                  </div>
                  <ul className="border-t border-white/5 py-2 text-sm">
                    <MenuItem icon={<User className="h-4 w-4" />}>Meu Perfil</MenuItem>
                    <MenuItem icon={<CreditCard className="h-4 w-4" />}>Meu Plano</MenuItem>
                    <MenuItem icon={<HelpCircle className="h-4 w-4" />}>Central de Ajuda</MenuItem>
                    <MenuItem icon={<BookOpenCheck className="h-4 w-4" />}>
                      Documentação
                    </MenuItem>
                  </ul>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 border-t border-white/5 px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" /> Encerrar sessão
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 space-y-8 p-6 lg:p-8">
          <div>
            <p className="text-xs capitalize text-muted-foreground">{today}</p>
            <h1 className="mt-1 font-display text-3xl font-bold">
              Olá, <span className="text-primary">{firstName}</span> 👋
            </h1>
          </div>

          <section className="grid gap-4 md:grid-cols-3">
            <StatCard
              title="Total de Produtos"
              value="0"
              icon={<Package className="h-4 w-4" />}
              accent="from-primary/40"
            />
            <StatCard
              title="Em Análise"
              value="0"
              icon={<BarChart3 className="h-4 w-4" />}
              accent="from-amber-500/40"
              iconBg="bg-amber-500/15 text-amber-400"
            />
            <StatCard
              title="Importados"
              value="0"
              icon={<TrendingUp className="h-4 w-4" />}
              accent="from-emerald-500/40"
              iconBg="bg-emerald-500/15 text-emerald-400"
            />
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <QuickCard
              icon={<Calculator className="h-5 w-5" />}
              title="Calcular Impostos"
              subtitle="Simule o custo total de importação"
              iconBg="bg-primary/15 text-primary"
            />
            <QuickCard
              icon={<Flame className="h-5 w-5" />}
              title="Produtos em Alta"
              subtitle="Nichos e itens que estão bombando"
              iconBg="bg-orange-500/15 text-orange-400"
            />
            <QuickCard
              icon={<Truck className="h-5 w-5" />}
              title="Rastrear Encomenda"
              subtitle="Acompanhamento em tempo real"
              iconBg="bg-emerald-500/15 text-emerald-400"
            />
          </section>

          <section className="rounded-2xl border border-white/5 bg-card/60 p-6 backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">Novidades da semana</h2>
              </div>
              <button className="text-xs font-medium text-primary hover:underline">
                Ver todas <ArrowUpRight className="ml-1 inline h-3 w-3" />
              </button>
            </div>
            <div className="space-y-3">
              <ActivityRow
                title="Novo módulo: Rastreio de Encomenda ao vivo"
                tag="NOVO"
                time="há 2 dias"
              />
              <ActivityRow
                title="Atualização da tabela de impostos por estado"
                tag="RECENTE"
                time="há 5 dias"
              />
              <ActivityRow
                title="Integração com Correios e principais transportadoras"
                tag="LANÇAMENTO"
                time="semana passada"
              />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function IconBtn({ children }: { children: React.ReactNode }) {
  return (
    <button className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-card/60 text-sm text-muted-foreground transition hover:text-foreground">
      {children}
    </button>
  );
}

function MenuItem({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li>
      <button className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5">
        <span className="text-muted-foreground">{icon}</span>
        <span>{children}</span>
      </button>
    </li>
  );
}

function StatCard({
  title,
  value,
  icon,
  accent,
  iconBg = "bg-primary/15 text-primary",
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
  iconBg?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-card/70 p-5 backdrop-blur transition hover:border-primary/30">
      <div
        className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${accent} to-transparent`}
      />
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconBg}`}>
          {icon}
        </span>
      </div>
      <div className="mt-4 font-display text-4xl font-bold">{value}</div>
    </div>
  );
}

function QuickCard({
  icon,
  title,
  subtitle,
  iconBg,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  iconBg: string;
}) {
  return (
    <button className="group flex items-center gap-4 rounded-2xl border border-white/5 bg-card/60 p-5 text-left backdrop-blur transition hover:border-primary/30 hover:bg-card">
      <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}>
        {icon}
      </span>
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      </div>
      <ArrowUpRight className="ml-auto h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
    </button>
  );
}

function ActivityRow({
  title,
  tag,
  time,
}: {
  title: string;
  tag: string;
  time: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-background/40 p-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
        <Sparkles className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-[11px] text-muted-foreground">{time}</div>
      </div>
      <span className="rounded-md border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
        {tag}
      </span>
    </div>
  );
}
