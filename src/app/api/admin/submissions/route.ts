import { mutateStore, readStore } from "@/lib/db";
import { adminAllowed, validateTest } from "@/lib/validate";
import { adminHandler } from "../_shared";

export async function GET(req: Request) {
  if (!adminAllowed(req)) return Response.json({ error: "Admin access denied" }, { status: 401 });
  const s = await readStore();
  return Response.json({ submissions: s.submissions });
}

/** Approve (publishes as an unverified community entry, or verified if requested) or reject. */
export async function POST(req: Request) {
  return adminHandler(req, async () => {
    const { id, action, verify } = (await req.json()) as { id: string; action: "approve" | "reject"; verify?: boolean };
    await mutateStore((s) => {
      const sub = s.submissions.find((x) => x.id === id);
      if (!sub) throw new Error("submission not found");
      sub.status = action === "approve" ? "approved" : "rejected";
      if (action === "approve") {
        const testId = `${sub.test.gameSlug}__${sub.test.platform}__${sub.test.mode}__c${sub.id.slice(0, 6)}`;
        s.testEdits[testId] = validateTest({ ...sub.test, id: testId, verified: !!verify, demo: false });
      }
    });
  });
}
