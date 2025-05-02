import { Session } from "next-auth";
import { useSession } from "next-auth/react";

/**
 * Força a atualização da sessão após uma mudança no avatarUrl
 * @param avatarUrl Nova URL do avatar ou null para remover
 */
export async function forceSessionUpdate(avatarUrl: string | null): Promise<void> {
  try {
    console.log(`[forceSessionUpdate] Tentando atualizar a sessão com avatarUrl: ${avatarUrl}`);
    
    // Obtenha a sessão atual
    const session = await fetch('/api/auth/session');
    
    if (!session.ok) {
      console.error('[forceSessionUpdate] Erro ao obter sessão:', await session.text());
      return;
    }
    
    const sessionData = await session.json();
    console.log('[forceSessionUpdate] Sessão atual:', sessionData);
    
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
    
    console.log('[forceSessionUpdate] Sessão atualizada para enviar:', updatedSession);
    
    // Força a atualização do cookie de sessão
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
    
    const responseData = await result.json();
    console.log('[forceSessionUpdate] Resposta da API:', responseData);
    
    // Abordagem segura para atualizar a interface sem recarregar a página inteira
    // Adicionar um timestamp para forçar que todos os componentes reconheçam a mudança
    const timestamp = new Date().getTime();
    localStorage.setItem('avatarUpdated', timestamp.toString());
    
    // Também armazenar a URL atual para que outros componentes possam acessá-la
    if (avatarUrl) {
      localStorage.setItem('currentAvatarUrl', avatarUrl);
    } else {
      localStorage.removeItem('currentAvatarUrl');
    }
    
    // Tentar atualizar diretamente sem recarregar a página
    try {
      const event = new StorageEvent('storage', {
        key: 'avatarUpdated',
        newValue: timestamp.toString()
      });
      window.dispatchEvent(event);
      
      // Também disparar um evento personalizado para componentes que não escutam storage
      const customEvent = new CustomEvent('avatar-updated', { 
        detail: { avatarUrl, timestamp } 
      });
      document.dispatchEvent(customEvent);
      
      console.log('[forceSessionUpdate] Eventos de atualização disparados');
    } catch (e) {
      console.error('[forceSessionUpdate] Erro ao disparar eventos:', e);
    }
    
    // Não recarregar a página para manter a experiência do usuário sem interrupções
    console.log('[forceSessionUpdate] Processo concluído sem recarregar página');
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
    
    // Definir bandeira para forçar atualização dos componentes
    localStorage.setItem('sessionRecreated', new Date().toISOString());
    
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