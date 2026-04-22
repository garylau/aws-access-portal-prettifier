(() => {
  const POLL_INTERVAL = 800;
  const MAX_POLLS = 60;

  function getParentRows() {
    return [...document.querySelectorAll('tr[aria-level="1"][data-selection-item="item"]')];
  }

  function parseRow(tr) {
    const nameEl = tr.querySelector('[data-testid="account-list-cell"]');
    const idEl = tr.querySelector('[class*="text-to-copy"]');
    return {
      name: nameEl?.textContent.trim() || '',
      id: idEl?.textContent.trim() || ''
    };
  }

  function getRoles(tr) {
    const roles = [];
    let sib = tr.nextElementSibling;
    while (sib && sib.getAttribute('aria-level') !== '1') {
      const link = sib.querySelector('[data-testid="federation-link"]');
      if (link) roles.push({ name: link.textContent.trim(), href: link.href });
      sib = sib.nextElementSibling;
    }
    return roles;
  }

  function expandAllRows() {
    return new Promise(resolve => {
      const rows = getParentRows();
      rows.forEach(tr => {
        const btn = tr.querySelector('button[aria-expanded="false"]');
        if (btn) btn.click();
      });
      let checks = 0;
      const check = setInterval(() => {
        checks++;
        if (rows.every(tr => getRoles(tr).length > 0) || checks >= 30) {
          clearInterval(check);
          resolve();
        }
      }, 300);
    });
  }

  const LAST_ROLE_KEY = 'sso-pretty-last-role';

  function getLastRole(accountId) {
    try { return JSON.parse(localStorage.getItem(LAST_ROLE_KEY) || '{}')[accountId]; } catch { return null; }
  }

  function saveLastRole(accountId, href) {
    try {
      const data = JSON.parse(localStorage.getItem(LAST_ROLE_KEY) || '{}');
      data[accountId] = href;
      localStorage.setItem(LAST_ROLE_KEY, JSON.stringify(data));
    } catch {}
  }

  function buildCard(name, subtitle, roles) {
    const card = document.createElement('div');
    card.className = 'sso-pretty-card';
    card.dataset.search = `${name} ${subtitle}`.toLowerCase();

    card.innerHTML = `
      <div class="sso-pretty-name">${name}</div>
      <div class="sso-pretty-id">${subtitle}</div>
    `;

    if (roles.length === 1) {
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => window.open(roles[0].href, '_blank'));
      const tag = document.createElement('div');
      tag.className = 'sso-pretty-role-tag';
      tag.textContent = roles[0].name;
      card.appendChild(tag);
    } else if (roles.length > 1) {
      const defaultHref = getLastRole(subtitle) || roles[0].href;
      const defaultRole = roles.find(r => r.href === defaultHref) || roles[0];

      card.style.cursor = 'pointer';
      card.addEventListener('click', (e) => {
        if (e.target.tagName === 'SELECT') return;
        const current = getLastRole(subtitle) || roles[0].href;
        window.open(current, '_blank');
      });

      const select = document.createElement('select');
      select.className = 'sso-pretty-select';
      roles.forEach(r => {
        const opt = document.createElement('option');
        opt.textContent = r.name;
        opt.value = r.href;
        if (r.href === defaultRole.href) opt.selected = true;
        select.appendChild(opt);
      });
      select.addEventListener('change', () => {
        saveLastRole(subtitle, select.value);
      });
      // Stop card click when interacting with select
      select.addEventListener('click', e => e.stopPropagation());
      card.appendChild(select);
    }

    return card;
  }

  function buildContainer(cards) {
    const container = document.createElement('div');
    container.className = 'sso-pretty-container';

    const toolbar = document.createElement('div');
    toolbar.className = 'sso-pretty-toolbar';

    const searchWrap = document.createElement('div');
    searchWrap.className = 'sso-pretty-search-wrap';

    const search = document.createElement('input');
    search.className = 'sso-pretty-search';
    search.placeholder = 'Filter...';

    const clearBtn = document.createElement('button');
    clearBtn.className = 'sso-pretty-search-clear';
    clearBtn.textContent = '✕';
    clearBtn.style.display = 'none';
    clearBtn.addEventListener('click', () => {
      search.value = '';
      search.dispatchEvent(new Event('input'));
      search.focus();
    });

    search.addEventListener('input', () => {
      const q = search.value.toLowerCase();
      clearBtn.style.display = q ? '' : 'none';
      grid.querySelectorAll('.sso-pretty-card').forEach(c => {
        c.style.display = c.dataset.search.includes(q) ? '' : 'none';
      });
    });
    searchWrap.appendChild(search);
    searchWrap.appendChild(clearBtn);

    const sizeWrap = document.createElement('div');
    sizeWrap.className = 'sso-pretty-size-wrap';
    sizeWrap.innerHTML = '<span class="sso-pretty-size-label">Size</span>';
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '2';
    slider.value = '1';
    slider.className = 'sso-pretty-size-slider';
    const sizes = ['small', 'medium', 'large'];
    slider.addEventListener('input', () => {
      grid.dataset.size = sizes[slider.value];
      localStorage.setItem('sso-pretty-card-size', sizes[slider.value]);
    });
    const saved = localStorage.getItem('sso-pretty-card-size');
    if (saved && sizes.includes(saved)) slider.value = String(sizes.indexOf(saved));
    sizeWrap.appendChild(slider);

    toolbar.appendChild(searchWrap);
    toolbar.appendChild(sizeWrap);
    container.appendChild(toolbar);

    const grid = document.createElement('div');
    grid.className = 'sso-pretty-grid';
    grid.dataset.size = localStorage.getItem('sso-pretty-card-size') || 'medium';
    cards.forEach(c => grid.appendChild(c));
    container.appendChild(grid);
    return container;
  }

  function showLoader(panel) {
    let loader = panel.querySelector('.sso-pretty-loader');
    if (loader) return loader;
    loader = document.createElement('div');
    loader.className = 'sso-pretty-loader';
    loader.innerHTML = `
      <div class="sso-pretty-loader-spinner"></div>
      <div class="sso-pretty-loader-text">Loading...</div>
    `;
    panel.appendChild(loader);
    return loader;
  }

  // ---- Accounts tab ----
  async function prettifyAccounts(panel) {
    if (panel.querySelector('.sso-pretty-container')) return;
    const loader = showLoader(panel);

    await expandAllRows();

    const rows = getParentRows();
    const accounts = rows.map(tr => ({ ...parseRow(tr), roles: getRoles(tr) })).filter(a => a.name);
    accounts.sort((a, b) => a.name.localeCompare(b.name));

    const cards = accounts.map(a => buildCard(a.name, a.id, a.roles));
    loader.remove();
    panel.appendChild(buildContainer(cards));
  }

  // ---- Applications tab ----
  function prettifyApps(panel) {
    if (panel.querySelector('.sso-pretty-container')) return;

    // Applications are rendered as portal-application tiles or link cards
    // They may use various structures - look for app links
    const appLinks = panel.querySelectorAll('a[href]');
    const seen = new Set();
    const apps = [];

    appLinks.forEach(a => {
      const name = a.textContent.trim();
      const href = a.href;
      if (name && href && !seen.has(name) && name.length > 1 && !href.includes('#')) {
        seen.add(name);
        apps.push({ name, href });
      }
    });

    // Also check for icon-based app tiles
    if (apps.length === 0) {
      panel.querySelectorAll('[class*="card"], [class*="tile"], [role="listitem"]').forEach(el => {
        const name = el.textContent.trim();
        const link = el.querySelector('a[href]');
        if (name && link && !seen.has(name)) {
          seen.add(name);
          apps.push({ name, href: link.href });
        }
      });
    }

    if (apps.length === 0) return;

    apps.sort((a, b) => a.name.localeCompare(b.name));
    const cards = apps.map(a => {
      const card = document.createElement('div');
      card.className = 'sso-pretty-card';
      card.style.cursor = 'pointer';
      card.dataset.search = a.name.toLowerCase();
      card.innerHTML = `<div class="sso-pretty-name">${a.name}</div>`;
      card.addEventListener('click', () => window.open(a.href, '_blank'));
      return card;
    });

    panel.appendChild(buildContainer(cards));
  }

  // ---- Main: watch for tab switches ----
  function getAccountsPanel() {
    return document.querySelector('[id$="-accounts-panel"]');
  }

  function getAppsPanel() {
    return document.querySelector('[id$="-applications-panel"]');
  }

  function markPrettified() {
    document.body.classList.add('sso-prettified');
  }

  async function init() {
    const rows = getParentRows();
    if (!rows.length) return false;
    if (document.body.classList.contains('sso-prettified')) return true;

    markPrettified();

    // Handle accounts tab
    const accPanel = getAccountsPanel();
    if (accPanel) await prettifyAccounts(accPanel);

    // Watch for applications tab activation
    const appsTab = document.querySelector('[data-testid="applications"]');
    if (appsTab) {
      appsTab.addEventListener('click', () => {
        // Wait for panel content to render
        setTimeout(() => {
          const appsPanel = getAppsPanel();
          if (appsPanel) prettifyApps(appsPanel);
        }, 1000);
      });
    }

    return true;
  }

  let polls = 0;
  const timer = setInterval(async () => {
    polls++;
    if (await init() || polls >= MAX_POLLS) clearInterval(timer);
  }, POLL_INTERVAL);
})();
