import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/dashboard/ComingSoon";
export const Route = createFileRoute("/_authenticated/dashboard/rastreio")({
  head: () => ({ meta: [{ title: "Rastreio · ImportPro" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: () => <ComingSoon slug="rastreio" />,
});
