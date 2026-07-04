import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ShipmentTracker } from "@/components/dashboard/ShipmentTracker";

export const Route = createFileRoute("/_authenticated/dashboard/produtos")({
  head: () => ({ meta: [{ title: "Rastreamento · ImportPro" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: ProductsPage,
});

function ProductsPage() {
  return (
    <DashboardShell breadcrumb="Rastreamento" title="Rastreamento de Encomendas">
      <ShipmentTracker />
    </DashboardShell>
  );
}
