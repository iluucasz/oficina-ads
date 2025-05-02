"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Header } from "@/components/header";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Usar useEffect para redirecionar no lado do cliente
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);
  
  // Mostrar loading enquanto a sessão está sendo carregada
  if (status === "loading") {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-2 text-lg">Carregando...</span>
      </div>
    );
  }

  // Se não estiver autenticado, mostrar loading até o redirecionamento
  if (status === "unauthenticated") {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-2 text-lg">Redirecionando...</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Aqui você pode adicionar componentes como header, sidebar, etc. */}
      <Header />
      <div className="flex flex-col">
        {/* Conteúdo principal */}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
} 