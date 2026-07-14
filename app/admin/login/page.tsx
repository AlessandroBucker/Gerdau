import { redirect } from "next/navigation";
import { AdminLogin } from "@/components/admin-login";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) redirect("/admin");
  return <main className="flex min-h-screen items-center justify-center px-4 py-10"><AdminLogin /></main>;
}
