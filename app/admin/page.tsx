import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin-dashboard";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  return <main className="min-h-screen px-3 py-5 sm:px-6 sm:py-8 lg:px-8"><AdminDashboard /></main>;
}
