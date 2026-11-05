import { revalidateTag } from "next/cache";
import { CATALOG_TAG } from "@/lib/db";
import { adminAllowed, ValidationError } from "@/lib/validate";

export async function adminHandler(req: Request, fn: () => Promise<unknown>) {
  if (!adminAllowed(req)) {
    return Response.json({ error: "Admin access denied. Set ADMIN_TOKEN and send it as x-admin-token." }, { status: 401 });
  }
  try {
    const out = await fn();
    // expire immediately so editors see their change on the next request
    revalidateTag(CATALOG_TAG, { expire: 0 });
    return Response.json({ ok: true, data: out ?? null });
  } catch (e) {
    if (e instanceof ValidationError) return Response.json({ error: e.message }, { status: 400 });
    console.error("[admin]", e);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
