import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Obter a sessão do usuário
    const session = await getServerSession();
    
    if (!session?.user || !session.user.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    
    // Buscar dados atualizados do usuário diretamente do banco de dados
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        fullName: true,
        email: true,
        avatarUrl: true,
        role: true,
        subscriptionPlan: true,
        cnpj: true,
        companyName: true,
        street: true,
        streetNumber: true,
        city: true,
        state: true,
        cep: true,
        phone: true,
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }
    
    // Retornar os dados atualizados do usuário
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.fullName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
        subscriptionPlan: user.subscriptionPlan,
        cnpj: user.cnpj,
        companyName: user.companyName,
        street: user.street,
        streetNumber: user.streetNumber,
        city: user.city,
        state: user.state,
        cep: user.cep,
        phone: user.phone,
      }
    });
  } catch (error) {
    console.error("Erro ao buscar perfil do usuário:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
} 