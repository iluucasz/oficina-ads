import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

export async function POST(req: NextRequest) {
  try {
    // Verificar se o usuário está autenticado
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    
    
    // Obter o token JWT atual
    const token = await getToken({ req });
    
    if (!token) {
      return NextResponse.json({ error: "Token não encontrado" }, { status: 401 });
    }
    
    // Obter dados do corpo da requisição
    const data = await req.json();

    
    if (!data.user) {

      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }
    
    // Determinar o valor de avatarUrl explicitamente
    // Importante: diferencia entre undefined (não atualizar) e null (remover)
    const avatarUrl = data.user.avatarUrl === null ? null : data.user.avatarUrl;
    
    
    // Atualizar o avatarUrl no banco de dados
    try {
      const updatedUser = await prisma.user.update({
        where: { email: session.user.email },
        data: { avatarUrl }
      });
      

      // O NextAuth irá recuperar o usuário atualizado na próxima requisição
      return NextResponse.json({
        success: true,
        message: "Sessão atualizada com sucesso",
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          avatarUrl: updatedUser.avatarUrl
        }
      });
    } catch (dbError) {
      return NextResponse.json({ 
        error: "Erro ao atualizar usuário no banco de dados",
        details: String(dbError)
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ 
      error: "Erro interno do servidor",
      details: String(error)
    }, { status: 500 });
  }
} 