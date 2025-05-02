"use client";
import { Bell, Search, LogOut, Settings, UserCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModeToggle } from "@/components/mode-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

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
  const { data: session } = useSession();
  const user = session?.user as ExtendedUser;

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

  // Obter a URL do avatar do usuário
  const getUserAvatar = () => {
    if (user?.avatarUrl) return user.avatarUrl;
    if (user?.image) return user.image;
    return "";
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
                  <AvatarImage
                    src={getUserAvatar()}
                    alt={user?.name || "Avatar"}
                  />
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <div>
              Conta: {" "}
              {user?.role && (
                <Badge variant="outline" className="self-center cursor-pointer">
                  {user.role === "admin" && "Admin"}
                  {user.role === "regular" && "Comum"}
                  {user.role === "marketing" && "Marketing"}
                  {user.role === "master" && "Master"}
                </Badge>
              )}
            </div>

            <DropdownMenuContent align="end" className="w-56">
              <div className="flex flex-col space-y-2 p-2">
                <p className="text-sm font-medium">{user?.name || "Usuário"}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email || "email@exemplo.com"}
                </p>

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
              <DropdownMenuItem asChild>
                <Link
                  href="/app/profile"
                  className="cursor-pointer flex w-full items-center"
                >
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/app/settings"
                  className="cursor-pointer flex w-full items-center"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </Link>
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
