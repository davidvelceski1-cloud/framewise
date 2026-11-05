import type { Metadata } from "next";
import { getCatalog } from "@/lib/db";
import { Dashboard } from "@/components/dashboard";
import { dashData } from "@/lib/lite";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const catalog = await getCatalog();
  return (
    <div className="pt-10">
      <Dashboard catalog={dashData(catalog)} />
    </div>
  );
}
