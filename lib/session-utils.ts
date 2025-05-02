import { Session } from "next-auth";
import { useSession } from "next-auth/react";

/**
 * Força a atualização da sessão após uma mudança no avatarUrl
 * @param avatarUrl Nova URL do avatar ou null para remover
 */
export async function forceSessionUpdate(avatarUrl: string | null): Promise<void> {
  try {
    // Obtenha a sessão atual
    const session = await fetch('/api/auth/session');
    
    if (!session.ok) {
      console.error('[forceSessionUpdate] Erro ao obter sessão:', await session.text());
      return;
    }
    
    const sessionData = await session.json();
    
    if (!sessionData || !sessionData.user) {
      console.error('[forceSessionUpdate] Sessão não encontrada ou usuário não autenticado');
      return;
    }
    
    // Atualiza o avatarUrl na sessão
    const updatedSession = {
      ...sessionData,
      user: {
        ...sessionData.user,
        avatarUrl: avatarUrl
      }
    };
    
    // Tenta atualizar o cookie de sessão
    const result = await fetch('/api/auth/update-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedSession)
    });
    
    if (!result.ok) {
      const responseText = await result.text();
      console.error(`[forceSessionUpdate] Erro ao atualizar sessão: ${responseText}`);
      throw new Error(`Erro ao atualizar sessão: ${responseText}`);
    }
    
    // Força uma atualização completa
    await fetch('/api/auth/refresh-session');
  } catch (error) {
    console.error('[forceSessionUpdate] Erro ao forçar atualização da sessão:', error);
  }
}

/**
 * Força a recriação completa da sessão após remover o avatar
 * Essa função é mais agressiva e deve ser usada apenas quando necessário
 */
export async function forceNewSession(): Promise<void> {
  try {
    console.log('[forceNewSession] Iniciando recriação completa da sessão');
    
    // Chama o endpoint que limpa os cookies de sessão
    const response = await fetch('/api/auth/refresh-session');
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[forceNewSession] Erro ao limpar sessão:', errorText);
      throw new Error(`Erro ao limpar sessão: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('[forceNewSession] Resposta da API:', result);
    
    // Espera um pouco antes de redirecionar
    setTimeout(() => {
      console.log('[forceNewSession] Redirecionando para página inicial...');
      window.location.href = window.location.origin;
    }, 500);
    
  } catch (error) {
    console.error('[forceNewSession] Erro ao recriar sessão:', error);
    
    // Mesmo com erro, tentar redirecionar para a página inicial
    setTimeout(() => {
      window.location.href = window.location.origin;
    }, 1000);
  }
} 