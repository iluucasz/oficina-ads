"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "@/components/mode-toggle";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { updateUserAvatar } from "@/action/use-action";
import { 
  User, 
  Bell, 
  Palette, 
  Shield, 
  Lock, 
  Download, 
  LogOut,
  Upload,
  Building,
  MapPin,
  Phone,
  Check,
  Loader2
} from "lucide-react";

// Define o tipo extendido para o usuário da sessão
interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  avatarUrl?: string | null;
  role?: string;
  subscriptionPlan?: string;
  subscription?: {
    status: string;
    endDate: string;
    plan: {
      durationDays: number;
      priceCents: number;
    };
  };
  lastLogin?: string;
  userActivityLogs?: Array<{
    action: string;
    timestamp: string;
  }>;
  // Campos adicionais do schema
  companyName?: string | null;
  cnpj?: string | null;
  street?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  cep?: string | null;
  phone?: string | null;
}

export function SettingsModal() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const { data: session, update } = useSession();
  const user = session?.user as ExtendedUser;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Função para verificar o hash da URL e abrir o modal
    const checkHash = () => {
      console.log("Hash changed:", window.location.hash); // Log para depuração
      
      const hash = window.location.hash;
      
      if (hash.startsWith("#settings")) {
        // Extrair a aba específica se houver
        const parts = hash.split("/");
        if (parts.length > 1 && ["general", "notifications", "personalization", "profile", "security", "privacy"].includes(parts[1])) {
          setActiveTab(parts[1]);
        } else {
          setActiveTab("general");
        }
        
        // Abrir o modal
        setOpen(true);
      }
    };
    
    // Verificar o hash inicial
    checkHash();
    
    // Adicionar listener para mudanças de hash
    window.addEventListener("hashchange", checkHash);
    
    // Limpar o listener
    return () => window.removeEventListener("hashchange", checkHash);
  }, []);
  
  // Inicializar o preview do avatar quando o componente montar
  useEffect(() => {
    if (user?.avatarUrl) {
      setAvatarPreview(user.avatarUrl);
    } else if (user?.image) {
      setAvatarPreview(user.image);
    }
  }, [user?.avatarUrl, user?.image]);
  
  // Função para fechar o modal e limpar o hash
  const handleClose = () => {
    setOpen(false);
    // Remover o hash da URL de forma compatível com Next.js
    if (typeof window !== 'undefined') {
      // Usar replace ao invés de pushState para evitar conflitos
      window.location.href = window.location.pathname + window.location.search;
    }
  };
  
  // Traduz o plano de assinatura
  const getTranslatedPlan = (plan?: string) => {
    if (!plan) return "";
    
    switch (plan) {
      case "basic":
        return "Gratuito";
      case "premium":
        return "Premium";
      case "enterprise":
        return "Empresarial";
      default:
        return plan;
    }
  };
  
  // Traduz a função do usuário
  const getTranslatedRole = (role?: string) => {
    if (!role) return "";
    
    switch (role) {
      case "admin":
        return "Admin";
      case "regular":
        return "Comum";
      case "marketing":
        return "Marketing";
      case "master":
        return "Master";
      default:
        return role;
    }
  };
  
  // Traduz o status da assinatura
  const getTranslatedStatus = (status?: string) => {
    if (!status) return "";
    
    switch (status) {
      case "ACTIVE":
        return "Ativo";
      case "GRACE":
        return "Expirando";
      case "EXPIRED":
        return "Expirado";
      default:
        return status;
    }
  };
  
  // Formata a data de término da assinatura
  const formatEndDate = (dateString?: string) => {
    if (!dateString) return "Não disponível";
    
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(date);
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return "Data inválida";
    }
  };
  
  // Lidar com o clique no botão de upload
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  // Lidar com a seleção de arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Criar uma URL para o arquivo selecionado para preview
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  };
  
  // Lidar com a confirmação de upload
  const handleConfirmUpload = async () => {
    if (!fileInputRef.current?.files?.[0] || !user?.id) {
      toast({
        title: "Erro",
        description: "Selecione uma imagem antes de confirmar.",
        variant: "destructive"
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Preparar os dados para enviar para a Server Action
      const formData = new FormData();
      formData.append('userId', user.id);
      formData.append('avatar', fileInputRef.current.files[0]);
      
      // Chamar a Server Action importada
      const result = await updateUserAvatar(formData);
      
      if (result.success) {
        // Atualizar a sessão com a nova URL do avatar
        if (session && session.user) {
          await update({
            ...session,
            user: {
              ...session.user,
              avatarUrl: result.avatarUrl || avatarPreview
            }
          });
        }
        
        toast({
          title: "Sucesso",
          description: result.message || "Avatar atualizado com sucesso!",
        });
      } else {
        throw new Error(result.message || "Erro desconhecido");
      }
    } catch (error) {
      console.error("Erro ao atualizar avatar:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao atualizar o avatar.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose();
      }}
    >
      <DialogContent className="max-w-4xl h-[80vh] p-0 overflow-hidden">
        <div className="flex h-full">
          {/* Barra lateral com as abas */}
          <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="flex h-full w-full">
            <TabsList className="w-64 h-full flex flex-col items-start justify-start p-2 space-y-1 border-r bg-muted/50">
              <DialogTitle className="px-4 py-2 w-full text-left">Configurações</DialogTitle>
              <Separator className="my-2" />
              <TabsTrigger value="general" className="w-full justify-start">
                <User className="h-4 w-4 mr-2" />
                Geral
              </TabsTrigger>
              <TabsTrigger value="notifications" className="w-full justify-start">
                <Bell className="h-4 w-4 mr-2" />
                Notificações
              </TabsTrigger>
              <TabsTrigger value="personalization" className="w-full justify-start">
                <Palette className="h-4 w-4 mr-2" />
                Personalização
              </TabsTrigger>
              <TabsTrigger value="profile" className="w-full justify-start">
                <User className="h-4 w-4 mr-2" />
                Perfil
              </TabsTrigger>
              <TabsTrigger value="security" className="w-full justify-start">
                <Shield className="h-4 w-4 mr-2" />
                Segurança
              </TabsTrigger>
              <TabsTrigger value="privacy" className="w-full justify-start">
                <Lock className="h-4 w-4 mr-2" />
                Privacidade
              </TabsTrigger>
            </TabsList>

            {/* Conteúdo das abas */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Aba Geral */}
              <TabsContent value="general" className="h-full">
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold">Informações Gerais</h2>
                  
                  <div className="bg-card rounded-lg p-4 border">
                    <h3 className="text-lg font-medium mb-2">Informações do Usuário</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Nome</p>
                        <p className="font-medium">{user?.name || "Não definido"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{user?.email || "Não definido"}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-card rounded-lg p-4 border">
                    <h3 className="text-lg font-medium mb-2">Tipo de conta</h3>
                    <Badge variant="outline" className="text-sm">
                      {getTranslatedRole(user?.role)}
                    </Badge>
                  </div>
                  
                  <div className="bg-card rounded-lg p-4 border">
                    <h3 className="text-lg font-medium mb-2">Plano de Assinatura</h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <p className="text-sm text-muted-foreground mr-2">Plano:</p>
                        <Badge>
                          {getTranslatedPlan(user?.subscriptionPlan)}
                        </Badge>
                      </div>
                      
                      {user?.subscription && (
                        <>
                          <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            <p className="font-medium">{getTranslatedStatus(user.subscription.status) || "Não disponível"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Data de Expiração</p>
                            <p className="font-medium">{formatEndDate(user.subscription.endDate)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Preço (centavos)</p>
                            <p className="font-medium">{user.subscription.plan?.priceCents ? `R$ ${(user.subscription.plan.priceCents / 100).toFixed(2)}` : "Não disponível"}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Aba Notificações */}
              <TabsContent value="notifications" className="h-full">
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold">Notificações</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="email-notifications">Notificações por email</Label>
                        <p className="text-sm text-muted-foreground">
                          Receba notificações por email sobre sua conta.
                        </p>
                      </div>
                      <Switch id="email-notifications" />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="marketing-notifications">Emails de marketing</Label>
                        <p className="text-sm text-muted-foreground">
                          Receba emails sobre novos recursos e ofertas.
                        </p>
                      </div>
                      <Switch id="marketing-notifications" />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="update-notifications">Atualizações do sistema</Label>
                        <p className="text-sm text-muted-foreground">
                          Receba notificações sobre atualizações na plataforma.
                        </p>
                      </div>
                      <Switch id="update-notifications" />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Aba Personalização */}
              <TabsContent value="personalization" className="h-full">
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold">Personalização</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Tema</Label>
                        <p className="text-sm text-muted-foreground">
                          Selecione o tema de sua preferência.
                        </p>
                      </div>
                      <ModeToggle />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="dense-mode">Modo compacto</Label>
                        <p className="text-sm text-muted-foreground">
                          Reduz o espaçamento na interface para exibir mais conteúdo.
                        </p>
                      </div>
                      <Switch id="dense-mode" />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="animations">Animações</Label>
                        <p className="text-sm text-muted-foreground">
                          Ativa ou desativa animações na interface.
                        </p>
                      </div>
                      <Switch id="animations" defaultChecked />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Aba Perfil */}
              <TabsContent value="profile" className="h-full">
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold">Perfil</h2>
                  
                  {/* Upload de Avatar */}
                  <div className="bg-card rounded-lg p-4 border">
                    <h3 className="text-lg font-medium mb-4">Imagem de Perfil</h3>
                    <div className="flex items-center gap-4">
                      <div className="h-24 w-24 rounded-full overflow-hidden border bg-muted">
                        {avatarPreview ? (
                          <img 
                            src={avatarPreview} 
                            alt="Avatar" 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-primary/10">
                            <User className="h-12 w-12 text-primary/40" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleFileChange}
                        />
                        <Button onClick={handleUploadClick} variant="outline" size="sm">
                          <Upload className="h-4 w-4 mr-2" />
                          Selecionar imagem
                        </Button>
                        <Button 
                          onClick={handleConfirmUpload} 
                          variant="default" 
                          size="sm" 
                          disabled={!avatarPreview || isUploading}
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Confirmar imagem
                            </>
                          )}
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          Arquivos JPG ou PNG, máximo 2MB
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Informações Pessoais */}
                  <div className="bg-card rounded-lg p-4 border">
                    <h3 className="text-lg font-medium mb-4">Dados Pessoais</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Nome</p>
                        <p className="font-medium">{user?.name || "Não definido"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{user?.email || "Não definido"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">ID do usuário</p>
                        <p className="font-medium">{user?.id || "Não disponível"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tipo de conta</p>
                        <p className="font-medium">{getTranslatedRole(user?.role) || "Não disponível"}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Informações da Empresa */}
                  <div className="bg-card rounded-lg p-4 border">
                    <h3 className="text-lg font-medium mb-4">
                      <Building className="h-5 w-5 inline-block mr-2" />
                      Dados da Empresa
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Nome da Empresa</p>
                        <p className="font-medium">{user?.companyName || "Não definido"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">CNPJ / CPF</p>
                        <p className="font-medium">{user?.cnpj || "Não definido"}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Endereço */}
                  <div className="bg-card rounded-lg p-4 border">
                    <h3 className="text-lg font-medium mb-4">
                      <MapPin className="h-5 w-5 inline-block mr-2" />
                      Endereço
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Rua / Logradouro</p>
                        <p className="font-medium">{user?.street || "Não definido"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Bairro</p>
                        <p className="font-medium">{user?.neighborhood || "Não definido"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Cidade</p>
                        <p className="font-medium">{user?.city || "Não definido"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Estado</p>
                        <p className="font-medium">{user?.state || "Não definido"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">CEP</p>
                        <p className="font-medium">{user?.cep || "Não definido"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Telefone</p>
                        <p className="font-medium">{user?.phone || "Não definido"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Aba Segurança */}
              <TabsContent value="security" className="h-full">
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold">Segurança</h2>
                  
                  <div className="bg-card rounded-lg p-4 border">
                    <h3 className="text-lg font-medium mb-2">Último acesso</h3>
                    <p>{user?.lastLogin || "Informação não disponível"}</p>
                  </div>
                  
                  <div className="bg-card rounded-lg p-4 border">
                    <h3 className="text-lg font-medium mb-2">Logs de atividade</h3>
                    {user?.userActivityLogs && user.userActivityLogs.length > 0 ? (
                      <div className="space-y-2">
                        {user.userActivityLogs.map((log, index) => (
                          <div key={index} className="flex justify-between py-1 border-b last:border-0">
                            <span>{log.action}</span>
                            <span className="text-muted-foreground">{log.timestamp}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Nenhum log disponível</p>
                    )}
                  </div>
                  
                  <div className="flex justify-end">
                    <Button variant="outline" className="text-destructive">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sair de todos os dispositivos
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Aba Privacidade */}
              <TabsContent value="privacy" className="h-full">
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold">Privacidade</h2>
                  
                  <div className="bg-card rounded-lg p-4 border">
                    <h3 className="text-lg font-medium mb-2">Download de dados</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Você pode baixar todos os seus dados pessoais armazenados em nossa plataforma. 
                      O arquivo será gerado em formato JSON.
                    </p>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Baixar dados
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
} 