import { mutateStore, readStore } from "@/lib/db";
import { validateTest, ValidationError } from "@/lib/validate";
import type { Submission } from "@/lib/types";

/** Community benchmark submissions → moderation queue. */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { test: Submission["test"]; submittedBy: string };
    const by = typeof body.submittedBy === "string" ? body.submittedBy.slice(0, 120) : "anonymous";
    const test = validateTest({ ...body.test, id: "pending", verified: false, demo: false });
    if (!test.source.url) throw new ValidationError("A https source link (video or capture) is required.");
    const { id: _id, verified: _v, demo: _d, ...rest } = test;
    void _id; void _v; void _d;
    const sub: Submission = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), submittedBy: by, status: "pending", test: rest };
    await mutateStore((s) => {
      if (s.submissions.filter((x) => x.status === "pending").length > 500) throw new ValidationError("Moderation queue is full, try later.");
      s.submissions.unshift(sub);
    });
    return Response.json({ ok: true, id: sub.id });
  } catch (e) {
    if (e instanceof ValidationError) return Response.json({ error: e.message }, { status: 400 });
    return Response.json({ error: "Could not submit" }, { status: 500 });
  }
}

/** A contributor's own submissions (by email) — used on the dashboard. */
export async function GET(req: Request) {
  const by = new URL(req.url).searchParams.get("by");
  if (!by) return Response.json({ submissions: [] });
  const s = await readStore();
  return Response.json({ submissions: s.submissions.filter((x) => x.submittedBy === by).map(({ id, createdAt, status, test }) => ({ id, createdAt, status, test })) });
}
