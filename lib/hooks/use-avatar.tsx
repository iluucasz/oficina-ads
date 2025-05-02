import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

// Definir um tipo para o User que inclui avatarUrl 
interface ExtendedUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  avatarUrl?: string | null;
}

/**
 * Hook personalizado para gerenciar o avatar do usuário com fallback para cache local
 * @returns Um objeto com a URL do avatar e funções para gerenciá-la
 */
export function useAvatar() {
  const { data: session } = useSession();
  const [timestamp, setTimestamp] = useState<number>(Date.now());
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);
  const [calculatedAvatarUrl, setCalculatedAvatarUrl] = useState<string | undefined>(undefined);
  
  const user = session?.user as ExtendedUser | undefined;
  
  // Calcular a URL do avatar
  const calculateAvatarUrl = useCallback(() => {
    // Prioridade: URL local > URL da sessão
    if (localAvatarUrl) {
      return `${localAvatarUrl}?t=${timestamp}`;
    }
    
    // Verificar na sessão
    const sessionAvatarUrl = user?.image || user?.avatarUrl;
    if (!sessionAvatarUrl) {
      return undefined;
    }
    
    return `${sessionAvatarUrl}?t=${timestamp}`;
  }, [localAvatarUrl, timestamp, user]);

  // Verificar se existe uma URL local salva no localStorage
  useEffect(() => {
    try {
      const savedAvatarUrl = localStorage.getItem('localAvatarUrl');
      if (savedAvatarUrl) {
        setLocalAvatarUrl(savedAvatarUrl);
      }
    } catch (error) {
      console.error("Erro crítico ao acessar localStorage:", error);
    }
  }, []);
  
  // Sincronizar com a sessão quando ela mudar
  useEffect(() => {
    try {
      const savedAvatarUrl = localStorage.getItem('localAvatarUrl');
      const sessionAvatarUrl = user?.image || user?.avatarUrl;
      
      if (sessionAvatarUrl && sessionAvatarUrl === savedAvatarUrl) {
        localStorage.removeItem('localAvatarUrl');
        setLocalAvatarUrl(null);
      }
    } catch (error) {
      console.error("Erro crítico ao sincronizar avatar com sessão:", error);
    }
  }, [user]);
  
  // Atualizar a URL calculada
  useEffect(() => {
    setCalculatedAvatarUrl(calculateAvatarUrl());
  }, [calculateAvatarUrl]);
  
  // Função para atualizar o avatar local
  const updateLocalAvatar = useCallback((newAvatarUrl: string | null) => {
    try {
      if (newAvatarUrl) {
        setLocalAvatarUrl(newAvatarUrl);
        localStorage.setItem('localAvatarUrl', newAvatarUrl);
      } else {
        setLocalAvatarUrl(null);
        localStorage.removeItem('localAvatarUrl');
      }
      setTimestamp(Date.now());
    } catch (error) {
      console.error("Erro crítico ao atualizar avatar no localStorage:", error);
    }
  }, []);
  
  // Função para forçar atualização do avatar
  const refreshAvatar = useCallback(() => {
    setTimestamp(Date.now());
  }, []);
  
  return {
    avatarUrl: calculatedAvatarUrl,
    updateLocalAvatar,
    refreshAvatar
  };
} 