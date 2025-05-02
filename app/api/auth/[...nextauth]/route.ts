import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials: { email: string; password: string } | undefined): Promise<any> {
        if (!credentials) throw new Error("Credenciais não informadas");
        const { email, password } = credentials;
        
        try {
          // Buscar usuário pelo email usando o Prisma
          const user = await prisma.user.findUnique({ 
            where: { email },
            include: {
              subscriptions: {
                include: {
                  plan: true
                },
                orderBy: {
                  createdAt: 'desc'
                },
                take: 1
              }
            }
          });
          
          if (!user) throw new Error("Nenhum usuário encontrado com este email");
          
          // Comparar a senha informada com a senha hasheada armazenada
          const isPasswordValid = await bcrypt.compare(password, user.password);
          if (!isPasswordValid) throw new Error("Senha incorreta");
          
          // Verificar se há uma assinatura ativa
          const activeSubscription = user.subscriptions[0];
          if (!activeSubscription || activeSubscription.status === 'EXPIRED') {
            console.warn("Usuário sem assinatura ativa:", email);
            // Permitir login mesmo sem assinatura, mas isso será exibido no dashboard
          }
          
          // Remover a senha do objeto de usuário antes de retorná-lo
          const { password: _, ...userWithoutPassword } = user;
          
          // Log para debug
          console.log("User data at auth:", { 
            id: user.id, 
            email: user.email, 
            avatarUrl: user.avatarUrl 
          });
          
          return userWithoutPassword;
        } catch (error) {
          console.error("Erro na autenticação:", error);
          throw error;
        }
      }
    })
  ],
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user?: any }): Promise<any> {
      if (user) {
        // Adicionar dados do usuário ao token
        token.id = user.id;
        token.email = user.email;
        token.name = user.fullName;
        token.role = user.role;
        token.subscriptionPlan = user.subscriptionPlan;
        token.subscription = user.subscriptions?.[0] || null;
        token.avatarUrl = user.avatarUrl;

        // Adicionar campos adicionais do usuário
        token.cnpj = user.cnpj;
        token.companyName = user.companyName;
        token.street = user.street;
        token.neighborhood = user.neighborhood;
        token.city = user.city;
        token.state = user.state;
        token.cep = user.cep;
        token.phone = user.phone;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }): Promise<any> {
      if (session.user) {
        // Atualizar a sessão com dados do token
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as string;
        session.user.subscriptionPlan = token.subscriptionPlan as string;
        session.user.subscription = token.subscription;
        session.user.avatarUrl = token.avatarUrl;
        
        // Adicionar campos adicionais do usuário à sessão
        session.user.cnpj = token.cnpj;
        session.user.companyName = token.companyName;
        session.user.street = token.street;
        session.user.neighborhood = token.neighborhood;
        session.user.city = token.city;
        session.user.state = token.state;
        session.user.cep = token.cep;
        session.user.phone = token.phone;
      }
      return session;
    }
  },
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  secret: process.env.AUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 