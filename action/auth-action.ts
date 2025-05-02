"use server";
import { hash } from 'bcrypt';
import { PrismaClient, Role, SubscriptionPlan } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const registerSchema = z.object({
  name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
  email: z.string().email({ message: "Seu e-mail é inválido." }),
  password: z.string().min(4, { message: "A senha deve ter pelo menos 4 caracteres." }),
  cnpj: z.string().min(11, { message: "O CNPJ/CPF deve ter no mínimo 11 caracteres." }),
  empresa: z.string().optional(),
  rua: z.string().min(5, { message: "A rua deve ter pelo menos 5 caracteres." }),
  numeroRua: z.string().min(1, { message: "O número da rua é obrigatório." }),
  cidade: z.string().min(3, { message: "A cidade deve ter pelo menos 3 caracteres." }),
  estado: z.string().min(2, { message: "O estado deve ter 2 caracteres." }),
  cep: z.string().min(8, { message: "O CEP deve ter 8 caracteres." }),
  telefone: z.string().optional(),
  plano: z.enum(["Básico", "Premium", "Empresarial"], {
    required_error: "Por favor, selecione um plano.",
  }),
});

export async function registerUser(data: any) {
  console.log("Server action registerUser - dados recebidos:", data);
  // Validação
  const parsed = registerSchema.parse(data);

  // Verifica duplicação de usuário
  const existingUser = await prisma.user.findUnique({ where: { email: parsed.email } });
  if (existingUser) {
    throw new Error("Email already in use");
  }

  // Hash da senha
  const hashedPassword = await hash(parsed.password, 10);

  // Mapeia plano
  let role: Role;
  let subscriptionPlan: SubscriptionPlan;
  if (parsed.plano === 'Básico') {
    role = 'regular';
    subscriptionPlan = 'basic';
  } else if (parsed.plano === 'Premium') {
    role = 'regular';
    subscriptionPlan = 'premium';
  } else {
    role = 'admin';
    subscriptionPlan = 'enterprise';
  }

  // Cria usuário
  const newUser = await prisma.user.create({
    data: {
      email: parsed.email,
      password: hashedPassword,
      fullName: parsed.name,
      companyName: parsed.empresa,
      cnpj: parsed.cnpj,
      street: parsed.rua,
      streetNumber: parsed.numeroRua,
      city: parsed.cidade,
      state: parsed.estado,
      cep: parsed.cep,
      phone: parsed.telefone,
      role,
      subscriptionPlan,
    },
  });

  console.log("Server action registerUser - novo usuário criado:", newUser);
  return newUser;
}
