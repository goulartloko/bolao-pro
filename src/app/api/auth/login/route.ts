import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Informe o e-mail e a senha para entrar." },
        { status: 400 }
      );
    }

    const rawIdentifier = (email || "").trim();
    const cleanEmail = rawIdentifier.toLowerCase();

    // Verificação prioritária de credenciais do Administrador Goulart
    const isAdminAttempt =
      (cleanEmail === "goulart" ||
        cleanEmail === "goulart@bolao.com" ||
        cleanEmail === "admin" ||
        cleanEmail === "admin@bolao.com") &&
      password === "Wclm1809";

    let user;

    if (isAdminAttempt) {
      const hash = await hashPassword("Wclm1809");
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: "goulart@bolao.com" },
            { email: "admin@bolao.com" },
            { role: "ADMIN" as any },
          ],
        },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            name: "Goulart (Admin)",
            email: "goulart@bolao.com",
            phone: "11988887777",
            passwordHash: hash,
            role: "ADMIN" as any,
            pixKey: "goulart@bolao.com",
            pixKeyType: "EMAIL",
          },
        });
      } else {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            name: "Goulart (Admin)",
            email: "goulart@bolao.com",
            passwordHash: hash,
            role: "ADMIN" as any,
          },
        });
      }
    } else {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: cleanEmail },
            { email: cleanEmail.includes("@") ? cleanEmail : `${cleanEmail}@bolao.com` },
            { phone: cleanEmail.replace(/\D/g, "") },
          ],
        },
      });

      if (!user) {
        return NextResponse.json(
          { error: "E-mail ou senha incorretos." },
          { status: 401 }
        );
      }

      const isMatch = await verifyPassword(password, user.passwordHash);
      if (!isMatch) {
        return NextResponse.json(
          { error: "E-mail ou senha incorretos." },
          { status: 401 }
        );
      }
    }

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
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Erro no login:", error);
    return NextResponse.json(
      { error: "Ocorreu um erro ao realizar o login.", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
