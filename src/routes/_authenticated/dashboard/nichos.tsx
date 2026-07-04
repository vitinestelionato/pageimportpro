import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/dashboard/ComingSoon";
export const Route = createFileRoute("/_authenticated/dashboard/nichos")({
  head: () => ({ meta: [{ title: "Nichos · ImportPro" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: () => <ComingSoon slug="nichos" />,
});
