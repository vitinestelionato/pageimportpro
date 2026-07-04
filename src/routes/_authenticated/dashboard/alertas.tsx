import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/dashboard/ComingSoon";
export const Route = createFileRoute("/_authenticated/dashboard/alertas")({
  head: () => ({ meta: [{ title: "Alertas · ImportPro" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: () => <ComingSoon slug="alertas" />,
});
