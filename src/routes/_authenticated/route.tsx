import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // 1) Must have a valid Supabase session.
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/login" });
    }

    // 2) Must have an ACTIVE profile row (created by the Cakto webhook).
    //    RLS scopes profiles to auth.uid(), so this returns only the current user's row.
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError || !profile || profile.status !== "active") {
      // Orphan session or deactivated account — sign out and bounce to login.
      await supabase.auth.signOut();
      throw redirect({ to: "/login" });
    }

    return { user: data.user };
  },
  component: () => <Outlet />,
});
