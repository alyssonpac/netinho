/**
 * Neto Invest - Aplicação Principal e Controle de Interface
 */

(function(window) {
  'use strict';

  class AppUI {
    constructor() {
      this.initEvents();
      this.initAuthObserver();
    }

    init() {
      if (window.NetoPlatform) {
        window.NetoPlatform.init();
      }
      this.updateNavbarUser();
    }

    initEvents() {
      // Navegação suave para âncoras internas
      document.addEventListener('click', e => {
        const link = e.target.closest('a[href^="#"]');
        if (link && !link.classList.contains('no-scroll')) {
          const targetId = link.getAttribute('href').replace('#', '');
          const targetEl = document.getElementById(targetId);
          if (targetEl) {
            e.preventDefault();
            targetEl.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });

      // Atalho discreto para o proprietário abrir configurações de pagamento (Ctrl + Shift + P)
      document.addEventListener('keydown', e => {
        if (e.ctrlKey && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
          this.openApiSettingsModal();
        }
      });
    }

    navigateToSection(sectionId) {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    }

    initAuthObserver() {
      if (window.AuthService) {
        window.AuthService.onAuthChange(user => {
          this.updateNavbarUser(user);
          if (window.NetoPlatform) {
            window.NetoPlatform.render();
          }
        });
      }
    }

    updateNavbarUser(user = window.AuthService?.getCurrentUser()) {
      const userArea = document.getElementById('navbar-user-area');
      if (!userArea) return;

      if (user) {
        const isVip = !!user.isVip;
        userArea.innerHTML = `
          <div class="user-profile-badge">
            <span class="user-avatar">${user.name.charAt(0).toUpperCase()}</span>
            <span style="font-weight:600;font-size:12.5px;">${user.name.split(' ')[0]}</span>
            <span class="plan-pill ${isVip ? 'vip' : 'free'}">${isVip ? 'VIP' : 'Grátis'}</span>
            <button class="ghost logout-btn" onclick="window.AuthService.logout()" title="Encerrar Sessão" style="padding:2px 6px;height:24px;font-size:11px;">
              Sair
            </button>
          </div>
        `;
      } else {
        userArea.innerHTML = `
          <button class="ghost nav-login-btn" onclick="window.AppUI.openAuthModal('login')">Entrar</button>
          <button class="pri nav-register-btn" onclick="window.AppUI.openAuthModal('register')">Cadastre-se</button>
        `;
      }
    }

    // Modal de Login / Cadastro
    openAuthModal(initialTab = 'login') {
      this.closeAuthModal();

      const modalEl = document.createElement('div');
      modalEl.id = 'auth-modal';
      modalEl.className = 'modal-backdrop';
      modalEl.innerHTML = `
        <div class="modal-card modal-auth" role="dialog" aria-modal="true">
          <div class="modal-header">
            <div>
              <span class="eyebrow" style="color:var(--accent)">Área de Membros</span>
              <h2 style="margin:2px 0 0;font-size:19px" id="auth-modal-title">${initialTab === 'login' ? 'Acessar Conta' : 'Criar Nova Conta'}</h2>
            </div>
            <button class="x modal-close-btn" onclick="window.AppUI.closeAuthModal()">✕</button>
          </div>

          <div class="auth-tabs">
            <button type="button" class="tab-btn ${initialTab === 'login' ? 'active' : ''}" id="tab-auth-login" onclick="window.AppUI.switchAuthTab('login')">Entrar</button>
            <button type="button" class="tab-btn ${initialTab === 'register' ? 'active' : ''}" id="tab-auth-reg" onclick="window.AppUI.switchAuthTab('register')">Cadastrar</button>
          </div>

          <div id="auth-form-container">
            ${this.renderAuthForm(initialTab)}
          </div>

          <div class="auth-demo-helper" style="margin-top:14px;padding-top:12px;border-top:1px solid var(--line);">
            <div style="font-size:11.5px;color:var(--muted);margin-bottom:6px;">Acesso de teste rápido:</div>
            <div style="display:flex;gap:8px;">
              <button type="button" class="ghost" style="flex:1;font-size:11px;padding:5px 8px;height:30px;" onclick="window.AuthService.quickDemoLogin(true); window.AppUI.closeAuthModal(); window.AppUI.showToast('Conectado como Membro VIP Demo');">
                ⚡ Entrar como VIP
              </button>
              <button type="button" class="ghost" style="flex:1;font-size:11px;padding:5px 8px;height:30px;" onclick="window.AuthService.quickDemoLogin(false); window.AppUI.closeAuthModal(); window.AppUI.showToast('Conectado como Visitante');">
                Entrar Visitante
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modalEl);
    }

    closeAuthModal() {
      const modal = document.getElementById('auth-modal');
      if (modal) modal.remove();
    }

    switchAuthTab(tab) {
      const title = document.getElementById('auth-modal-title');
      const container = document.getElementById('auth-form-container');
      const tabLogin = document.getElementById('tab-auth-login');
      const tabReg = document.getElementById('tab-auth-reg');

      if (tab === 'login') {
        if (title) title.textContent = 'Acessar Conta';
        if (tabLogin) tabLogin.classList.add('active');
        if (tabReg) tabReg.classList.remove('active');
      } else {
        if (title) title.textContent = 'Criar Nova Conta';
        if (tabLogin) tabLogin.classList.remove('active');
        if (tabReg) tabReg.classList.add('active');
      }

      if (container) container.innerHTML = this.renderAuthForm(tab);
    }

    renderAuthForm(tab) {
      if (tab === 'login') {
        return `
          <form onsubmit="window.AppUI.submitLogin(event)">
            <div class="form-group">
              <label>E-mail</label>
              <input type="email" id="auth-email" value="membro@netoinvest.com" placeholder="seu@email.com" required>
            </div>
            <div class="form-group">
              <label>Senha</label>
              <input type="password" id="auth-pwd" value="123" placeholder="Sua senha" required>
            </div>
            <div id="auth-error-msg" style="color:var(--bad);font-size:12px;margin-bottom:8px;"></div>
            <button type="submit" class="pri" style="width:100%;padding:9px;font-size:13.5px;">Entrar na Plataforma</button>
          </form>
        `;
      } else {
        return `
          <form onsubmit="window.AppUI.submitRegister(event)">
            <div class="form-group">
              <label>Nome Completo</label>
              <input type="text" id="reg-name" placeholder="Ex: Lucas Ferreira" required>
            </div>
            <div class="form-group">
              <label>E-mail</label>
              <input type="email" id="reg-email" placeholder="seu@email.com" required>
            </div>
            <div class="form-group">
              <label>Senha</label>
              <input type="password" id="reg-pwd" placeholder="Mínimo 3 caracteres" required>
            </div>
            <div id="auth-error-msg" style="color:var(--bad);font-size:12px;margin-bottom:8px;"></div>
            <button type="submit" class="pri" style="width:100%;padding:9px;font-size:13.5px;">Criar Conta e Continuar</button>
          </form>
        `;
      }
    }

    submitLogin(e) {
      e.preventDefault();
      const email = document.getElementById('auth-email')?.value;
      const pwd = document.getElementById('auth-pwd')?.value;
      const errorMsg = document.getElementById('auth-error-msg');

      const res = window.AuthService.login(email, pwd);
      if (res.success) {
        this.closeAuthModal();
        this.showToast(`Bem-vindo, ${res.user.name.split(' ')[0]}!`);
      } else {
        if (errorMsg) errorMsg.textContent = res.error || 'Credenciais inválidas.';
      }
    }

    submitRegister(e) {
      e.preventDefault();
      const name = document.getElementById('reg-name')?.value;
      const email = document.getElementById('reg-email')?.value;
      const pwd = document.getElementById('reg-pwd')?.value;
      const errorMsg = document.getElementById('auth-error-msg');

      const res = window.AuthService.register({ name, email, password: pwd });
      if (res.success) {
        this.closeAuthModal();
        this.showToast(`Conta criada! Escolha seu plano para liberar o acesso.`);
        this.navigateToSection('planos');
      } else {
        if (errorMsg) errorMsg.textContent = res.error || 'Erro ao cadastrar.';
      }
    }

    // Modal Administrativo Privado de Configuração de Pagamento (Monetização)
    openApiSettingsModal() {
      this.closeApiSettingsModal();

      const cfg = window.ApiService ? window.ApiService.config : {};

      const modalEl = document.createElement('div');
      modalEl.id = 'api-settings-modal';
      modalEl.className = 'modal-backdrop';
      modalEl.innerHTML = `
        <div class="modal-card modal-api-config" role="dialog" aria-modal="true">
          <div class="modal-header">
            <div>
              <span class="eyebrow" style="color:var(--accent)">Painel Administrativo do Proprietário</span>
              <h2 style="margin:2px 0 0;font-size:18px">Configurar Plataforma de Pagamento</h2>
            </div>
            <button class="x modal-close-btn" onclick="window.AppUI.closeApiSettingsModal()">✕</button>
          </div>

          <p class="sub" style="font-size:12.5px;margin:4px 0 14px;">
            Configure aqui as credenciais do seu gateway para receber os pagamentos e liberar os acessos VIP dos seus clientes automaticamente.
          </p>

          <form onsubmit="window.AppUI.saveApiSettings(event)">
            <div class="form-group">
              <label>Plataforma de Pagamento</label>
              <select id="api-provider" style="width:100%">
                <option value="asaas" ${cfg.paymentProvider === 'asaas' ? 'selected' : ''}>Asaas (Pix & Cartão com taxa reduzida)</option>
                <option value="mercadopago" ${cfg.paymentProvider === 'mercadopago' ? 'selected' : ''}>Mercado Pago</option>
                <option value="stripe" ${cfg.paymentProvider === 'stripe' ? 'selected' : ''}>Stripe Brasil</option>
                <option value="kiwify" ${cfg.paymentProvider === 'kiwify' ? 'selected' : ''}>Kiwify Webhook</option>
                <option value="custom" ${cfg.paymentProvider === 'custom' ? 'selected' : ''}>Webhook / API Própria</option>
              </select>
            </div>

            <div class="form-group">
              <label>Chave de API / Token da sua Conta</label>
              <input type="text" id="api-key" value="${cfg.apiKey || ''}" placeholder="Ex: $aact_YTU5YTE0M2M6N2Nm... ou sk_live_...">
            </div>

            <div class="form-group">
              <label>URL de Webhook / Notificação de Pagamento</label>
              <input type="url" id="api-endpoint" value="${cfg.endpointUrl || ''}" placeholder="https://api.seusite.com.br/webhook">
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <div class="form-group">
                <label>Modo de Operação</label>
                <select id="api-env" style="width:100%">
                  <option value="sandbox" ${cfg.environment === 'sandbox' ? 'selected' : ''}>Sandbox (Testes)</option>
                  <option value="production" ${cfg.environment === 'production' ? 'selected' : ''}>Produção (Vendas Reais)</option>
                </select>
              </div>

              <div class="form-group">
                <label>Chave Pix de Recebimento</label>
                <input type="text" id="api-pix-key" value="${cfg.pixKey || 'netoinvest.contato@pagamentos.com.br'}" placeholder="Sua chave Pix">
              </div>
            </div>

            <div id="api-test-result" style="margin:8px 0;font-size:12px;padding:8px;border-radius:6px;display:none;"></div>

            <div style="display:flex;gap:10px;margin-top:14px;">
              <button type="button" class="ghost" style="flex:1;" onclick="window.AppUI.testApiConnection()">
                Testar Conexão
              </button>
              <button type="submit" class="pri" style="flex:1;">
                Salvar Configurações
              </button>
            </div>
          </form>
        </div>
      `;

      document.body.appendChild(modalEl);
    }

    closeApiSettingsModal() {
      const modal = document.getElementById('api-settings-modal');
      if (modal) modal.remove();
    }

    async testApiConnection() {
      const resultBox = document.getElementById('api-test-result');
      if (!resultBox) return;

      resultBox.style.display = 'block';
      resultBox.style.background = 'var(--sunk)';
      resultBox.style.color = 'var(--ink)';
      resultBox.textContent = 'Testando conexão com a plataforma de pagamento...';

      const provider = document.getElementById('api-provider')?.value;
      const apiKey = document.getElementById('api-key')?.value;
      const endpoint = document.getElementById('api-endpoint')?.value;
      const env = document.getElementById('api-env')?.value;
      const pixKey = document.getElementById('api-pix-key')?.value;

      window.ApiService.saveConfig({
        paymentProvider: provider,
        apiKey: apiKey,
        endpointUrl: endpoint,
        environment: env,
        pixKey: pixKey
      });

      const res = await window.ApiService.testConnection();
      if (res.success) {
        resultBox.style.background = 'var(--good-soft)';
        resultBox.style.color = 'var(--good)';
        resultBox.textContent = `✓ Conexão bem-sucedida! ${res.message}`;
      } else {
        resultBox.style.background = 'var(--bad-soft)';
        resultBox.style.color = 'var(--bad)';
        resultBox.textContent = `✕ ${res.message}`;
      }
    }

    saveApiSettings(e) {
      e.preventDefault();
      const provider = document.getElementById('api-provider')?.value;
      const apiKey = document.getElementById('api-key')?.value;
      const endpoint = document.getElementById('api-endpoint')?.value;
      const env = document.getElementById('api-env')?.value;
      const pixKey = document.getElementById('api-pix-key')?.value;

      window.ApiService.saveConfig({
        paymentProvider: provider,
        apiKey: apiKey,
        endpointUrl: endpoint,
        environment: env,
        pixKey: pixKey
      });

      this.closeApiSettingsModal();
      this.showToast('Configurações de pagamento salvas com sucesso!');
    }

    showToast(message) {
      const el = document.createElement('div');
      el.className = 'toast';
      el.textContent = message;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 2600);
    }
  }

  window.AppUI = new AppUI();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.AppUI.init());
  } else {
    window.AppUI.init();
  }

})(window);
