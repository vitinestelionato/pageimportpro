import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  Home,
  Package,
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
  Moon,
  Zap,
  ChevronRight,
  User,
  CreditCard,
  HelpCircle,
  BookOpenCheck,
  LogOut,
  Menu,
  PanelLeftClose,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ImportProWordmark } from "@/components/ImportProLogo";

type NavItem = { icon: ReactNode; label: string; to: string; badge?: string };
type NavGroup = { label: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    label: "Visão Geral",
    items: [{ icon: <Home className="h-4 w-4" />, label: "Dashboard", to: "/dashboard" }],
  },
  {
    label: "Meus Produtos",
    items: [
      { icon: <Package className="h-4 w-4" />, label: "Gestão de Produtos", to: "/dashboard/produtos" },
    ],
  },
  {
    label: "Biblioteca",
    items: [
      { icon: <LayoutGrid className="h-4 w-4" />, label: "Catálogo", to: "/dashboard/catalogo" },
      { icon: <Heart className="h-4 w-4" />, label: "Favoritos", to: "/dashboard/favoritos" },
      { icon: <ImageIcon className="h-4 w-4" />, label: "Fornecedores", to: "/dashboard/fornecedores" },
    ],
  },
  {
    label: "Ferramentas",
    items: [
      { icon: <Calculator className="h-4 w-4" />, label: "Calculadora de Impostos", to: "/dashboard/calculadora" },
      { icon: <DollarSign className="h-4 w-4" />, label: "Câmbio ao vivo", to: "/dashboard/cambio" },
      { icon: <Truck className="h-4 w-4" />, label: "Rastreio de Encomenda", to: "/dashboard/rastreio", badge: "EM BREVE" },
      { icon: <FileText className="h-4 w-4" />, label: "Documentos", to: "/dashboard/documentos" },
      { icon: <StickyNote className="h-4 w-4" />, label: "Anotações", to: "/dashboard/anotacoes" },
    ],
  },
  {
    label: "Tendências",
    items: [
      { icon: <Flame className="h-4 w-4" />, label: "Produtos em Alta", to: "/dashboard/tendencias" },
      { icon: <Layers className="h-4 w-4" />, label: "Nichos Quentes", to: "/dashboard/nichos" },
      { icon: <BarChart3 className="h-4 w-4" />, label: "Concorrentes", to: "/dashboard/concorrentes" },
      { icon: <AlertTriangle className="h-4 w-4" />, label: "Alertas", to: "/dashboard/alertas" },
    ],
  },
];

export function DashboardShell({
  children,
  title,
  breadcrumb,
}: {
  children: ReactNode;
  title?: string;
  breadcrumb?: string;
}) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [profile, setProfile] = useState<{ full_name: string | null; email: string | null; plan: string | null } | null>(null);
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

  const firstName = (profile?.full_name?.split(" ")[0] ?? profile?.email?.split("@")[0] ?? "importador").trim();
  const initials = (profile?.full_name ?? profile?.email ?? "IP")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const planLabel = (profile?.plan ?? "FREE").toUpperCase();

  const handleLogout = async () => {
    try {
      const m = await import("@/lib/session-tracker");
      await m.endCurrentSession();
    } catch {}
    await supabase.auth.signOut();
    toast.success("Sessão encerrada");
    navigate({ to: "/login" });
  };


  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-0 -translate-x-full"
        } fixed inset-y-0 left-0 z-40 flex h-screen flex-col border-r border-white/5 bg-card/60 backdrop-blur-xl transition-all lg:sticky lg:top-0 lg:translate-x-0`}
      >

        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/5 px-5">
          <Link to="/dashboard"><ImportProWordmark /></Link>
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
                {group.items.map((item) => {
                  const active =
                    item.to === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(item.to);
                  return (
                    <li key={item.label}>
                      <Link
                        to={item.to}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                          active
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
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
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
              <span className="font-semibold">{breadcrumb ?? title ?? "Dashboard"}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <IconBtn><Eye className="h-4 w-4" /></IconBtn>
            <IconBtn>🇧🇷</IconBtn>
            <IconBtn><Bell className="h-4 w-4" /></IconBtn>
            <IconBtn><Moon className="h-4 w-4" /></IconBtn>

            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full border border-primary/50 bg-card/70 py-1 pl-3 pr-1 text-sm font-medium ring-1 ring-primary/20"
              >
                <span className="max-w-[100px] truncate">{firstName}</span>
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold text-muted-foreground">{planLabel}</span>
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
                  <ul className="border-t border-white/5 py-2 text-sm">
                    <MenuLink to="/dashboard/perfil" icon={<User className="h-4 w-4" />}>Meu Perfil</MenuLink>
                    <MenuLink to="/dashboard/perfil" icon={<CreditCard className="h-4 w-4" />}>Meu Plano</MenuLink>
                    <MenuLink to="/suporte" icon={<HelpCircle className="h-4 w-4" />}>Central de Ajuda</MenuLink>
                    <MenuLink to="/dashboard" icon={<BookOpenCheck className="h-4 w-4" />}>Documentação</MenuLink>
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

        <main className="flex-1 space-y-8 p-6 lg:p-8">
          {title && (
            <div>
              <h1 className="font-display text-3xl font-bold">{title}</h1>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

function IconBtn({ children }: { children: ReactNode }) {
  return (
    <button className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-card/60 text-sm text-muted-foreground transition hover:text-foreground">
      {children}
    </button>
  );
}

function MenuLink({ to, icon, children }: { to: string; icon: ReactNode; children: ReactNode }) {
  return (
    <li>
      <Link to={to} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5">
        <span className="text-muted-foreground">{icon}</span>
        <span>{children}</span>
      </Link>
    </li>
  );
}
