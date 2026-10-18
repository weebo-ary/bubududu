import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function requireCoupleAccess() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const denied = (error, status) =>
    Response.json(
      { error },
      { status, headers: { "Cache-Control": "private, no-store" } },
    );
  if (!url || !key) return denied("Authentication is not configured.", 503);
  const store = await cookies();
  const db = createServerClient(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (values) =>
        values.forEach(({ name, value, options }) =>
          store.set(name, value, options),
        ),
    },
  });
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user)
    return denied("Sign in to open your shared photo albums.", 401);
  const access = await db.rpc("is_couple");
  if (access.error || !access.data) return denied("Only for Bubu & Dudu.", 403);
  return null;
}
