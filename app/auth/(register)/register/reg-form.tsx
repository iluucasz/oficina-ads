"use client";
import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import { registerUser } from "@/config/user.config";

import PlanModal from "./modal/plan-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  name: z
    .string()
    .min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
  email: z.string().email({ message: "Seu e-mail é inválido." }),
  password: z.string().min(4, { message: "A senha deve ter pelo menos 4 caracteres." }),
  passwordConfirm: z.string().min(1, { message: "Confirme sua senha." }),
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
  numeroRua: z.string().optional()
    .refine(val => !val || val.length >= 1, {
      message: "O número é obrigatório se preencher o endereço."
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
    required_error: "Por favor, selecione um plano.",
  }),
  terms: z.boolean().refine(val => val === true, {
    message: "Você precisa aceitar os termos e condições."
  })
}).refine((data) => data.password === data.passwordConfirm, {
  message: "As senhas não coincidem",
  path: ["passwordConfirm"],
}).refine((data) => {
  // Se rua foi preenchida, número, cidade e estado são obrigatórios
  if (data.rua && data.rua.length > 0) {
    if (!data.numeroRua || data.numeroRua.length < 1) return false;
    if (!data.cidade || data.cidade.length < 3) return false;
    if (!data.estado || data.estado.length < 2) return false;
  }
  return true;
}, {
  message: "Se preencher o endereço, número, cidade e estado são obrigatórios",
  path: ["numeroRua"]
});

// Defina o tipo para o formulário baseado no schema
type FormData = z.infer<typeof schema>;

