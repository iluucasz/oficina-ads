"use client";
import { ModeToggle } from "@/components/mode-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Bell, LogOut, Search, Settings, UserCircle } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Define o tipo extendido para o usuário da sessão
interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  avatarUrl?: string | null;
  role?: string;
  subscriptionPlan?: string;
}

export function Header() {
  const { data: session, status } = useSession();
  const user = session?.user as ExtendedUser | undefined;
  const router = useRouter();
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Função para buscar o perfil do usuário da API
  const fetchUserProfile = async () => {
    if (!session?.user) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/user/profile');
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.user && data.user.avatarUrl) {
          // Adicionar timestamp para evitar cache da imagem
          const timestamp = new Date().getTime();
          const avatarUrlWithTimestamp = `${data.user.avatarUrl}?t=${timestamp}`;
          setAvatarSrc(avatarUrlWithTimestamp);
        } else if (user?.image) {
          console.log("No avatarUrl from API, using image:", user.image);
          setAvatarSrc(user.image);
        } else {
          // Limpar explicitamente se não há avatar
          console.log("No avatar found, clearing avatarSrc");
          setAvatarSrc(null);
        }
      } else {
        console.error("Error fetching user profile:", await response.text());
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  // Tenta usar avatarUrl da sessão primeiro, depois busca da API
  useEffect(() => {
    
    if (user?.avatarUrl) {
      // Adicionar timestamp para evitar cache da imagem
      const timestamp = new Date().getTime();
      const avatarUrlWithTimestamp = `${user.avatarUrl}?t=${timestamp}`;
      setAvatarSrc(avatarUrlWithTimestamp);
    } else if (user?.image) {
      setAvatarSrc(user.image);
    } else {
      setAvatarSrc(null); // Limpar explicitamente quando não há avatar
      fetchUserProfile();
    }
  }, [user?.avatarUrl, user?.image, status, session]);

  // Recarregar o avatar quando a URL mudar ou quando o localStorage for atualizado
  useEffect(() => {
    const handleHashChange = () => {
      if (!window.location.hash.includes("settings")) {
        fetchUserProfile();
      }
    };
    
    const handleStorageChange = (e: StorageEvent) => {
      console.log("Storage event detected:", e.key);
      if (e.key === 'avatarUpdated') {
        fetchUserProfile();
      }
      
      if (e.key === 'forceRefresh') {
        window.location.reload();
      }

      if (e.key === 'sessionRecreated') {
        fetchUserProfile();
      }
    };
    
    // Verificar diretamente o localStorage
    const checkLocalStorage = () => {
      const lastUpdate = localStorage.getItem('avatarUpdated');
      if (lastUpdate) {
        fetchUserProfile();
        // Limpar para não repetir
        localStorage.removeItem('avatarUpdated');
      }
      
      const forceRefresh = localStorage.getItem('forceRefresh');
      if (forceRefresh) {
        localStorage.removeItem('forceRefresh');
        // Forçar nova busca do avatar
        setTimeout(() => {
          fetchUserProfile();
          // Também podemos tentar atualizar a sessão
          if (session) {
            const event = new CustomEvent('session-update', { detail: { updated: true } });
            document.dispatchEvent(event);
          }
        }, 500);
      }

      const sessionRecreated = localStorage.getItem('sessionRecreated');
      if (sessionRecreated) {
        localStorage.removeItem('sessionRecreated');
        
        // Se a sessão foi recriada, forçar a limpeza do avatarSrc e buscar dados novamente
        setAvatarSrc(null);
        
        // Esperar um pouco e recarregar os dados do usuário
        setTimeout(() => {
          fetchUserProfile();
        }, 1000);
      }
    };
    
    // Verificar ao montar o componente
    checkLocalStorage();
    
    // Configurar ouvintes
    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("storage", handleStorageChange);
    
    // Configurar verificação periódica
    const interval = setInterval(checkLocalStorage, 1000);
    
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Adicionar um listener para o evento personalizado avatar-updated
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const handleAvatarUpdated = (e: CustomEvent) => {
      
      const { avatarUrl, timestamp } = e.detail;
      
      if (avatarUrl) {
        // Adicionar timestamp para evitar cache
        const avatarUrlWithTimestamp = `${avatarUrl}?t=${timestamp}`;
        setAvatarSrc(avatarUrlWithTimestamp);
      } else {
        // Limpar o avatar se foi removido
        setAvatarSrc(null);
      }
    };
    
    // Adicionar o listener para o evento personalizado
    document.addEventListener('avatar-updated', handleAvatarUpdated as EventListener);
    
    // Remover o listener quando o componente for desmontado
    return () => {
      document.removeEventListener('avatar-updated', handleAvatarUpdated as EventListener);
    };
  }, []);

  // Função para obter as iniciais do nome do usuário
  const getUserInitials = () => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Função para abrir o modal de configurações
  const openSettingsModal = (tab: string) => {
    window.location.hash = `settings/${tab}`;
  };

  return (
    <header className="sticky z-50 top-0 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Image
            src="/logo.png"
            alt="Logo"
            width={52}
            height={52}
            className="object-cover"
          />
          <span className="font-bold text-[#38a37f] text-xl">OFICINA ADS</span>
        </Link>

        <div className="flex-1 mx-8">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Pesquisar..."
              className="w-full bg-background pl-8 md:w-[300px] lg:w-[400px]"
            />
          </div>
        </div>

        <nav className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Notificações">
            <Bell className="h-5 w-5" />
          </Button>

          <ModeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Perfil"
                className="rounded-full"
              >
                <Avatar className="h-8 w-8">
                  {avatarSrc ? (
                    <AvatarImage
                      src={avatarSrc}
                      alt={user?.name || "Avatar"}
                    />
                  ) : null}
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex flex-col space-y-2 p-2">
                <p className="text-sm font-medium">{user?.name || "Usuário"}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email || "email@exemplo.com"}
                </p>

                {user?.role && (
                  <Badge variant="outline" className="self-center cursor-pointer">
                    {user.role === "admin" && "Admin"}
                    {user.role === "regular" && "Comum"}
                    {user.role === "marketing" && "Marketing"}
                    {user.role === "master" && "Master"}
                  </Badge>
                )}

                {user?.subscriptionPlan && (
                  <Badge className="self-center cursor-pointer">
                    Plano:{" "}
                    {user.subscriptionPlan === "basic"
                      ? "Gratuito"
                      : user.subscriptionPlan === "premium"
                      ? "Premium"
                      : user.subscriptionPlan === "enterprise"
                      ? "Empresarial"
                      : user.subscriptionPlan}
                  </Badge>
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <button
                  className="cursor-pointer flex w-full items-center"
                  onClick={() => {
                    window.location.hash = "settings/profile";
                  }}
                >
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </button>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <button
                  className="cursor-pointer flex w-full items-center"
                  onClick={() => {
                    window.location.hash = "settings";
                  }}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </button>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/auth/login" })}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  );
}
