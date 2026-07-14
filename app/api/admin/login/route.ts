import { NextRequest, NextResponse } from "next/server";
import { createAdminSession, validateAdminCredentials } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const username = typeof body === "object" && body !== null && "username" in body ? String(body.username) : "";
    const password = typeof body === "object" && body !== null && "password" in body ? String(body.password) : "";

    if (!validateAdminCredentials(username, password)) {
      return NextResponse.json({ error: "Usuário ou senha inválidos." }, { status: 401 });
    }

    await createAdminSession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro no login administrativo:", error);
    return NextResponse.json({ error: "Login administrativo não configurado." }, { status: 500 });
  }
}
