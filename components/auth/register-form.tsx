/* Criação do componente de formulário de registro */
"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(6, "Confirmação da senha é obrigatória"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof schema>;

const RegisterForm: React.FC = () => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<RegisterFormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: RegisterFormData) => {
    console.log("Dados de registro:", data);
    // Implementar a lógica de registro conforme sua API
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Nome</Label>
        <Input id="name" {...register("name")} placeholder="Seu nome" />
        {errors.name && <p className="text-destructive">{errors.name.message}</p>}
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" {...register("email")} placeholder="seu@exemplo.com" />
        {errors.email && <p className="text-destructive">{errors.email.message}</p>}
      </div>
      <div>
        <Label htmlFor="password">Senha</Label>
        <Input id="password" type="password" {...register("password")} placeholder="******" />
        {errors.password && <p className="text-destructive">{errors.password.message}</p>}
      </div>
      <div>
        <Label htmlFor="confirmPassword">Confirme a Senha</Label>
        <Input id="confirmPassword" type="password" {...register("confirmPassword")} placeholder="******" />
        {errors.confirmPassword && <p className="text-destructive">{errors.confirmPassword.message}</p>}
      </div>
      <Button type="submit" className="w-full">Registrar</Button>
    </form>
  );
};

export default RegisterForm; 