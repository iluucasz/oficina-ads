"use client";

import { ModeToggle } from "@/components/mode-toggle";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
import {
  Bell,
  Building,
  Download,
  Lock,
  LogOut,
  MapPin,
  Palette,
  Shield,
  User,
  Upload,
  X
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { updateUserAvatar, removeUserAvatar } from "@/action/use-action";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import { toast } from "sonner";
import { useAvatar } from "@/lib/hooks/use-avatar";

// Define o tipo extendido para o usuário da sessão
interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
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
  streetNumber?: string | null;
  city?: string | null;
  state?: string | null;
  cep?: string | null;
  phone?: string | null;
}

export function SettingsModal() {
  // Estado e hooks básicos
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const { data: session } = useSession();
  const user = session?.user as ExtendedUser;
  const router = useRouter();
  
  // Estados para gerenciar o upload e exibição da imagem
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Usar o hook useAvatar para gerenciar o avatar globalmente
  const { avatarUrl, updateLocalAvatar } = useAvatar();
  
  // Manipulação de hash na URL para abrir o modal diretamente
  useEffect(() => {
    if (typeof window === "undefined") return;
    
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
    
    // Verificar o hash inicial e adicionar listener
    checkHash();
    window.addEventListener("hashchange", checkHash);
    
    // Limpar o listener
    return () => window.removeEventListener("hashchange", checkHash);
  }, []);
  
  // Função para fechar o modal e limpar o hash
  const handleClose = () => {
    setOpen(false);
    if (typeof window !== 'undefined') {
      window.location.href = window.location.pathname + window.location.search;
    }
  };
  
  // Função para lidar com a seleção de arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      // Validar tipo de arquivo (apenas imagens)
      if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
        toast.error("Por favor, selecione apenas arquivos de imagem válidos.");
        return;
      }
      
      // Validar tamanho (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("O tamanho máximo da imagem é 5MB.");
        return;
      }
      
      setSelectedFile(file);
      
      // Criar URL temporária para preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      
      // Limpar URL temporária quando o componente for desmontado
      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    }
  };
  
  // Função para confirmar o upload da imagem
  const handleUploadConfirm = async () => {
    if (!selectedFile || !user?.id) return;
    
    try {
      setIsUploading(true);
      
      const formData = new FormData();
      formData.append('userId', user.id);
      formData.append('avatar', selectedFile);
      
      const result = await updateUserAvatar(formData);
      
      if (result.success) {
        toast.success("Imagem de perfil atualizada com sucesso!");
        
        await mutate('/api/auth/session');
        
        if (result.avatarUrl) {
          updateLocalAvatar(result.avatarUrl);
        }
        
        router.refresh();
        
        setSelectedFile(null);
        setPreviewUrl(null);
      } else {
        toast.error(result.message || "Erro ao atualizar imagem de perfil.");
      }
    } catch (error) {
      console.error("Erro crítico ao fazer upload de avatar:", error);
      toast.error("Ocorreu um erro ao processar sua imagem.");
    } finally {
      setIsUploading(false);
    }
  };
  
  // Função para remover o avatar
  const handleRemoveAvatar = async () => {
    if (!user?.id) return;
    
    try {
      setIsUploading(true);
      
      const result = await removeUserAvatar(user.id);
      
      if (result.success) {
        toast.success("Imagem de perfil removida com sucesso!");
        
        await mutate('/api/auth/session');
        updateLocalAvatar(null);
        router.refresh();
        
        setSelectedFile(null);
        setPreviewUrl(null);
      } else {
        toast.error(result.message || "Erro ao remover imagem de perfil.");
      }
    } catch (error) {
      console.error("Erro crítico ao remover avatar:", error);
      toast.error("Ocorreu um erro ao remover sua imagem de perfil.");
    } finally {
      setIsUploading(false);
    }
  };
  
  // Função para cancelar a seleção de imagem
  const handleCancelSelection = () => {
    // Limpar preview e arquivo selecionado
    setSelectedFile(null);
    setPreviewUrl(null);
    
    // Resetar o input de arquivo
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Helpers para tradução e formatação
  const helpers = {
    // Traduz o plano de assinatura
    getTranslatedPlan: (plan?: string) => {
      if (!plan) return "";
      
      switch (plan) {
        case "basic": return "Gratuito";
        case "premium": return "Premium";
        case "enterprise": return "Empresarial";
        default: return plan;
      }
    },
    
    // Traduz a função do usuário
    getTranslatedRole: (role?: string) => {
      if (!role) return "";
      
      switch (role) {
        case "admin": return "Admin";
        case "regular": return "Comum";
        case "marketing": return "Marketing";
        case "master": return "Master";
        default: return role;
      }
    },
    
    // Traduz o status da assinatura
    getTranslatedStatus: (status?: string) => {
      if (!status) return "";
      
      switch (status) {
        case "ACTIVE": return "Ativo";
        case "GRACE": return "Expirando";
        case "EXPIRED": return "Expirado";
        default: return status;
      }
    },
    
    // Formata a data de término da assinatura
    formatEndDate: (dateString?: string) => {
      if (!dateString) return "Não disponível";
      
      try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }).format(date);
      } catch (error) {
        return "Data inválida";
      }
    }
  };

  // Componente para o conteúdo de cada aba
  const TabContents = {
    // Aba Geral - Informações básicas do usuário e assinatura
    General: () => (
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
            {helpers.getTranslatedRole(user?.role)}
          </Badge>
        </div>
        
        <div className="bg-card rounded-lg p-4 border">
          <h3 className="text-lg font-medium mb-2">Plano de Assinatura</h3>
          <div className="space-y-2">
            <div className="flex items-center">
              <p className="text-sm text-muted-foreground mr-2">Plano:</p>
              <Badge>
                {helpers.getTranslatedPlan(user?.subscriptionPlan)}
              </Badge>
            </div>
            
            {user?.subscription && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">{helpers.getTranslatedStatus(user.subscription.status) || "Não disponível"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data de Expiração</p>
                  <p className="font-medium">{helpers.formatEndDate(user.subscription.endDate)}</p>
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
    ),
    
    // Aba Notificações
    Notifications: () => (
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
    ),
    
    // Aba Personalização
    Personalization: () => (
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
    ),
    
    // Aba Perfil - Informações detalhadas do usuário
    Profile: () => (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Perfil</h2>
        
        {/* Avatar do Usuário */}
        <div className="bg-card rounded-lg p-4 border">
          <h3 className="text-lg font-medium mb-4">Imagem de Perfil</h3>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-24 w-24">
                {previewUrl ? (
                  <AvatarImage src={previewUrl} alt="Preview" />
                ) : avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={user.name || "Usuário"} />
                ) : (
                  <AvatarFallback className="text-lg">
                    {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground mb-2">
                  {previewUrl 
                    ? "Visualização da nova imagem" 
                    : avatarUrl 
                      ? "Esta é sua imagem de perfil atual" 
                      : "Você ainda não tem uma imagem de perfil"}
                </p>
                
                <input
                  type="file"
                  accept="image/jpeg, image/png, image/gif, image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  disabled={isUploading}
                />
                
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Selecionar imagem
                  </Button>
                  
                  {selectedFile && (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleUploadConfirm}
                        disabled={isUploading}
                      >
                        {isUploading ? "Processando..." : "Confirmar imagem"}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelSelection}
                        disabled={isUploading}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                    </>
                  )}
                  
                  {avatarUrl && !selectedFile && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveAvatar}
                      disabled={isUploading}
                      className="text-destructive border-destructive hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remover imagem
                    </Button>
                  )}
                </div>
              </div>
            </div>
            {selectedFile && (
              <p className="text-xs text-muted-foreground">
                Nome do arquivo: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
              </p>
            )}
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
              <p className="font-medium">{helpers.getTranslatedRole(user?.role) || "Não disponível"}</p>
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
              <p className="text-sm text-muted-foreground">Número</p>
              <p className="font-medium">{user?.streetNumber || "Não definido"}</p>
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
    ),
    
    // Aba Segurança
    Security: () => (
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
    ),
    
    // Aba Privacidade
    Privacy: () => (
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
    )
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
                <TabsContent value="general" className="mt-0 data-[state=active]:block">
                  <TabContents.General />
                </TabsContent>

                <TabsContent value="notifications" className="h-full mt-0">
                  <TabContents.Notifications />
                </TabsContent>

                <TabsContent value="personalization" className="h-full mt-0">
                  <TabContents.Personalization />
                </TabsContent>

                <TabsContent value="profile" className="mt-0 data-[state=active]:block">
                  <TabContents.Profile />
                </TabsContent>

                <TabsContent value="security" className="h-full mt-0">
                  <TabContents.Security />
                </TabsContent>

                <TabsContent value="privacy" className="h-full mt-0">
                  <TabContents.Privacy />
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
} 