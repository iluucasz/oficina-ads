"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AppPage() {
  const router = useRouter();
  
  // Redirecionar para o dashboard no lado do cliente
  useEffect(() => {
    router.push("/app/dashboard");
  }, [router]);
  
  // Renderizar um estado de carregamento enquanto redireciona
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <p>Redirecionando para o dashboard...</p>
    </div>
  );
} 