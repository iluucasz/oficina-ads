import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    console.log("[refresh-session] Iniciando refresh da sessão");
    
    // Obter a sessão atual
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      console.log("[refresh-session] Erro: Usuário não autenticado");
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    
    console.log(`[refresh-session] Atualizando sessão para: ${session.user.email}`);
    
    // Obter dados atualizados do usuário do banco de dados
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true,
        email: true,
        avatarUrl: true,
        fullName: true
      }
    });
    
    if (!user) {
      console.log("[refresh-session] Erro: Usuário não encontrado no banco");
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }
    
    console.log(`[refresh-session] Dados atualizados do usuário:`, {
      id: user.id,
      email: user.email,
      avatarUrl: user.avatarUrl
    });
    
    // Criar uma resposta que vai limpar e forçar a recriação da sessão
    const response = NextResponse.json({ 
      success: true,
      message: "Sessão atualizada com sucesso",
      user: {
        id: user.id,
        email: user.email,
        avatarUrl: user.avatarUrl
      }
    });
    
    try {
      // Obter o cookieStore de forma síncrona
      const cookieStore = cookies();
      
      // Limpar o cookie de sessão padrão
      const sessionTokenCookie = cookieStore.get("next-auth.session-token");
      if (sessionTokenCookie) {
        console.log("[refresh-session] Limpando cookie de sessão");
        response.cookies.set("next-auth.session-token", "", { 
          expires: new Date(0),
          maxAge: 0,
          path: "/"
        });
      }
      
      // Limpar o cookie de sessão segura (HTTPS)
      const secureSessionTokenCookie = cookieStore.get("__Secure-next-auth.session-token");
      if (secureSessionTokenCookie) {
        console.log("[refresh-session] Limpando cookie de sessão segura");
        response.cookies.set("__Secure-next-auth.session-token", "", { 
          expires: new Date(0),
          maxAge: 0,
          path: "/",
          secure: true
        });
      }
    } catch (cookieError) {
      console.error("[refresh-session] Erro ao manipular cookies:", cookieError);
    }
    
    console.log("[refresh-session] Processo concluído com sucesso");
    return response;
  } catch (error) {
    console.error("[refresh-session] Erro ao atualizar sessão:", error);
    return NextResponse.json({ 
      error: "Erro interno do servidor",
      details: String(error)
    }, { status: 500 });
  }
} 