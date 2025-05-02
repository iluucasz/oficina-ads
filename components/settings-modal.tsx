"use client";

import { removeUserAvatar, updateUserAvatar } from "@/action/use-action";
import { ModeToggle } from "@/components/mode-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Bell,
  Building,
  Check,
  Download,
  Loader2,
  Lock,
  LogOut,
  MapPin,
  Palette,
  Shield,
  Trash,
  Upload,
  User
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { forceSessionUpdate, forceNewSession } from "@/lib/session-utils";

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
  const [isRemoving, setIsRemoving] = useState(false);
  const [newImageSelected, setNewImageSelected] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Função para verificar o hash da URL e abrir o modal
    const checkHash = () => {
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
  
  // Vamos garantir que os dados do usuário sejam carregados de forma completa
  // quando o modal for aberto ou quando a aba de perfil for selecionada
  useEffect(() => {
    // Só executar quando o modal estiver aberto
    if (!open) return;
    
    // Usamos uma flag para evitar chamadas repetidas
    const profileDataFetched = localStorage.getItem('profileDataFetched');
    const fetchTimestamp = parseInt(profileDataFetched || '0');
    const now = Date.now();
    
    // Só buscar se não buscou nos últimos 30 segundos
    if (now - fetchTimestamp > 30000) {
      // Função para buscar os dados completos do usuário
      const fetchCompleteUserData = async () => {
        try {
          const response = await fetch('/api/user/profile');
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.user && session) {
              // Criar uma cópia completa dos dados do usuário
              const updatedUser = {
                ...session.user,
                ...data.user
              };
              
              // Atualizar a sessão com todos os dados
              await update({
                ...session,
                user: updatedUser
              });
              
              // Definir a flag de busca com timestamp atual
              localStorage.setItem('profileDataFetched', now.toString());
            }
          }
        } catch (error) {
          // Silencioso
        }
      };
      
      // Buscar dados imediatamente quando o modal for aberto
      fetchCompleteUserData();
    }
  }, [open, session, update]);
  
  // Simplificamos o useEffect de verificação para não depender de open ou activeTab
  // Isso evita atualizações em cascata
  
  // Também vamos simplificar o efeito que monitora as mudanças do localStorage
  // para evitar loops de atualização - tornando-o completamente independente
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Função para atualizar o preview baseado nos dados do usuário
    const updateAvatarPreview = (avatarUrl: string | null) => {
      // Prevenir atualizações em cascata verificando o estado atual
      if ((avatarPreview && avatarUrl && avatarPreview.includes(avatarUrl)) || 
          (!avatarPreview && !avatarUrl)) {
        return; // Evitar atualizações desnecessárias
      }
      
      if (avatarUrl) {
        // Adicionar timestamp para evitar cache
        const timestamp = Date.now();
        const urlWithTimestamp = `${avatarUrl}?t=${timestamp}`;
        setAvatarPreview(urlWithTimestamp);
        setUploadComplete(true);
        setNewImageSelected(false);
      } else {
        setAvatarPreview(null);
        setUploadComplete(false);
      }
    };
    
    // Configurar o evento personalizado apenas
    const handleAvatarUpdated = (e: CustomEvent) => {
      const { avatarUrl } = e.detail;
      updateAvatarPreview(avatarUrl);
    };
    
    // Adicionar listener apenas para o evento personalizado
    document.addEventListener('avatar-updated', handleAvatarUpdated as EventListener);
    
    // Limpar listeners na desmontagem
    return () => {
      document.removeEventListener('avatar-updated', handleAvatarUpdated as EventListener);
    };
  }, [avatarPreview]);
  
  // Inicializar o preview do avatar apenas uma vez ao abrir o modal
  // Separando em um efeito específico que roda apenas quando o estado open muda
  // e não quando o avatar muda
  useEffect(() => {
    if (!open || !user) return;
    
    // Verificar se já temos o preview para evitar atualizações desnecessárias
    const hasExistingPreview = Boolean(avatarPreview);
    
    // Use um pequeno timeout para garantir que outros efeitos não interfiram
    const timer = setTimeout(() => {
      // Só atualizar se não houver preview ou se o avatarUrl for diferente do preview atual
      if (!hasExistingPreview || (user.avatarUrl && !avatarPreview?.includes(user.avatarUrl))) {
        if (user.avatarUrl) {
          const timestamp = Date.now();
          setAvatarPreview(`${user.avatarUrl}?t=${timestamp}`);
          setUploadComplete(true);
          setNewImageSelected(false);
        } else if (user.image && !avatarPreview?.includes(user.image)) {
          setAvatarPreview(user.image);
          setUploadComplete(true);
          setNewImageSelected(false);
        }
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [open, user, avatarPreview]);
  
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
      // Remover console.error
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
    setNewImageSelected(true);
    setUploadComplete(false);
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
      // Preparar os dados para enviar
      const formData = new FormData();
      formData.append('userId', user.id);
      formData.append('avatar', fileInputRef.current.files[0]);
      
      const localPreviewUrl = avatarPreview;
      const result = await updateUserAvatar(formData);
      
      if (result.success) {
        // Atualizar UI e estado local
        const avatarUrl = result.avatarUrl || localPreviewUrl;
        if (avatarUrl) {
          const timestamp = Date.now();
          const avatarUrlWithTimestamp = `${avatarUrl}?t=${timestamp}`;
          
          setAvatarPreview(avatarUrlWithTimestamp);
          setUploadComplete(true);
          setNewImageSelected(false);
          
          // Cache local com timestamp para controle
          localStorage.setItem('lastUploadedAvatar', avatarUrlWithTimestamp);
          localStorage.setItem('lastUploadTimestamp', timestamp.toString());
          
          // Definir flag para evitar busca duplicada de dados
          localStorage.setItem('profileDataFetched', timestamp.toString());
          
          // Atualizar sessão sem perder outros dados do usuário
          // Usamos uma abordagem simplificada para evitar loops
          if (session) {
            await update({
              ...session,
              user: {
                ...session.user,
                avatarUrl: result.avatarUrl
              }
            });
            
            // Disparar o evento CustomEvent apenas uma vez
            const avatarEvent = new CustomEvent('avatar-updated', {
              detail: { avatarUrl: result.avatarUrl, timestamp }
            });
            document.dispatchEvent(avatarEvent);
          }
        }
        
        toast({
          title: "Sucesso",
          description: result.message || "Avatar atualizado com sucesso!",
        });
      } else {
        throw new Error(result.message || "Erro desconhecido");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao atualizar o avatar.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Lidar com a remoção do avatar
  const handleRemoveAvatar = async () => {
    if (!user?.id || isRemoving || (!user?.avatarUrl && !avatarPreview)) {
      if (!user?.id) {
        toast({
          title: "Erro",
          description: "ID de usuário não encontrado.",
          variant: "destructive"
        });
      } else if (!user?.avatarUrl && !avatarPreview) {
        toast({
          title: "Erro",
          description: "Não há imagem de perfil para remover.",
          variant: "destructive"
        });
      }
      return;
    }
    
    setIsRemoving(true);
    
    try {
      const result = await removeUserAvatar(user.id);
      
      if (result.success) {
        // Primeiro limpar o localStorage para evitar loops
        localStorage.removeItem('lastUploadedAvatar');
        localStorage.removeItem('lastUploadTimestamp');
        localStorage.removeItem('avatarUpdated');
        localStorage.removeItem('sessionRecreated');
        
        // Definir timestamp para controle de chamadas repetidas
        const timestamp = Date.now();
        localStorage.setItem('profileDataFetched', timestamp.toString());
        
        // Limpar o estado local primeiro
        setAvatarPreview(null);
        setUploadComplete(false);
        setNewImageSelected(false);
        
        // Atualização simplificada para evitar loops
        if (session) {
          await update({
            ...session,
            user: {
              ...session.user,
              avatarUrl: null
            }
          });
          
          // Disparar apenas um evento para notificar outros componentes
          const avatarEvent = new CustomEvent('avatar-updated', {
            detail: { avatarUrl: null, timestamp }
          });
          document.dispatchEvent(avatarEvent);
        }
        
        toast({
          title: "Sucesso",
          description: "Avatar removido com sucesso!",
        });
      } else {
        throw new Error(result.message || "Erro desconhecido");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao remover o avatar.",
        variant: "destructive"
      });
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose();
      }}
    >
      <DialogContent className="max-w-4xl h-[90vh] p-0">
        <div className="flex h-full overflow-hidden">
          {/* Barra lateral com as abas */}
          <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="flex h-full w-full">
            <TabsList className="w-64 h-full flex flex-col items-start justify-start p-2 space-y-1 border-r bg-muted/50 overflow-y-auto">
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

            {/* Conteúdo das abas - Contenedor principal com scroll */}
            <div className="flex-1 overflow-y-auto">
              {/* Conteúdo interno com padding */}
              <div className="p-6">
                {/* Aba Geral */}
                <TabsContent value="general" className="mt-0 data-[state=active]:block">
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
                <TabsContent value="notifications" className="h-full mt-0">
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
                <TabsContent value="personalization" className="h-full mt-0">
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

                {/* Aba Perfil - Garantindo que o conteúdo seja visível e com scroll */}
                <TabsContent value="profile" className="mt-0 data-[state=active]:block">
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold">Perfil</h2>
                    
                    {/* Upload de Avatar */}
                    <div className="bg-card rounded-lg p-4 border">
                      <h3 className="text-lg font-medium mb-4">Imagem de Perfil</h3>
                      <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="h-32 w-32 rounded-full overflow-hidden border bg-muted flex-shrink-0">
                          {avatarPreview ? (
                            <img 
                              src={avatarPreview} 
                              alt="Avatar" 
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-primary/10">
                              <User className="h-16 w-16 text-primary/40" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-3 w-full">
                          <div className="flex flex-wrap gap-2">
                            <input 
                              type="file" 
                              ref={fileInputRef} 
                              className="hidden" 
                              accept="image/*"
                              onChange={handleFileChange}
                            />
                            <Button 
                              onClick={handleUploadClick} 
                              variant="outline" 
                              size="sm"
                              className="min-w-[140px]"
                              disabled={isUploading || isRemoving}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Selecionar imagem
                            </Button>
                            
                            {(user?.avatarUrl || avatarPreview) && (
                              <Button 
                                onClick={handleRemoveAvatar} 
                                variant="outline" 
                                size="sm" 
                                className="text-destructive hover:bg-destructive/10 min-w-[120px]"
                                disabled={isRemoving || isUploading}
                              >
                                {isRemoving ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Trash className="h-4 w-4 mr-2" />
                                )}
                                Remover
                              </Button>
                            )}
                            
                            <Button 
                              onClick={handleConfirmUpload} 
                              variant={newImageSelected ? "default" : "outline"}
                              size="sm" 
                              className={`min-w-[140px] ${newImageSelected ? 'bg-primary' : ''}`}
                              disabled={(!newImageSelected && uploadComplete) || isUploading || isRemoving}
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
                          </div>
                          
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground">
                              Arquivos JPG ou PNG, máximo 2MB
                            </p>
                            {uploadComplete && !newImageSelected && avatarPreview && (
                              <p className="text-xs text-green-500 font-medium mt-1">
                                Avatar atualizado com sucesso!
                              </p>
                            )}
                            {newImageSelected && (
                              <p className="text-xs text-amber-500 font-medium mt-1">
                                Clique em "Confirmar imagem" para salvar a alteração.
                              </p>
                            )}
                          </div>
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

                    {/* Elemento extra para garantir espaço no final */}
                    <div className="h-4"></div>
                  </div>
                </TabsContent>

                {/* Aba Segurança */}
                <TabsContent value="security" className="h-full mt-0">
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
                <TabsContent value="privacy" className="h-full mt-0">
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
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
} 