"use client";
import { ModeToggle } from "@/components/mode-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { useEffect } from "react";
import { useAvatar } from "@/lib/hooks/use-avatar";

// Define o tipo extendido para o usuário da sessão
interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  role?: string;
  subscriptionPlan?: string;
}

export function Header() {
  const { data: session, status, update: updateSession } = useSession();
  const user = session?.user as ExtendedUser | undefined;
  const { avatarUrl, refreshAvatar } = useAvatar();

  // Atualizar o avatar quando a sessão mudar
  useEffect(() => {
    refreshAvatar();
    
    // Verificar atualizações periódicas enquanto na página de configurações
    const interval = setInterval(() => {
      if (window.location.hash.includes("settings")) {
        updateSession();
        refreshAvatar();
      }
    }, 15000);
    
    return () => clearInterval(interval);
  }, [status, updateSession, refreshAvatar]);

  // Obter iniciais do nome do usuário para avatar fallback
  const getUserInitials = () => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Abrir modal de configurações na aba especificada
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
                  {avatarUrl ? (
                    <AvatarImage
                      src={avatarUrl}
                      alt={user?.name || "Avatar"}
                    />
                  ) : null}
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  {user?.name && <p className="font-medium">{user.name}</p>}
                  {user?.email && (
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  )}
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => openSettingsModal("profile")}
                className="cursor-pointer"
              >
                <UserCircle className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => openSettingsModal("general")}
                className="cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => signOut({ redirect: true, callbackUrl: "/" })}
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
