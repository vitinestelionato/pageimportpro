import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ShipmentTracker } from "@/components/dashboard/ShipmentTracker";

export const Route = createFileRoute("/_authenticated/dashboard/rastreio")({
  head: () => ({ meta: [{ title: "Rastreio · ImportPro" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: TrackingPage,
});

function TrackingPage() {
  return (
    <DashboardShell breadcrumb="Rastreio" title="Rastreamento de Encomendas">
      <ShipmentTracker />
    </DashboardShell>
  );
}
