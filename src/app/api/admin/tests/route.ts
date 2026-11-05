import { mutateStore } from "@/lib/db";
import { validateTest } from "@/lib/validate";
import { adminHandler } from "../_shared";

export async function POST(req: Request) {
  return adminHandler(req, async () => {
    const t = validateTest(await req.json());
    const id = t.id || `${t.gameSlug}__${t.platform}__${t.mode}__${Date.now().toString(36)}`;
    await mutateStore((s) => {
      s.testEdits[id] = { ...t, id };
      s.deletedTests = s.deletedTests.filter((x) => x !== id);
    });
    return id;
  });
}

export async function DELETE(req: Request) {
  return adminHandler(req, async () => {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) throw new Error("id required");
    await mutateStore((s) => {
      delete s.testEdits[id];
      if (!s.deletedTests.includes(id)) s.deletedTests.push(id);
    });
  });
}
