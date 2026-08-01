(() => {
  let installPrompt = null;
  const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
  const installButton = document.createElement('button');
  installButton.className = 'pwa-install visible';
  installButton.type = 'button';
  installButton.textContent = 'Instalar aplicativo';
  installButton.setAttribute('aria-label', 'Instalar o Engmetclima neste dispositivo');
  document.body.append(installButton);

  const showHint = text => {
    document.querySelector('.pwa-hint')?.remove();
    const hint = document.createElement('aside');
    hint.className = 'pwa-hint';
    hint.innerHTML = `${text}<button type="button" aria-label="Fechar orientação">Fechar</button>`;
    hint.querySelector('button').onclick = () => hint.remove();
    document.body.append(hint);
  };

  const showIosHint = () => {
    if (!isIos() || isStandalone() || localStorage.getItem('engmetclima-ios-install-hint')) return;
    showHint('Para instalar no iPhone: abra o menu Compartilhar e escolha <strong>Adicionar à Tela de Início</strong>.');
    localStorage.setItem('engmetclima-ios-install-hint', '1');
  };

  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; });
  installButton.addEventListener('click', async () => {
    if (isIos()) { showIosHint(); return; }
    if (!installPrompt) {
      showHint('A instalação será liberada pelo navegador assim que ele concluir a verificação. Atualize esta página uma vez e tente novamente.');
      return;
    }
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt.remove?.();
    installPrompt = null;
  });
  window.addEventListener('appinstalled', () => installButton.remove());
  window.addEventListener('DOMContentLoaded', showIosHint);
})();
