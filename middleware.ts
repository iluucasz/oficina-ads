import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Verificar se a rota precisa de proteção (começa com /app)
  const isProtectedRoute = pathname.startsWith('/app');
  
  // Verificar se já está na página de login
  const isLoginPage = pathname.startsWith('/auth/login');
  
  // Verificar token de autenticação
  const token = await getToken({ 
    req: request,
    secret: process.env.AUTH_SECRET
  });
  
  // Se estiver acessando uma rota protegida e não estiver autenticado, redirecionar para o login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/auth/login', request.url);
    // Adicionar a URL atual como parâmetro de redirecionamento (callback)
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Se estiver na página de login e já estiver autenticado, redirecionar para o dashboard
  if (isLoginPage && token) {
    const dashboardUrl = new URL('/app/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }
  
  return NextResponse.next();
}

// Configurar paths que o middleware deve ser executado
export const config = {
  matcher: [
    // Aplicar middleware em todas as rotas /app
    '/app/:path*',
    // Aplicar middleware na página de login
    '/auth/login'
  ]
}; 