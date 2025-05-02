import { DefaultSession } from "next-auth";

// Estendendo o tipo User da sessão padrão do NextAuth
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      avatarUrl?: string | null;
      role: string;
      subscriptionPlan: string;
      // Campos adicionais do usuário
      cnpj?: string | null;
      companyName?: string | null;
      street?: string | null;
      streetNumber?: string | null;
      city?: string | null;
      state?: string | null;
      cep?: string | null;
      phone?: string | null;
      // Informações da assinatura
      subscription?: {
        id: string;
        status: string;
        startDate: string;
        endDate: string;
        graceEndDate: string;
        plan?: {
          id: string;
          name: string;
          durationDays: number;
          graceDays: number;
          priceCents: number;
        };
      } | null;
    } & DefaultSession["user"];
  }
} 