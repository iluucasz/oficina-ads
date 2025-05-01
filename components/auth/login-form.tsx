"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/components/ui/use-toast";

const schema = z.object({
  email: z.string().email({ message: "Email inválido." }),
  password: z.string().min(4, { message: "A senha deve ter pelo menos 4 caracteres." }),
});

type FormData = z.infer<typeof schema>;

const LogInForm = () => {
  const [isPending, startTransition] = React.useTransition();
  const [passwordType, setPasswordType] = React.useState("password");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/app/dashboard";

  const togglePasswordType = () => {
    setPasswordType(passwordType === "password" ? "text" : "password");
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "all",
  });

  const onSubmit = (data: FormData) => {
    setErrorMessage(null);
    startTransition(async () => {
      try {
        const response = await signIn("credentials", {
          email: data.email,
          password: data.password,
          redirect: false,
        });

        if (response?.ok) {
          // Login bem-sucedido
          toast({
            title: "Login realizado com sucesso!",
            description: "Você será redirecionado para o dashboard.",
          });
          
          // Redirecionar para o callback URL ou dashboard
          setTimeout(() => {
            router.push(callbackUrl);
          }, 500);
          
          reset();
        } else {
          // Tratar diferentes erros de autenticação
          const errorMsg = response?.error || "Falha na autenticação";
          setErrorMessage(errorMsg);
          
          toast({
            title: "Erro de login",
            description: errorMsg,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Erro durante o login:", error);
        setErrorMessage("Ocorreu um erro durante o login. Tente novamente.");
        
        toast({
          title: "Erro inesperado",
          description: "Ocorreu um erro durante o login. Tente novamente.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="w-full">
      <Link href="/" className="inline-block">
        <Image src="@/public/logo.png" alt="Logo" width={56} height={56} className="text-primary" />
      </Link>
      <div className="2xl:mt-8 mt-6 2xl:text-3xl text-2xl font-bold text-default-900">
        Bem-vindo de volta 👋
      </div>
      <div className="2xl:text-lg text-base text-default-600 mt-2 leading-6">
        Faça o login para acessar a sua plataforma
      </div>

      {errorMessage && (
        <div className="mt-4 p-3 bg-destructive/10 border border-destructive rounded-md text-destructive text-sm">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 2xl:mt-7">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-default-600">
              Email
            </Label>
            <Input
              type="email"
              id="email"
              placeholder="seu@email.com"
              disabled={isPending}
              {...register("email")}
              className={cn("", {
                "border-destructive": errors.email,
              })}
            />
            {errors.email && (
              <div className="text-destructive text-sm mt-1">{errors.email.message}</div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-default-600">
              Senha
            </Label>
            <div className="relative">
              <Input
                type={passwordType}
                id="password"
                placeholder="Sua senha"
                disabled={isPending}
                autoComplete="new-password"
                {...register("password")}
                className={cn("", {
                  "border-destructive": errors.password,
                })}
              />
              <button
                type="button"
                onClick={togglePasswordType}
                className="absolute top-1/2 -translate-y-1/2 right-4 text-sm text-default-600"
              >
                {passwordType === "password" ? "Mostrar" : "Ocultar"}
              </button>
            </div>
            {errors.password && (
              <div className="text-destructive text-sm mt-1">{errors.password.message}</div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Checkbox
                id="remember"
                className="border-default-300"
              />
              <Label
                htmlFor="remember"
                className="text-sm text-default-600 cursor-pointer"
              >
                Lembrar-me
              </Label>
            </div>
            <Link href="/auth/forgot" className="text-sm text-primary">
              Esqueceu a senha?
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isPending}
            size="lg"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? "Carregando..." : "Entrar"}
          </Button>
        </div>
      </form>

      <div className="mt-8 text-center text-sm text-default-600">
        Não possui uma conta?{" "}
        <Link href="/auth/register" className="text-primary font-medium">
          Criar conta
        </Link>
      </div>
    </div>
  );
};

export default LogInForm;
