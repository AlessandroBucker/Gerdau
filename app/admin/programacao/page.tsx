import { redirect } from "next/navigation";
import { AdminProgramming } from "@/components/admin-programming";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export default async function AdminProgrammingPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  return <main className="min-h-screen px-3 py-5 sm:px-6 sm:py-8 lg:px-8"><AdminProgramming /></main>;
}
