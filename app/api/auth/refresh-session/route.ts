import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Endpoint para atualizar a sessão com dados mais recentes do usuário
 */
export async function GET() {
  try {
    // Obter a sessão atual
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      console.error("[refresh-session] Erro: Usuário não autenticado");
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    
    // Obter dados atualizados do usuário do banco de dados
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true,
        email: true,
        avatarUrl: true,
        fullName: true,
        role: true,
        subscriptionPlan: true,
        lastLogin: true,
        cnpj: true,
        companyName: true,
        street: true,
        streetNumber: true,
        city: true,
        state: true,
        cep: true,
        phone: true
      }
    });
    
    if (!user) {
      console.error("[refresh-session] Erro: Usuário não encontrado no banco");
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }
    
    // Mapear dados para o formato esperado na sessão
    const userData = {
      id: user.id,
      email: user.email,
      avatarUrl: user.avatarUrl,
      name: user.fullName,
      role: user.role,
      subscriptionPlan: user.subscriptionPlan,
      cnpj: user.cnpj,
      companyName: user.companyName,
      street: user.street,
      streetNumber: user.streetNumber,
      city: user.city,
      state: user.state,
      cep: user.cep,
      phone: user.phone
    };
    
    return NextResponse.json({ 
      success: true,
      message: "Sessão atualizada com sucesso",
      user: userData
    });
  } catch (error) {
    console.error("[refresh-session] Erro ao atualizar sessão:", error);
    return NextResponse.json({ 
      error: "Erro interno do servidor",
      details: String(error)
    }, { status: 500 });
  }
} 