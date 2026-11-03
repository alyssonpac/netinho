/**
 * Neto Invest - Sistema de Autenticação e Gestão de Membros
 * 
 * Gerencia login, cadastro, sessões e status de assinatura (VIP / Gratuito).
 */

(function(window) {
  'use strict';

  const USERS_KEY = 'netoinvest_users_v1';
  const SESSION_KEY = 'netoinvest_current_user_v1';

  // Usuários padrão de demonstração
  const INITIAL_USERS = [
    {
      id: 'usr_demo_vip',
      name: 'Membro Pro Demo',
      email: 'membro@netoinvest.com',
      password: '123',
      isVip: true,
      plan: 'anual',
      joinedAt: '2026-11-01T10:00:00.000Z',
      expiresAt: '2027-11-01T10:00:00.000Z'
    },
    {
      id: 'usr_demo_visitante',
      name: 'Visitante Grátis',
      email: 'visitante@netoinvest.com',
      password: '123',
      isVip: false,
      plan: null,
      joinedAt: '2026-11-02T12:00:00.000Z',
      expiresAt: null
    }
  ];

  class AuthService {
    constructor() {
      this.users = this.loadUsers();
      this.currentUser = this.loadSession();
      this.listeners = [];
    }

    loadUsers() {
      try {
        const stored = localStorage.getItem(USERS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.warn('Erro ao carregar lista de usuários:', e);
      }
      localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
      return [...INITIAL_USERS];
    }

    saveUsers() {
      try {
        localStorage.setItem(USERS_KEY, JSON.stringify(this.users));
      } catch (e) {
        console.error('Erro ao salvar usuários:', e);
      }
    }

    loadSession() {
      try {
        const session = localStorage.getItem(SESSION_KEY);
        if (session) return JSON.parse(session);
      } catch (e) {
        console.warn('Erro ao restaurar sessão:', e);
      }
      return null;
    }

    saveSession(user) {
      this.currentUser = user;
      try {
        if (user) {
          localStorage.setItem(SESSION_KEY, JSON.stringify(user));
        } else {
          localStorage.removeItem(SESSION_KEY);
        }
      } catch (e) {
        console.error('Erro ao atualizar sessão:', e);
      }
      this.notifyListeners();
    }

    onAuthChange(callback) {
      if (typeof callback === 'function') {
        this.listeners.push(callback);
        // Notifica imediatamente com estado atual
        callback(this.currentUser);
      }
    }

    notifyListeners() {
      this.listeners.forEach(cb => {
        try { cb(this.currentUser); } catch (e) { console.error(e); }
      });
    }

    getCurrentUser() {
      return this.currentUser;
    }

    isLoggedIn() {
      return !!this.currentUser;
    }

    hasActiveAccess() {
      if (!this.currentUser) return false;
      return !!this.currentUser.isVip;
    }

    login(email, password) {
      const cleanEmail = String(email || '').trim().toLowerCase();
      const user = this.users.find(u => u.email.toLowerCase() === cleanEmail);

      if (!user) {
        return { success: false, error: 'E-mail não cadastrado.' };
      }

      if (user.password !== password) {
        return { success: false, error: 'Senha incorreta.' };
      }

      this.saveSession(user);
      return { success: true, user };
    }

    register({ name, email, password }) {
      const cleanEmail = String(email || '').trim().toLowerCase();
      const cleanName = String(name || '').trim();

      if (!cleanName) return { success: false, error: 'Por favor, informe seu nome.' };
      if (!cleanEmail || !cleanEmail.includes('@')) return { success: false, error: 'E-mail inválido.' };
      if (!password || password.length < 3) return { success: false, error: 'A senha deve ter no mínimo 3 caracteres.' };

      if (this.users.some(u => u.email.toLowerCase() === cleanEmail)) {
        return { success: false, error: 'Este e-mail já está em uso. Faça login ou use outro.' };
      }

      const newUser = {
        id: 'usr_' + Date.now(),
        name: cleanName,
        email: cleanEmail,
        password: password,
        isVip: false, // Inicia como visitante até assinar
        plan: null,
        joinedAt: new Date().toISOString(),
        expiresAt: null
      };

      this.users.push(newUser);
      this.saveUsers();
      this.saveSession(newUser);

      return { success: true, user: newUser };
    }

    upgradeCurrentUser(planName = 'anual') {
      if (!this.currentUser) return { success: false, error: 'Nenhum usuário conectado.' };

      const userInDb = this.users.find(u => u.id === this.currentUser.id);
      const updated = {
        ...(userInDb || this.currentUser),
        isVip: true,
        plan: planName,
        subscribedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      };

      if (userInDb) {
        Object.assign(userInDb, updated);
        this.saveUsers();
      }

      this.saveSession(updated);
      return { success: true, user: updated };
    }

    upgradeUserToVip(email, planName = 'anual') {
      const user = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (user) {
        user.isVip = true;
        user.plan = planName;
        user.subscribedAt = new Date().toISOString();
        this.saveUsers();

        if (this.currentUser && this.currentUser.id === user.id) {
          this.saveSession({ ...user });
        }
        return true;
      }
      return false;
    }

    quickDemoLogin(asVip = true) {
      const email = asVip ? 'membro@netoinvest.com' : 'visitante@netoinvest.com';
      return this.login(email, '123');
    }

    logout() {
      this.saveSession(null);
      return { success: true };
    }
  }

  window.AuthService = new AuthService();
})(window);
