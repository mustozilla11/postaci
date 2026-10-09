// Servis Logoları (SVG)
const ICONS = {
  gmail: `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="#EA4335" d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.272H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L12 9.5l8.073-6.007C21.69 2.279 24 3.434 24 5.457z"/></svg>`,
  outlook: `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="#0078D4" d="M14.5 3h8a1.5 1.5 0 0 1 1.5 1.5v15a1.5 1.5 0 0 1-1.5 1.5h-8v-18zm-2 0H3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h9.5V3zm-5 6.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z"/></svg>`,
  icloud: `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="#34AADC" d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/></svg>`,
  custom: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#a6adc8" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`
};

let currentAccounts = [];
let activeTabId = null;
let contextTargetId = null;

const tabsListEl = document.getElementById('tabs-list');
const emptyStateEl = document.getElementById('empty-state');
const accountModalEl = document.getElementById('account-modal');
const accountFormEl = document.getElementById('account-form');
const btnAddAccount = document.getElementById('btn-add-account');
const btnEmptyAdd = document.getElementById('btn-empty-add');
const btnModalClose = document.getElementById('btn-modal-close');
const btnModalCancel = document.getElementById('btn-modal-cancel');
const groupCustomUrl = document.getElementById('group-custom-url');
const contextMenuEl = document.getElementById('context-menu');
const appBadgeEl = document.getElementById('app-badge');

// Modal servis simgelerini doldur
document.querySelectorAll('.service-svg').forEach(el => {
  const s = el.getAttribute('data-service');
  if (ICONS[s]) el.innerHTML = ICONS[s];
});

// Sürüm bilgisini getir
window.postaciAPI.getAppVersion().then(v => {
  if (v) appBadgeEl.textContent = `v${v}`;
});

function renderTabs() {
  tabsListEl.innerHTML = '';

  if (currentAccounts.length === 0) {
    emptyStateEl.classList.remove('hidden');
    return;
  }

  emptyStateEl.classList.add('hidden');

  currentAccounts.forEach(account => {
    const tabEl = document.createElement('div');
    tabEl.className = `tab-item ${account.id === activeTabId ? 'active' : ''}`;
    tabEl.dataset.id = account.id;

    const iconHtml = ICONS[account.service] || ICONS.custom;
    tabEl.innerHTML = `
      <div class="tab-icon">${iconHtml}</div>
      <span class="tab-title" title="${escapeHtml(account.name)}">${escapeHtml(account.name)}</span>
      <div class="tab-close" title="Sekmeyi Kapat">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </div>
    `;

    // Sekmeye tıklama: Aktif sekme yap
    tabEl.addEventListener('click', (e) => {
      if (e.target.closest('.tab-close')) return;
      selectTab(account.id);
    });

    // Sekme kapat butonu
    const closeBtn = tabEl.querySelector('.tab-close');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeTab(account.id);
    });

    // Sağ tık menüsü (Context Menu)
    tabEl.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showContextMenu(e.clientX, e.clientY, account.id);
    });

    tabsListEl.appendChild(tabEl);
  });
}

async function loadInitialData() {
  const data = await window.postaciAPI.getAccounts();
  currentAccounts = data.accounts || [];
  activeTabId = data.activeAccountId || (currentAccounts[0] ? currentAccounts[0].id : null);
  renderTabs();
}

async function selectTab(id) {
  activeTabId = id;
  renderTabs();
  await window.postaciAPI.switchTab(id);
}

async function closeTab(id) {
  await window.postaciAPI.removeTab(id);
  const data = await window.postaciAPI.getAccounts();
  currentAccounts = data.accounts || [];
  activeTabId = data.activeAccountId;
  renderTabs();
}

function openAddModal() {
  document.getElementById('edit-account-id').value = '';
  document.getElementById('modal-title').textContent = 'Yeni Hesap Ekle';
  document.getElementById('account-name').value = '';
  document.getElementById('account-url').value = '';
  document.querySelector('input[name="service"][value="gmail"]').checked = true;
  groupCustomUrl.style.display = 'none';
  accountModalEl.classList.remove('hidden');
  document.getElementById('account-name').focus();
}

function openEditModal(accountId) {
  const account = currentAccounts.find(a => a.id === accountId);
  if (!account) return;

  document.getElementById('edit-account-id').value = account.id;
  document.getElementById('modal-title').textContent = 'Hesabı Düzenle';
  document.getElementById('account-name').value = account.name;
  
  const radio = document.querySelector(`input[name="service"][value="${account.service}"]`);
  if (radio) radio.checked = true;

  if (account.service === 'custom') {
    groupCustomUrl.style.display = 'block';
    document.getElementById('account-url').value = account.url || '';
  } else {
    groupCustomUrl.style.display = 'none';
    document.getElementById('account-url').value = account.url || '';
  }

  accountModalEl.classList.remove('hidden');
}

function closeModal() {
  accountModalEl.classList.add('hidden');
}

// Servis seçimi değiştiğinde Özel URL input'unu göster/gizle
document.querySelectorAll('input[name="service"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    if (e.target.value === 'custom') {
      groupCustomUrl.style.display = 'block';
      document.getElementById('account-url').setAttribute('required', 'required');
    } else {
      groupCustomUrl.style.display = 'none';
      document.getElementById('account-url').removeAttribute('required');
    }
  });
});

accountFormEl.addEventListener('submit', async (e) => {
  e.preventDefault();
  const editId = document.getElementById('edit-account-id').value;
  const name = document.getElementById('account-name').value.trim();
  const service = document.querySelector('input[name="service"]:checked').value;
  const url = document.getElementById('account-url').value.trim();

  if (editId) {
    // Güncelleme
    await window.postaciAPI.updateTab({ id: editId, name, url: url || undefined });
  } else {
    // Yeni ekleme
    await window.postaciAPI.addTab({ name, service, url: url || undefined });
  }

  closeModal();
  const data = await window.postaciAPI.getAccounts();
  currentAccounts = data.accounts || [];
  activeTabId = data.activeAccountId;
  renderTabs();
});

// Sağ Tık Menüsü Kontrolleri
function showContextMenu(x, y, accountId) {
  contextTargetId = accountId;
  contextMenuEl.style.left = `${x}px`;
  contextMenuEl.style.top = `${y}px`;
  contextMenuEl.classList.remove('hidden');
}

function hideContextMenu() {
  contextMenuEl.classList.add('hidden');
  contextTargetId = null;
}

window.addEventListener('click', () => hideContextMenu());
window.addEventListener('contextmenu', (e) => {
  if (!e.target.closest('.tab-item')) {
    hideContextMenu();
  }
});

document.getElementById('ctx-reload').addEventListener('click', () => {
  if (contextTargetId) window.postaciAPI.reloadTab(contextTargetId);
  hideContextMenu();
});

document.getElementById('ctx-edit').addEventListener('click', () => {
  if (contextTargetId) openEditModal(contextTargetId);
  hideContextMenu();
});

document.getElementById('ctx-close').addEventListener('click', () => {
  if (contextTargetId) closeTab(contextTargetId);
  hideContextMenu();
});

// Event Listeners
btnAddAccount.addEventListener('click', openAddModal);
btnEmptyAdd.addEventListener('click', openAddModal);
btnModalClose.addEventListener('click', closeModal);
btnModalCancel.addEventListener('click', closeModal);

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Başlat
loadInitialData();
