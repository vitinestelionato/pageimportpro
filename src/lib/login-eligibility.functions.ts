import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Public pre-login check: a user can only sign in if a `profiles` row
 * exists for the given email (created automatically by the Cakto webhook
 * after a successful purchase) AND its status is 'active'.
 *
 * This is a public endpoint — do not leak details beyond eligible/reason.
 */
export const checkLoginEligibility = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ email: z.string().email().max(254) }).parse(data),
  )
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("status")
      .ilike("email", email)
      .maybeSingle();

    if (error) {
      console.error("[login-eligibility] db error", error);
      // Fail closed on infra errors.
      return { eligible: false, reason: "unknown" as const };
    }

    if (!profile) {
      return { eligible: false, reason: "not_purchased" as const };
    }

    if (profile.status !== "active") {
      return { eligible: false, reason: "inactive" as const };
    }

    return { eligible: true as const };
  });
