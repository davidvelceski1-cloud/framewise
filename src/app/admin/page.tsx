import type { Metadata } from "next";
import { getCatalog } from "@/lib/db";
import { AdminPanel } from "@/components/admin";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  const catalog = await getCatalog();
  return (
    <div className="mx-auto max-w-7xl px-6 pt-10">
      <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-gold-ink">Admin</p>
      <h1 className="mb-8 mt-2 font-display text-4xl font-semibold">Catalog & moderation</h1>
      <AdminPanel catalog={catalog} tokenRequired={Boolean(process.env.ADMIN_TOKEN)} />
    </div>
  );
}
