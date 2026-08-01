// Fluxo de conta remoto. A chave pública é limitada pelas políticas do banco.
(function () {
  const root = () => document.querySelector('#app');
  const safe = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
  const appUrl = () => `${location.origin}${location.pathname}`;
  const sessionKey = 'engmetclima-pwa-supabase-session';
  const userKey = 'engmetclima-pwa-user';
  const emailKey = 'engmetclima-pwa-last-email';

  window.login = function login(mode = 'signin', message = '') {
    const email = localStorage.getItem(emailKey) || '';
    const create = mode === 'create';
    const reset = mode === 'reset';
    const subtitle = reset
      ? 'Informe seu e-mail para receber um link seguro de redefinição de senha.'
      : create
        ? 'Crie sua conta para manter favoritos e preferências protegidos.'
        : 'Seu e-mail fica salvo neste navegador; informe apenas a senha para entrar.';
    root().innerHTML = `<section class="login"><form class="login-card" id="login-form"><div class="mark">◌</div><p class="eyebrow">Atmosfera, oceano e Terra</p><h1>${reset ? 'Redefinir senha' : create ? 'Criar conta' : 'Entrar no Engmetclima'}</h1><p class="subtle">${subtitle}</p><label class="field">E-mail<input name="email" type="email" value="${safe(email)}" autocomplete="email" required autofocus /></label>${create ? '<label class="field">Data de nascimento<input name="birthDate" type="date" autocomplete="bday" required /></label><label class="field">Profissão<input name="profession" type="text" maxlength="80" autocomplete="organization-title" placeholder="Ex.: estudante de Engenharia Meteorológica" required /></label>' : ''}${reset ? '' : '<label class="field">Senha<input name="pass" type="password" minlength="6" autocomplete="current-password" required /></label>'}<p class="error" id="login-error">${safe(message)}</p><button class="primary">${reset ? 'Enviar e-mail de recuperação' : create ? 'Criar conta' : 'Entrar no aplicativo'}</button>${!reset ? '<button class="text-button" type="button" id="reset-password">Esqueci minha senha</button>' : '<button class="text-button" type="button" id="back-login">Voltar para entrar</button>'}${create ? '<button class="text-button" type="button" id="back-login">Já tenho uma conta</button>' : reset ? '' : '<button class="text-button" type="button" id="create-account">Criar conta</button>'}</form></section>`;
    document.querySelector('#create-account')?.addEventListener('click', () => window.login('create'));
    document.querySelectorAll('#back-login').forEach(button => button.addEventListener('click', () => window.login('signin')));
    document.querySelector('#reset-password')?.addEventListener('click', () => window.login('reset'));
    document.querySelector('#login-form').onsubmit = async event => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const userEmail = String(form.get('email') || '').trim().toLowerCase();
      const password = String(form.get('pass') || '');
      const button = event.currentTarget.querySelector('button.primary');
      const error = document.querySelector('#login-error');
      button.disabled = true;
      button.textContent = 'Aguarde…';
      try {
        if (!globalThis.hasSupabase?.()) throw new Error('A conexão com a conta ainda não foi configurada.');
        localStorage.setItem(emailKey, userEmail);
        if (reset) {
          await globalThis.supabaseFetch('/auth/v1/recover', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ email: userEmail, redirect_to: appUrl() }) });
          window.login('signin', 'Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.');
          return;
        }
        if (create) {
          const result = await globalThis.supabaseFetch('/auth/v1/signup', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ email: userEmail, password, data: { birth_date: String(form.get('birthDate') || ''), profession: String(form.get('profession') || '') } }) });
          if (!result.session) {
            window.login('signin', 'Conta criada. Confira seu e-mail e confirme o cadastro antes de entrar.');
            return;
          }
          await globalThis.beginSupabaseSession(result.session);
        } else {
          const result = await globalThis.supabaseFetch('/auth/v1/token?grant_type=password', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ email: userEmail, password }) });
          await globalThis.beginSupabaseSession(result);
        }
        window.start();
        void window.requestCurrentLocation?.();
      } catch (reason) {
        button.disabled = false;
        button.textContent = reset ? 'Enviar e-mail de recuperação' : create ? 'Criar conta' : 'Entrar no aplicativo';
        error.textContent = reason?.message || 'Não foi possível concluir agora.';
      }
    };
  };

  async function bootstrapSupabase() {
    if (!globalThis.hasSupabase?.()) return;
    const user = await globalThis.supabaseCurrentUser();
    if (user) {
      const metadata = user.user_metadata || {};
      localStorage.setItem(userKey, JSON.stringify({ name: String(user.email || '').split('@')[0], email: user.email || '', birthDate: metadata.birth_date || '', profession: metadata.profession || '' }));
      window.start();
      return;
    }
    localStorage.removeItem(userKey);
    window.login();
  }

  document.addEventListener('click', event => {
    const target = event.target.closest?.('#logout, #settings-logout');
    if (!target) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    void globalThis.signOut?.();
  }, true);

  void bootstrapSupabase();
})();
