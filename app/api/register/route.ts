import { NextResponse } from 'next/server';
import { hash } from 'bcrypt';
import { PrismaClient, Role, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const registerSchema = z.object({
  name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
  email: z.string().email(),
  password: z.string().min(4),
  passwordConfirm: z.string(),
  cnpj: z.string().optional()
    .refine(val => !val || val.length >= 11, {
      message: "O CNPJ/CPF deve ter no mínimo 11 caracteres."
    }),
  empresa: z.string().optional(),
  cep: z.string().optional()
    .refine(val => !val || val.length >= 8, {
      message: "O CEP deve ter 8 caracteres."
    }),
  rua: z.string().optional()
    .refine(val => !val || val.length >= 5, {
      message: "A rua deve ter pelo menos 5 caracteres."
    }),
  bairro: z.string().optional()
    .refine(val => !val || val.length >= 3, {
      message: "O bairro deve ter pelo menos 3 caracteres."
    }),
  cidade: z.string().optional()
    .refine(val => !val || val.length >= 3, {
      message: "A cidade deve ter pelo menos 3 caracteres."
    }),
  estado: z.string().optional()
    .refine(val => !val || val.length >= 2, {
      message: "O estado deve ter 2 caracteres."
    }),
  telefone: z.string().optional()
    .refine(val => !val || val.length >= 10, {
      message: "O telefone deve ter pelo menos 10 caracteres."
    }),
  plano: z.enum(["Básico", "Premium", "Empresarial"], {
    required_error: "Por favor, selecione um plano."
  }),
  terms: z.boolean().refine(val => val === true, {
    message: "Você precisa aceitar os termos e condições."
  })
}).refine((data) => data.password === data.passwordConfirm, {
  message: "As senhas não coincidem",
  path: ["passwordConfirm"],
}).refine((data) => {
  // Se rua foi preenchida, bairro, cidade e estado são obrigatórios
  if (data.rua && data.rua.length > 0) {
    if (!data.bairro || data.bairro.length < 3) return false;
    if (!data.cidade || data.cidade.length < 3) return false;
    if (!data.estado || data.estado.length < 2) return false;
  }
  return true;
}, {
  message: "Se preencher o endereço, bairro, cidade e estado são obrigatórios",
  path: ["bairro"]
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    // Verifica se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
    }

    // Criptografa a senha
    const hashedPassword = await hash(data.password, 10);

    // Mapeia o campo 'plano' para role e subscriptionPlan
    let role: Role;
    let subscriptionPlan: SubscriptionPlan;
    let durationDays = 30; // Duração padrão de 30 dias
    let graceDays = 5; // Período de carência padrão de 5 dias
    let priceCents = 0; // Preço em centavos

    if (data.plano === 'Básico') {
      role = 'regular' as Role;
      subscriptionPlan = 'basic' as SubscriptionPlan;
      priceCents = 0; // Plano gratuito
      durationDays = 9999; // Duração muito longa para o plano básico (praticamente perpétuo)
    } else if (data.plano === 'Premium') {
      role = 'regular' as Role;
      subscriptionPlan = 'premium' as SubscriptionPlan;
      priceCents = 5999; // R$ 59,99
    } else if (data.plano === 'Empresarial') {
      role = 'admin' as Role;
      subscriptionPlan = 'enterprise' as SubscriptionPlan;
      priceCents = 14999; // R$ 149,99
    } else {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 });
    }

    // Usar transação para criar usuário e assinatura juntos
    const result = await prisma.$transaction(async (tx) => {
      // Cria o usuário com os dados recebidos e mapeados
      const newUser = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          fullName: data.name,
          companyName: data.empresa,
          cnpj: data.cnpj,
          street: data.rua,
          neighborhood: data.bairro,
          city: data.cidade,
          state: data.estado,
          cep: data.cep,
          phone: data.telefone,
          role: role,
          subscriptionPlan: subscriptionPlan,
          termsAccepted: data.terms
        }
      });

      // Busca ou cria o plano correspondente à assinatura
      let plan = await tx.plan.findFirst({
        where: {
          name: data.plano
        }
      });

      if (!plan) {
        plan = await tx.plan.create({
          data: {
            name: data.plano,
            durationDays: durationDays,
            graceDays: graceDays,
            priceCents: priceCents
          }
        });
      }

      // Calcula as datas da assinatura
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + durationDays);
      
      const graceEndDate = new Date(endDate);
      graceEndDate.setDate(graceEndDate.getDate() + graceDays);

      // Cria a assinatura
      const subscription = await tx.subscription.create({
        data: {
          userId: newUser.id,
          planId: plan.id,
          startDate: startDate,
          endDate: endDate,
          graceEndDate: graceEndDate,
          status: 'ACTIVE' as SubscriptionStatus
        }
      });

      return { user: newUser, subscription };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error('Erro de validação de esquema:', error.errors);
      return NextResponse.json({ error: error.errors.map(e => e.message).join(', ') }, { status: 400 });
    }
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 