import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        favoriteTeam: true,
        avatar: true,
        role: true,
        pixKey: true,
        pixKeyType: true,
        createdAt: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    return NextResponse.json({ user: dbUser });
  } catch (error: any) {
    console.error("Erro ao buscar perfil:", error);
    return NextResponse.json({ error: "Erro ao buscar perfil." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { name, phone, favoriteTeam, avatar, pixKey, pixKeyType } = await req.json();

    const updateData: any = {};
    if (name && typeof name === "string" && name.trim()) {
      updateData.name = name.trim();
    }
    if (phone && typeof phone === "string" && phone.trim()) {
      const cleanPhone = phone.replace(/\D/g, "");
      if (cleanPhone.length >= 10) {
        updateData.phone = cleanPhone;
      }
    }
    if (favoriteTeam !== undefined) {
      updateData.favoriteTeam = favoriteTeam || null;
    }
    if (avatar !== undefined) {
      updateData.avatar = avatar || null;
    }
    if (pixKey !== undefined) {
      updateData.pixKey = pixKey ? pixKey.trim() : null;
    }
    if (pixKeyType !== undefined) {
      updateData.pixKeyType = pixKeyType || null;
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        favoriteTeam: true,
        avatar: true,
        role: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Perfil atualizado com sucesso!",
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Erro ao atualizar perfil:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar dados do perfil." },
      { status: 500 }
    );
  }
}
