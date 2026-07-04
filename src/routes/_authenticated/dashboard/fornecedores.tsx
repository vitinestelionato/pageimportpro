import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/dashboard/ComingSoon";
export const Route = createFileRoute("/_authenticated/dashboard/fornecedores")({
  head: () => ({ meta: [{ title: "Fornecedores · ImportPro" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: () => <ComingSoon slug="fornecedores" />,
});