const RegForm = () => {
  const [isPending, startTransition] = React.useTransition();
  const [passwordType, setPasswordType] = useState<string>("password");
  const [confirmPasswordType, setConfirmPasswordType] = useState<string>("password");
  const [selectedPlano, setSelectedPlano] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const togglePasswordType = () => {
    setPasswordType(passwordType === "password" ? "text" : "password");
  };

  const toggleConfirmPasswordType = () => {
    setConfirmPasswordType(confirmPasswordType === "password" ? "text" : "password");
  };

  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    control,
    getValues,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "all",
    defaultValues: {
      terms: false
    }
  });

  const onSubmit = (data: any) => {
    startTransition(async () => {
      try {
        const result = await registerUser(data);
        if (result.user) {
          toast({ title: "Conta criada com sucesso!", description: "Você será redirecionado para o login" });
          reset();
          router.push("/auth/login");
        } else {
          toast({ title: "Erro ao criar conta", description: result.error || "Tente novamente", variant: "destructive" });
        }
      } catch (error: any) {
        console.error("Erro de requisição:", error);
        toast({ title: "Erro de rede", description: error.message || "Tente novamente", variant: "destructive" });
      }
    });
  };

  return (
    <div className="w-full">
      <div className="2xl:mt-8 mt-6 2xl:text-3xl text-2xl font-bold text-default-900">
        Olá, Bem-vindo 👋
      </div>
      <div className="2xl:text-lg text-base text-default-600 mt-2 leading-6">
        Crie uma conta e faça a assinatura para começar a usar
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 xl:mt-7">
        <div className="space-y-4">
          {/* Select de Plano */}
          <div className="flex flex-col items-center">
            <Label htmlFor="plano" className="text-default-600 mb-3">
              Selecione o Plano <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="plano"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={(value) => { field.onChange(value); setSelectedPlano(value); }}
                  value={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um plano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Básico">Assinatura Básica R$ 0,00 - Grátis</SelectItem>
                    <SelectItem value="Premium">Assinatura Premium R$ 59,99 - Mensal</SelectItem>
                    <SelectItem value="Empresarial">Assinatura Empresarial R$ 149,99 - Mensal</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />

            {/* Botão para abrir modal */}
            <Button className="mt-6" type="button" onClick={() => setIsModalOpen(true)}>
              Entenda os planos
            </Button>

            {errors.plano && (
              <div className="text-destructive mt-2">
                {errors.plano.message as string}
              </div>
            )}
          </div>

          {/* Renderiza o restante do formulário apenas se o plano for selecionado */}
          {selectedPlano && (
            <>
              {/* Nome completo */}
              <div>
                <Label htmlFor="name" className="text-default-600 mb-3">
                  Nome Completo <span className="text-destructive">*</span>
                </Label>
                <Input
                  disabled={isPending}
                  id="name"
                  type="text"
                  placeholder="Seu nome completo"
                  {...register("name")}
                  className={cn("", {
                    "border-destructive": errors.name,
                  })}
                />
                {errors.name && (
                  <div className="text-destructive mt-2">
                    {errors.name.message as string}
                  </div>
                )}
              </div>

              {/* E-mail de Contato - Movido para cima */}
              <div>
                <Label htmlFor="email" className="text-default-600 mb-3">
                  E-mail de Contato <span className="text-destructive">*</span>
                </Label>
                <Input
                  disabled={isPending}
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  {...register("email")}
                  className={cn(" ", {
                    "border-destructive": errors.email,
                  })}
                />
                {errors.email && (
                  <div className="text-destructive mt-2">
                    {errors.email.message as string}
                  </div>
                )}
              </div>

              {/* Senha */}
              <div>
                <Label htmlFor="password" className="text-default-600 mb-3">
                  Senha <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    disabled={isPending}
                    id="password"
                    type={passwordType}
                    placeholder="Senha"
                    autoComplete="new-password"
                    {...register("password")}
                    className={cn("", {
                      "border-destructive": errors.password,
                    })}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordType}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-default-600"
                  >
                    {passwordType === "password" ? "Mostrar" : "Ocultar"}
                  </button>
                </div>
                {errors.password && (
                  <div className="text-destructive mt-2">
                    {errors.password.message as string}
                  </div>
                )}
              </div>

              {/* Confirmar Senha */}
              <div>
                <Label htmlFor="passwordConfirm" className="text-default-600 mb-3">
                  Confirmar Senha <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    disabled={isPending}
                    id="passwordConfirm"
                    type={confirmPasswordType}
                    placeholder="Confirme sua senha"
                    autoComplete="new-password"
                    {...register("passwordConfirm")}
                    className={cn("", {
                      "border-destructive": errors.passwordConfirm,
                    })}
                  />
                  <button
                    type="button"
                    onClick={toggleConfirmPasswordType}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-default-600"
                  >
                    {confirmPasswordType === "password" ? "Mostrar" : "Ocultar"}
                  </button>
                </div>
                {errors.passwordConfirm && (
                  <div className="text-destructive mt-2">
                    {errors.passwordConfirm.message as string}
                  </div>
                )}
              </div>

              {/* Nome da Empresa */}
              <div>
                <Label htmlFor="empresa" className="text-default-600 mb-3">
                  Nome da Empresa <span className="text-muted-foreground text-sm">(Opcional)</span>
                </Label>
                <Input
                  disabled={isPending}
                  id="empresa"
                  type="text"
                  placeholder="Nome da sua empresa"
                  {...register("empresa")}
                  className={cn(" ", {
                    "border-destructive": errors.empresa,
                  })}
                />
                {errors.empresa && (
                  <div className="text-destructive mt-2">
                    {errors.empresa.message as string}
                  </div>
                )}
              </div>

              {/* CNPJ/CPF */}
              <div>
                <Label htmlFor="cnpj" className="text-default-600 mb-3">
                  CNPJ ou CPF <span className="text-muted-foreground text-sm">(Opcional)</span>
                </Label>
                <Input
                  disabled={isPending}
                  id="cnpj"
                  type="text"
                  placeholder="12.345.678/0001-00"
                  {...register("cnpj")}
                  className={cn(" ", {
                    "border-destructive": errors.cnpj,
                  })}
                />
                {errors.cnpj && (
                  <div className="text-destructive mt-2">
                    {errors.cnpj.message as string}
                  </div>
                )}
              </div>

              {/* CEP - Posição trocada com rua */}
              <div>
                <Label htmlFor="cep" className="text-default-600 mb-3">
                  CEP <span className="text-muted-foreground text-sm">(Opcional)</span>
                </Label>
                <Input
                  disabled={isPending}
                  id="cep"
                  type="text"
                  placeholder="XXXXX-XXX"
                  {...register("cep")}
                  className={cn(" ", {
                    "border-destructive": errors.cep,
                  })}
                />
                {errors.cep && (
                  <div className="text-destructive mt-2">
                    {errors.cep.message as string}
                  </div>
                )}
              </div>

              {/* Endereço - Posição trocada com CEP */}
              <div>
                <Label htmlFor="rua" className="text-default-600 mb-3">
                  Rua/Logradouro <span className="text-muted-foreground text-sm">(Opcional)</span>
                </Label>
                <Input
                  disabled={isPending}
                  id="rua"
                  type="text"
                  placeholder="Nome da Rua, Número"
                  {...register("rua")}
                  className={cn(" ", {
                    "border-destructive": errors.rua,
                  })}
                />
                {errors.rua && (
                  <div className="text-destructive mt-2">
                    {errors.rua.message as string}
                  </div>
                )}
              </div>

              {/* Bairro substituído por Número */}
              <div>
                <Label htmlFor="numeroRua" className="text-default-600 mb-3">
                  Número <span className="text-muted-foreground text-sm">(Obrigatório se preencher endereço)</span>
                </Label>
                <Input
                  disabled={isPending}
                  id="numeroRua"
                  type="text"
                  placeholder="Número da rua"
                  {...register("numeroRua")}
                  className={cn(" ", {
                    "border-destructive": errors.numeroRua,
                  })}
                />
                {errors.numeroRua && (
                  <div className="text-destructive mt-2">
                    {errors.numeroRua.message as string}
                  </div>
                )}
              </div>

              {/* Cidade e Estado divididos em campos distintos */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cidade" className="text-default-600 mb-3">
                    Cidade <span className="text-muted-foreground text-sm">(Obrigatório se preencher endereço)</span>
                  </Label>
                  <Input
                    disabled={isPending}
                    id="cidade"
                    type="text"
                    placeholder="Nome da Cidade"
                    {...register("cidade")}
                    className={cn("", { "border-destructive": errors.cidade })}
                  />
                  {errors.cidade && (
                    <div className="text-destructive mt-2">{errors.cidade.message as string}</div>
                  )}
                </div>
                <div>
                  <Label htmlFor="estado" className="text-default-600 mb-3">
                    Estado <span className="text-muted-foreground text-sm">(Obrigatório se preencher endereço)</span>
                  </Label>
                  <Input
                    disabled={isPending}
                    id="estado"
                    type="text"
                    placeholder="Sigla do Estado"
                    {...register("estado")}
                    className={cn("", { "border-destructive": errors.estado })}
                  />
                  {errors.estado && (
                    <div className="text-destructive mt-2">{errors.estado.message as string}</div>
                  )}
                </div>
              </div>

              {/* Telefone */}
              <div>
                <Label htmlFor="telefone" className="text-default-600 mb-3">
                  Telefone Comercial <span className="text-muted-foreground text-sm">(Opcional)</span>
                </Label>
                <Input
                  disabled={isPending}
                  id="telefone"
                  type="text"
                  placeholder="(XX) XXXX-XXXX"
                  {...register("telefone")}
                  className={cn(" ", {
                    "border-destructive": errors.telefone,
                  })}
                />
                {errors.telefone && (
                  <div className="text-destructive mt-2">
                    {errors.telefone.message as string}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Checkbox de termos e condições */}
          {selectedPlano && (
            <div className="flex items-center gap-1.5 mt-5 mb-6">
              <Controller
                name="terms"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    className="border-default-300 mt-[1px]"
                    id="terms"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label
                htmlFor="terms"
                className="text-sm text-default-600 cursor-pointer whitespace-nowrap"
              >
                Você aceita nossos Termos e Condições <span className="text-destructive">*</span>
              </Label>
            </div>
          )}
          {errors.terms && (
            <div className="text-destructive mt-0 mb-4">
              {errors.terms.message as string}
            </div>
          )}

          {/* Botão de criação de conta */}
          {selectedPlano && (
            <Button
              type="submit"
              className="w-full"
              disabled={isPending}
              size="lg"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? 'Registrando...' : 'Criar uma Conta'}
            </Button>
          )}

          <div className="mt-6 text-center text-base text-default-600">
            Já possui uma conta?{" "}
            <Link href="/auth/login" className="text-primary">
              {" "}
              Entrar{" "}
            </Link>
          </div>
        </div>
      </form>

      {/* Modal de Planos */}
      <PlanModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default RegForm;
