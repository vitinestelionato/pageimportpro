import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/dashboard/ComingSoon";
export const Route = createFileRoute("/_authenticated/dashboard/documentos")({
  head: () => ({ meta: [{ title: "Documentos · ImportPro" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: () => <ComingSoon slug="documentos" />,
});
