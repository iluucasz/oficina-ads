"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const schema = z.object({
  email: z.string().email("Seu e-mail é inválido"),
});

type ForgotFormData = z.infer<typeof schema>;

const ForgotForm: React.FC = () => {
  const [isPending, startTransition] = React.useTransition();
  const router = useRouter();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ForgotFormData>({
    resolver: zodResolver(schema),
    mode: "all",
  });

  const onSubmit = (data: ForgotFormData) => {
    startTransition(() => {
      console.log("Enviando email de recuperação para", data.email);
      reset();
      router.push("/auth/create-password");
    });
  };

  return (
    <div className="w-full">
      <div className="2xl:mt-8 mt-6 2xl:text-3xl text-2xl font-bold text-default-900">
        Esqueceu sua senha?
      </div>
      <div className="2xl:text-lg text-base text-default-600 mt-2 leading-6">
        Informe seu e-mail e as instruções serão enviadas.
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 xl:mt-7">
        <div>
          <Label htmlFor="email" className="mb-2 font-medium text-default-600">
            Email
          </Label>
          <Input
            disabled={isPending}
            {...register("email")}
            type="email"
            id="email"
            placeholder="seu@exemplo.com"
          />
          {errors.email && (
            <div className="text-destructive mt-2">
              {errors.email.message}
            </div>
          )}
        </div>
        <Button className="w-full mt-6">
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? "Enviando..." : "Enviar Email de Recuperação"}
        </Button>
      </form>
      <div className="mt-5 2xl:mt-8 text-center text-base text-default-600">
        Esqueceu o e-mail? Retorne para {" "}
        <Link href="/auth/login" className="text-primary">
          Entrar
        </Link>
      </div>
    </div>
  );
};

export default ForgotForm;
