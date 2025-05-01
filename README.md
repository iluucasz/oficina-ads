# Oficina Ads

![Oficina Ads Logo](public/logo.png)

Plataforma completa de precificação e marketing para WooCommerce que automatiza cálculos, otimiza lucros e integra suas campanhas de marketing em um único local.

[![Desenvolvido por Lucas Santos](https://img.shields.io/badge/Dev-Lucas%20Santos-blue)](https://www.dev-lss.site/)

## 🚀 Funcionalidades Principais

### Módulo de Precificação
- **Calculadora de Preços**: Determine o preço ideal com base no custo, margem de lucro e competitividade
- **Análise de Viabilidade**: Receba feedback visual sobre a competitividade do preço sugerido
- **Projeção de Lucros**: Visualize os lucros esperados em diferentes volumes de venda
- **Simulador de Cenários**: Compare diferentes estratégias de precificação e seu impacto nos resultados

### Módulo de Marketing
- **Facebook Ads**: Gerencie campanhas, públicos e acompanhe o desempenho dos anúncios
- **Google Ads**: Otimize campanhas de pesquisa, display e vídeo
- **Google Analytics**: Monitore tráfego, comportamento dos usuários e conversões
- **Relatórios Integrados**: Visualize todos os dados de marketing em um único dashboard

### Gestão de Produtos
- **Catálogo Centralizado**: Gerencie todos os seus produtos em um só lugar
- **Sincronização com WooCommerce**: Atualize preços automaticamente na sua loja
- **Importação em Massa**: Adicione produtos e preços com facilidade
- **Histórico de Preços**: Acompanhe as alterações de preço ao longo do tempo

### Sistema Completo
- **Autenticação Segura**: Login e registro de usuários com NextAuth
- **Níveis de Assinatura**: Suporte a múltiplos planos (Básico, Premium, Empresarial)
- **Perfil Personalizável**: Gerencie suas informações pessoais e empresariais
- **Interface Responsiva**: Experiência perfeita em desktop e dispositivos móveis

## 🛠️ Tecnologias Utilizadas

- **Frontend**:
  - Next.js 15 (App Router)
  - React com TypeScript
  - Tailwind CSS para estilização
  - Shadcn UI para componentes
  - React Hook Form para formulários

- **Backend**:
  - API Routes do Next.js
  - Prisma ORM para acesso ao banco de dados
  - NextAuth.js para autenticação
  - Zod para validação de dados

- **Banco de Dados**:
  - MongoDB

- **Infraestrutura**:
  - Vercel (Deploy e Hospedagem)

## 📦 Instalação e Uso

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/oficina-ads.git
cd oficina-ads

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite o arquivo .env.local com suas credenciais

# Execute as migrações do Prisma
npx prisma generate

# Inicie o servidor de desenvolvimento
npm run dev
```

## 📚 Estrutura do Projeto

```
oficina-ads/
├── app/                    # Rotas e páginas da aplicação (App Router)
│   ├── api/                # Rotas de API
│   ├── app/                # Área autenticada da aplicação
│   │   ├── (dashboard)/    # Layout do dashboard com sidebar
│   │   ├── dashboard/      # Página principal do dashboard
│   │   ├── calculator/     # Calculadora de preços
│   │   ├── simulator/      # Simulador de cenários
│   │   ├── marketing/      # Integração com plataformas de marketing
│   │   ├── products/       # Gestão de produtos
│   │   └── help/           # Central de ajuda
│   └── auth/               # Páginas de autenticação
├── components/             # Componentes reutilizáveis
├── lib/                    # Utilitários e configurações
├── prisma/                 # Configuração do banco de dados e modelos
├── providers/              # Provedores de contexto
└── types/                  # Definições de tipos TypeScript
```

## 📋 Funcionalidades Detalhadas

### Calculadora de Preços
- Insira o custo do produto (faixa ideal entre R$30 e R$50)
- Defina a quantidade de produtos no mesmo lote
- Ajuste a margem de lucro desejada (25-40%)
- Receba recomendação de preço de venda com análise de viabilidade
- Visualize projeção de lucro para diferentes volumes de venda

### Marketing Integrado
- Conecte suas contas de Facebook Ads, Google Ads e Google Analytics
- Visualize métricas importantes como CTR, CPC, conversões e ROAS
- Compare performance de campanhas em um único painel
- Exporte relatórios em formatos como PDF, CSV ou Excel
- Planeje orçamentos e analise tendências

## 👨‍💻 Autor

**Lucas Santos** - Desenvolvedor Full Stack
- Portfolio: [dev-lss.site](https://www.dev-lss.site/)
- GitHub: [@iluucasz](https://github.com/seu-usuario)

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo LICENSE para detalhes. 