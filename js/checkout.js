/**
 * Neto Invest - Sistema de Checkout e Compra de Acesso
 * 
 * Processa a compra de planos (Mensal, Anual, Vitalício)
 * com suporte a PIX, Cartão de Crédito e integração com APIs de Pagamento.
 */

(function(window) {
  'use strict';

  const PLANS = {
    mensal: {
      id: 'mensal',
      name: 'Plano Mensal',
      period: 'por mês',
      price: 39.90,
      formattedPrice: 'R$ 39,90',
      totalFormatted: 'R$ 39,90 / mês',
      billingCycle: 'Cobrança mensal recorrente',
      features: [
        'Acesso completo ao Ranking de Ações',
        'Carteira Neto Invest atualizada',
        'Simulador Minha Carteira & Projeções',
        'Agenda de Dividendos mês a mês',
        'Calculadoras de Juros e Aposentadoria'
      ]
    },
    anual: {
      id: 'anual',
      name: 'Plano Anual PRO',
      period: 'por mês',
      price: 29.90,
      total: 358.80,
      formattedPrice: 'R$ 29,90',
      totalFormatted: 'R$ 358,80 / ano (R$ 29,90/mês)',
      billingCycle: 'Cobrança anual com 25% de desconto',
      popular: true,
      features: [
        'Tudo do Plano Mensal',
        '25% de desconto exclusivo',
        'Acesso antecipado a novas temporadas de balanço',
        'Atualização prioritária da planilha',
        'Suporte dedicado a membros PRO'
      ]
    },
    vitalicio: {
      id: 'vitalicio',
      name: 'Membro Vitalício VIP',
      period: 'pagamento único',
      price: 890.00,
      formattedPrice: 'R$ 890,00',
      totalFormatted: 'R$ 890,00 pagamento único',
      billingCycle: 'Acesso para sempre, sem mensalidades',
      features: [
        'Acesso vitalício irrestrito a todas as ferramentas',
        'Todas as futuras versões e atualizações da plataforma',
        'Selo exclusivo de Membro Vitalício',
        'Canal VIP direto com a equipe',
        'Integração direta com APIs e exportação de dados'
      ]
    }
  };

  class Checkout {
    constructor() {
      this.selectedPlan = PLANS.anual;
      this.paymentMethod = 'pix'; // 'pix' | 'credit_card'
    }

    openModal(planId = 'anual') {
      this.selectedPlan = PLANS[planId] || PLANS.anual;
      this.paymentMethod = 'pix';
      this.renderModal();
    }

    closeModal() {
      const modal = document.getElementById('checkout-modal');
      if (modal) modal.remove();
    }

    renderModal() {
      this.closeModal();

      const user = window.AuthService ? window.AuthService.getCurrentUser() : null;
      const plan = this.selectedPlan;

      const modalEl = document.createElement('div');
      modalEl.id = 'checkout-modal';
      modalEl.className = 'modal-backdrop';
      modalEl.innerHTML = `
        <div class="modal-card modal-checkout" role="dialog" aria-modal="true">
          <div class="modal-header">
            <div>
              <span class="eyebrow" style="color:var(--accent)">Finalizar Assinatura</span>
              <h2 style="margin:2px 0 0;font-size:20px">${plan.name}</h2>
            </div>
            <button class="x modal-close-btn" onclick="window.Checkout.closeModal()">✕</button>
          </div>

          <div class="checkout-grid">
            <!-- Coluna da Esquerda: Resumo do Pedido -->
            <div class="checkout-summary">
              <div class="checkout-plan-badge">
                <b>${plan.totalFormatted}</b>
                <small>${plan.billingCycle}</small>
              </div>

              <div class="checkout-features-list">
                ${plan.features.map(f => `<div><span style="color:var(--good);font-weight:700">✓</span> ${f}</div>`).join('')}
              </div>

              <div class="checkout-guarantee">
                <svg viewBox="0 0 24 24" style="width:20px;height:20px;stroke:var(--accent);fill:none;stroke-width:2;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <div>
                  <b>Garantia Incondicional de 7 Dias</b>
                  <p style="margin:2px 0 0;font-size:11.5px;color:var(--muted)">Se não gostar, devolvemos 100% do seu investimento sem burocracia.</p>
                </div>
              </div>
            </div>

            <!-- Coluna da Direita: Dados e Pagamento -->
            <div class="checkout-form-area">
              <div class="form-group">
                <label>Seu Nome Completo</label>
                <input type="text" id="chk-name" value="${user ? user.name : ''}" placeholder="Ex: João da Silva" required>
              </div>

              <div class="form-group">
                <label>Seu Melhor E-mail</label>
                <input type="email" id="chk-email" value="${user ? user.email : ''}" placeholder="Ex: joao@email.com" required>
              </div>

              <!-- Abas de Pagamento -->
              <div class="payment-tabs">
                <button type="button" class="tab-btn ${this.paymentMethod === 'pix' ? 'active' : ''}" onclick="window.Checkout.setPaymentMethod('pix')">
                  <svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:currentColor;"><path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.2L18.2 8 12 11.8 5.8 8 12 4.2zM6 9.5l5 3.1v6.7l-5-3.1V9.5zm7 9.8v-6.7l5-3.1v6.7l-5 3.1z"/></svg>
                  PIX (Acesso Imediato)
                </button>
                <button type="button" class="tab-btn ${this.paymentMethod === 'credit_card' ? 'active' : ''}" onclick="window.Checkout.setPaymentMethod('credit_card')">
                  <svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                  Cartão de Crédito
                </button>
              </div>

              <!-- Detalhes do Pagamento -->
              <div id="payment-details-view">
                ${this.renderPaymentMethodDetails()}
              </div>

              <div id="checkout-status-msg" style="margin-top:10px;font-size:12.5px;"></div>

              <button class="pri checkout-submit-btn" id="chk-submit" onclick="window.Checkout.processCheckout()">
                Confirmar e Liberar Acesso VIP
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modalEl);
    }

    setPaymentMethod(method) {
      this.paymentMethod = method;
      const tabs = document.querySelectorAll('.payment-tabs .tab-btn');
      tabs.forEach(t => t.classList.remove('active'));
      const activeTab = method === 'pix' ? tabs[0] : tabs[1];
      if (activeTab) activeTab.classList.add('active');

      const view = document.getElementById('payment-details-view');
      if (view) view.innerHTML = this.renderPaymentMethodDetails();
    }

    renderPaymentMethodDetails() {
      if (this.paymentMethod === 'pix') {
        const pixPayload = '00020126580014BR.GOV.BCB.PIX0136netoinvest.contato@pagamentos.com.br520400005303986540' + (this.selectedPlan.price || 358.80) + '5802BR5925NETO INVEST PLATAFORMA6009SAO PAULO62070503***6304E2B1';
        return `
          <div class="pix-payment-box">
            <div class="pix-qr-fake">
              <svg viewBox="0 0 100 100" style="width:90px;height:90px;">
                <rect x="0" y="0" width="100" height="100" fill="#fff"/>
                <rect x="10" y="10" width="25" height="25" fill="#0B1F3A"/>
                <rect x="15" y="15" width="15" height="15" fill="#fff"/>
                <rect x="18" y="18" width="9" height="9" fill="#0B1F3A"/>
                
                <rect x="65" y="10" width="25" height="25" fill="#0B1F3A"/>
                <rect x="70" y="15" width="15" height="15" fill="#fff"/>
                <rect x="73" y="18" width="9" height="9" fill="#0B1F3A"/>
                
                <rect x="10" y="65" width="25" height="25" fill="#0B1F3A"/>
                <rect x="15" y="70" width="15" height="15" fill="#fff"/>
                <rect x="18" y="73" width="9" height="9" fill="#0B1F3A"/>
                
                <circle cx="50" cy="50" r="10" fill="#1B5FB8"/>
                <rect x="42" y="15" width="8" height="18" fill="#0B1F3A"/>
                <rect x="42" y="68" width="8" height="18" fill="#0B1F3A"/>
                <rect x="68" y="45" width="20" height="8" fill="#0B1F3A"/>
                <rect x="12" y="45" width="20" height="8" fill="#0B1F3A"/>
              </svg>
            </div>
            <div style="flex:1;min-width:0">
              <span class="eyebrow" style="color:var(--good)">Aprovação Instantânea</span>
              <p style="margin:4px 0 8px;font-size:12px;color:var(--muted)">Abra o app do seu banco, escolha Pix Copia e Cola e confirme o pagamento.</p>
              <div style="display:flex;gap:6px">
                <input type="text" readonly value="${pixPayload}" style="font-size:11px;padding:6px;background:var(--sunk);" id="pix-copy-input">
                <button type="button" class="ghost" style="padding:6px 10px;font-size:11.5px;white-space:nowrap" onclick="window.Checkout.copyPixCode()">Copiar Código</button>
              </div>
            </div>
          </div>
        `;
      } else {
        return `
          <div class="card-payment-form">
            <div class="form-group">
              <label>Número do Cartão</label>
              <input type="text" placeholder="0000 0000 0000 0000" maxlength="19" id="card-num" value="4532 •••• •••• 8892">
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
              <div class="form-group">
                <label>Validade</label>
                <input type="text" placeholder="MM/AA" maxlength="5" id="card-exp" value="12/28">
              </div>
              <div class="form-group">
                <label>CVV</label>
                <input type="text" placeholder="123" maxlength="4" id="card-cvv" value="789">
              </div>
            </div>
          </div>
        `;
      }
    }

    copyPixCode() {
      const input = document.getElementById('pix-copy-input');
      if (input) {
        input.select();
        document.execCommand('copy');
        if (window.AppUI) window.AppUI.showToast('Código Pix copiado para a área de transferência!');
      }
    }

    async processCheckout() {
      const nameInput = document.getElementById('chk-name');
      const emailInput = document.getElementById('chk-email');
      const statusMsg = document.getElementById('checkout-status-msg');
      const submitBtn = document.getElementById('chk-submit');

      const name = nameInput ? nameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';

      if (!name) {
        if (statusMsg) statusMsg.innerHTML = '<span style="color:var(--bad)">Por favor, preencha seu nome.</span>';
        return;
      }
      if (!email || !email.includes('@')) {
        if (statusMsg) statusMsg.innerHTML = '<span style="color:var(--bad)">Por favor, insira um e-mail válido.</span>';
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Processando com a API…';
      if (statusMsg) statusMsg.innerHTML = '<span style="color:var(--accent)">Conectando à API de pagamento…</span>';

      const orderData = {
        id: 'PED-' + Date.now(),
        plan: this.selectedPlan.id,
        planName: this.selectedPlan.name,
        total: this.selectedPlan.price,
        customer: { name, email },
        method: this.paymentMethod
      };

      // Dispara chamada para a API de Pagamento / Webhook
      const response = await window.ApiService.processSubscriptionPayment(orderData);

      if (response && response.success) {
        // Se usuário não existia, cria ou atualiza no AuthService
        let currentUser = window.AuthService.getCurrentUser();
        if (!currentUser) {
          const regRes = window.AuthService.register({
            name,
            email,
            password: '123'
          });
          if (regRes.success) currentUser = regRes.user;
          else {
            window.AuthService.login(email, '123');
            currentUser = window.AuthService.getCurrentUser();
          }
        }

        // Ativa o plano VIP
        window.AuthService.upgradeCurrentUser(this.selectedPlan.id);

        if (statusMsg) {
          statusMsg.innerHTML = '<span style="color:var(--good);font-weight:600">✓ Pagamento Aprovado com Sucesso!</span>';
        }

        setTimeout(() => {
          this.closeModal();
          if (window.AppUI) {
            window.AppUI.showToast('🎉 Parabéns! Seu acesso à plataforma Neto Invest está 100% liberado!');
            window.AppUI.navigateToSection('terminal-section');
          }
          if (window.NetoPlatform) {
            window.NetoPlatform.render();
          }
        }, 1000);
      } else {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Confirmar e Liberar Acesso VIP';
        if (statusMsg) statusMsg.innerHTML = '<span style="color:var(--bad)">Erro ao processar: ' + (response?.error || 'Tente novamente.') + '</span>';
      }
    }
  }

  window.Checkout = new Checkout();
})(window);
