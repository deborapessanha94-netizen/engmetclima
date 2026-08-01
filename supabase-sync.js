// Mantém favoritos e preferências vinculados à conta autenticada.
(function () {
  const SESSION_KEY = 'engmetclima-pwa-supabase-session';
  const FAVORITES_KEY = 'engmetclima-pwa-favorites';
  const SETTINGS_KEY = 'engmetclima-pwa-settings';
  let hydrating = false;
  let syncTimer;

  function session() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
    catch { return null; }
  }
  function context() {
    const current = session();
    const config = globalThis.ENGMETCLIMA_SUPABASE || {};
    if (!current?.access_token || !current?.user?.id || !config.url || !config.publishableKey) return null;
    return { userId: current.user.id, token: current.access_token, url: String(config.url).replace(/\/$/, ''), key: config.publishableKey };
  }
  async function api(path, options = {}) {
    const auth = context();
    if (!auth) return null;
    const response = await fetch(`${auth.url}/rest/v1/${path}`, {
      ...options,
      headers: { apikey: auth.key, Authorization: `Bearer ${auth.token}`, ...(options.headers || {}) }
    });
    if (!response.ok) throw new Error('Não foi possível sincronizar seus dados agora.');
    return response.status === 204 ? null : response.json().catch(() => null);
  }
  function getJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch { return fallback; }
  }
  async function hydrate() {
    const auth = context();
    if (!auth || hydrating) return;
    hydrating = true;
    try {
      const [settingRows, favoriteRows] = await Promise.all([
        api(`user_settings?user_id=eq.${encodeURIComponent(auth.userId)}&select=settings`),
        api(`favorite_locations?user_id=eq.${encodeURIComponent(auth.userId)}&select=name,latitude,longitude&order=created_at.asc`)
      ]);
      if (settingRows?.[0]?.settings) localStorage.setItem(SETTINGS_KEY, JSON.stringify(settingRows[0].settings));
      if (Array.isArray(favoriteRows) && favoriteRows.length) localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteRows));
      globalThis.render?.();
    } catch (error) {
      console.warn(error.message);
    } finally {
      hydrating = false;
    }
  }
  async function syncSettings() {
    const auth = context();
    if (!auth || hydrating) return;
    const settings = getJson(SETTINGS_KEY, {});
    await api('user_settings?on_conflict=user_id', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify([{ user_id: auth.userId, settings, updated_at: new Date().toISOString() }])
    });
  }
  async function syncFavorites() {
    const auth = context();
    if (!auth || hydrating) return;
    const favorites = getJson(FAVORITES_KEY, []);
    await api(`favorite_locations?user_id=eq.${encodeURIComponent(auth.userId)}`, { method: 'DELETE' });
    if (favorites.length) {
      await api('favorite_locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify(favorites.map(place => ({ user_id: auth.userId, name: place.name, latitude: Number(place.latitude), longitude: Number(place.longitude) })))
      });
    }
  }
  function schedule(key) {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      const action = key === SETTINGS_KEY ? syncSettings : syncFavorites;
      action().catch(error => console.warn(error.message));
    }, 450);
  }
  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key, value) {
    originalSetItem.call(this, key, value);
    if (this !== localStorage) return;
    if (key === SESSION_KEY) setTimeout(hydrate, 50);
    if (key === SETTINGS_KEY || key === FAVORITES_KEY) schedule(key);
  };
  const originalRemoveItem = Storage.prototype.removeItem;
  Storage.prototype.removeItem = function (key) {
    originalRemoveItem.call(this, key);
    if (this === localStorage && key === FAVORITES_KEY) schedule(key);
  };
  setTimeout(hydrate, 100);
})();
