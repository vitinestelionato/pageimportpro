import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  validateSearch: z.object({}).passthrough(),
  beforeLoad: async () => {
    // 1) Must have a valid Supabase session.
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/login", search: { reason: "session_expired" } });
    }

    // 2) Must have an ACTIVE profile row (created by the Cakto webhook).
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError) {
      await supabase.auth.signOut();
      throw redirect({ to: "/login", search: { reason: "unknown" } });
    }

    if (!profile) {
      await supabase.auth.signOut();
      throw redirect({ to: "/login", search: { reason: "not_purchased" } });
    }

    if (profile.status !== "active") {
      await supabase.auth.signOut();
      throw redirect({ to: "/login", search: { reason: "inactive" } });
    }

    return { user: data.user };
  },
  component: () => <Outlet />,
});
