import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function requireAdmin() {
  if (await isAdminAuthenticated()) return null;
  return NextResponse.json({ error: "Sessão administrativa inválida ou expirada." }, { status: 401 });
}

export function adminError(error: unknown, message = "Não foi possível concluir a operação.") {
  console.error(message, error);
  return NextResponse.json({ error: message }, { status: 500 });
}
