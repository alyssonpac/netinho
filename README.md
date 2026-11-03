# Neto Invest · Plataforma Web & Área de Membros

Website oficial e plataforma de membros do **Neto Invest** (canal do analista Mário, CNPI), com visual minimalista de alta performance, sistema de autenticação (login/cadastro), checkout com planos de assinatura, arquitetura aberta para conexão de APIs empresariais (gateways e cotações) e o conteúdo interativo completo de análise de dividendos.

---

## 🌟 O Que Foi Criado

1. **Página Home Minimalista & Apresentação do Canal Neto Invest:**
   - **Hero Section:** Proposta de valor clara ("Ações de dividendos, preço teto e renda passiva com previsibilidade"), fita com as maiores margens de segurança em tempo real e botões de ação rápida.
   - **Sobre o Neto Invest:** Perfil de Mário, analista CNPI, sua filosofia de dividendos, mentalidade de sócio/holding e links diretos para o canal do YouTube e Instagram.
   - **Metodologia:** Explicação dos três pilares analíticos: Preço Teto Bazin Adaptado (7,75% a.a.), Preço Teto por P/L Justo (Graham) e Visão de Holding.
   - **Métricas:** Destaque de 78 ações analisadas em 16 setores da B3, 32 anos de histórico do IBOV e comunidade de investidores.

2. **Login e Cadastro no Canto Superior:**
   - Topbar fixa com efeito translúcido (*backdrop-filter blur*).
   - Botões de **Entrar** e **Cadastre-se** no canto superior direito.
   - **Modal de Autenticação:**
     - Alternância suave entre Login e Cadastro.
     - Suporte a credenciais salvas em `localStorage`.
     - **Botão Demo VIP:** Permite testar a plataforma instantaneamente com 1 clique (e-mail: `membro@netoinvest.com`, senha: `123`).
     - Atualização em tempo real do perfil do usuário logado (avatar, nome, badge "Membro VIP" / "Visitante" e opção de sair).

3. **Opção de Comprar Acesso à Plataforma:**
   - Seção de **Planos de Acesso**:
     - **Plano Mensal:** R$ 39,90/mês
     - **Plano Anual PRO (Destaque):** R$ 29,90/mês (25% de desconto)
     - **Plano Vitalício VIP:** R$ 890,00 (pagamento único)
   - **Checkout Interativo Integrado:**
     - Resumo do pedido e garantia incondicional de 7 dias.
     - Pagamento via **PIX** com QR Code gerado, chave "Copia e Cola" e simulação de aprovação instantânea.
     - Pagamento via **Cartão de Crédito**.
     - Liberação imediata do status VIP do usuário ao concluir a compra.

4. **Arquitetura Aberta para Adicionar API de Alguma Empresa:**
   - Módulo dedicado em [`js/api-service.js`](js/api-service.js).
   - **Interface Visual de Configuração:**
     - Modal interativo para cadastrar **API Key**, **Webhook URL**, **Provedor** (Asaas, Mercado Pago, Stripe, Kiwify, Hotmart, Braip ou API própria) e **Ambiente** (Sandbox / Produção).
     - Botão **"Testar Conexão"** com feedback em tempo real.
     - Suporte a APIs de cotações em tempo real (Brapi.dev, HG Brasil Finance).
     - Endpoint pronto para receber webhooks externos (`subscription.created`, `order.approved`) e liberar acessos automaticamente.

5. **Acesso ao Conteúdo Completo (O Arquivo HTML de Análise Financeira):**
   - O conteúdo do artefato HTML enviado está 100% incorporado na seção **Terminal de Investimentos**, com todas as suas funcionalidades nativas:
     - **Início:** Visão geral da planilha de novembro/2026, empresas que anunciam no mês e estatísticas.
     - **Carteira Neto Invest:** Carteira oficial acompanhada no canal, earning yield, renda mensal e projeção da holding 2027–2031.
     - **Minha Carteira:** Adicionar ações, editar quantidades, gráfico de pizza de alocação por patrimônio e projeções customizadas.
     - **Ranking de Ações:** Tabela interativa com 78 ativos, alternância entre Bazin Adaptado e P/L Justo, busca por ticker/empresa, filtro por setor e ordenação por colunas.
     - **Agenda de Dividendos:** Calendário de anúncios mês a mês e proventos estimados.
     - **IBOV e Quedas:** Histórico de 1995 a 2026 com gráfico de retorno vs. queda máxima intradiária.
     - **Calculadoras:** Juros compostos com aportes e calculadora de primeiro milhão / renda passiva com gráficos dinâmicos em SVG.
     - **Drawer do Ativo:** Ficha técnica completa de cada empresa ao clicar em qualquer ação.
     - **Gatekeeper:** Exibe tela de prévia/bloqueio amigável para visitantes não assinantes, liberando tudo automaticamente para membros VIP.

---

## 📁 Estrutura de Arquivos

```
neto-invest-site/
├── index.html           # Página principal (Home, Planos, Topbar, Terminal e Modais)
├── css/
│   └── styles.css       # Design minimalista, responsivo, tipografia e componentes
├── js/
│   ├── data.js          # Base de dados (78 ativos, Bazin, Graham, IBOV, Carteira Oficial)
│   ├── api-service.js   # Conector modular para APIs de Pagamento e Cotações
│   ├── auth.js          # Autenticação, cadastro, sessões e permissões VIP
│   ├── checkout.js      # Modal de checkout, seleção de planos, PIX e Cartão
│   ├── platform.js      # Motor interativo do Terminal de Membros (artefato original)
│   └── main.js          # Inicialização, navegação, eventos e controle de UI
└── README.md            # Documentação do projeto
```

---

## 🚀 Como Executar Localmente

Como o projeto é construído em HTML5, CSS3 e JavaScript puro (Vanilla JS), **não necessita de build ou instalação de pacotes pesados**.

Você pode abri-lo de qualquer uma das seguintes formas:

### Opção 1: Abrir diretamente no Navegador
Dê um duplo clique no arquivo `index.html` ou abra-o em qualquer navegador moderno (Chrome, Safari, Firefox, Edge).

### Opção 2: Servidor Local via Python
No terminal, execute:
```bash
cd /Users/aly_pac/.gemini/antigravity/scratch/neto-invest-site
python3 -m http.server 8000
```
Em seguida, acesse no navegador: `http://localhost:8000`

---

## 💳 Como Testar a Compra e as APIs

1. **Conta de Demonstração Rápida:**
   - Clique em **"⚡ Demo VIP"** no canto superior direito para entrar instantaneamente como Membro PRO.
   - Ou faça login com `membro@netoinvest.com` e senha `123`.

2. **Simular Compra de Plano:**
   - Na página inicial, role até a seção **"Planos"** ou clique em **"Planos"** no menu.
   - Clique em **"Assinar Anual com Desconto"** (ou qualquer outro plano).
   - Escolha **PIX** ou **Cartão de Crédito** e clique em **"Confirmar e Liberar Acesso VIP"**.
   - O sistema processa o pedido via `ApiService`, ativa a assinatura e abre imediatamente a plataforma com acesso 100% liberado!

3. **Conectar API de Alguma Empresa:**
   - Na seção **"Integração de APIs"** ou no rodapé, clique em **"Configurar API & Webhooks"**.
   - Escolha seu provedor (Asaas, Mercado Pago, Stripe, Kiwify ou Webhook Customizado).
   - Insira sua Chave de API / Token e URL de Notificação.
   - Clique em **"Testar Conexão"** e depois em **"Salvar Configurações"**.
