import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, password, favoriteTeam } = await req.json();

    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        { error: "Todos os campos (Nome, E-mail, WhatsApp e Senha) são obrigatórios." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.replace(/\D/g, "");

    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { error: "Por favor informe um WhatsApp válido com DDD (ex: 11999998888)." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Já existe uma conta cadastrada com este e-mail. Faça login para continuar." },
        { status: 409 }
      );
    }

    // Anti-fraude: WhatsApp único por jogador
    const existingPhone = await prisma.user.findFirst({
      where: { phone: cleanPhone },
    });

    if (existingPhone) {
      return NextResponse.json(
        { error: "Já existe uma conta cadastrada com este número de WhatsApp. Conforme o regulamento, é permitida apenas 1 conta por jogador." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Se for o primeiro usuário do sistema ou email conter 'admin', pode ser ADMIN
    const userCount = await prisma.user.count();
    const role = userCount === 0 || cleanEmail.includes("admin") ? "ADMIN" : "PLAYER";

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        phone: cleanPhone,
        passwordHash,
        role,
        favoriteTeam: favoriteTeam?.trim() || null,
      },
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role as any,
      name: user.name,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 dias
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Erro no cadastro:", error);
    return NextResponse.json(
      { error: "Ocorreu um erro ao processar o cadastro.", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
