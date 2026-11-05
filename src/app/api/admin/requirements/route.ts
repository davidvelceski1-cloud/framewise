import { mutateStore } from "@/lib/db";
import { validateRequirements } from "@/lib/validate";
import { adminHandler } from "../_shared";

export async function POST(req: Request) {
  return adminHandler(req, async () => {
    const r = validateRequirements(await req.json());
    await mutateStore((s) => {
      s.reqEdits[r.gameSlug] = r;
    });
    return r.gameSlug;
  });
}
