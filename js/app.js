/* ===================================================
   APP — Módulo Principal
   Router SPA, inicialização, modais, toasts, configurações
   =================================================== */

const App = {
  // Mapeamento de páginas para módulos
  routes: {
    'dashboard': { module: DashboardModule, title: 'Dashboard', icon: 'dashboard' },
    'vale-alimentacao': { module: VAModule, title: 'Vale Alimentação', icon: 'food' },
    'vale-transporte': { module: VTModule, title: 'Vale Transporte', icon: 'bus' },
    'farmacia': { module: FarmaciaModule, title: 'Farmácia', icon: 'farmacia' },
    'funcionarios': { module: FuncionariosModule, title: 'Funcionários', icon: 'users' },
    'recibos': { module: RecibosModule, title: 'Recibos', icon: 'download' },
    'configuracoes': { module: null, title: 'Configurações', icon: 'settings' },
  },

  currentModule: null,

  /* ========== INICIALIZAÇÃO ========== */

  init() {
    // Carrega configurações salvas
    AppState.loadConfig();

    // Aplica tema
    this._applyTheme();

    // Inicia data e hora do cabeçalho
    this._startHeaderClock();

    // Popula seletores de período
    this._initPeriodSelectors();

    // Bind dos eventos globais
    this._bindGlobalEvents();

    // Injeta ícones no sidebar (os template literals no HTML precisam disso)
    this._injectSidebarIcons();

    // Verifica se está configurado
    if (AppState.isConfigured()) {
      this._loadDataAndNavigate();
    } else {
      this.navigateTo('configuracoes');
    }
  },

  _startHeaderClock() {
    const updateDateTime = () => {
      const el = document.getElementById('datetime-display');
      if (!el) return;
      try {
        const formatter = new Intl.DateTimeFormat('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          day: 'numeric',
          month: 'long',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        const parts = formatter.formatToParts(new Date());
        const day = parts.find(p => p.type === 'day').value;
        const month = parts.find(p => p.type === 'month').value;
        const hour = parts.find(p => p.type === 'hour').value;
        const minute = parts.find(p => p.type === 'minute').value;
        
        el.textContent = `${day} de ${month} • ${hour}:${minute}`;
      } catch (e) {
        console.error(e);
      }
    };
    
    updateDateTime();
    setInterval(updateDateTime, 1000);
  },

  _injectSidebarIcons() {
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      const page = item.dataset.page;
      const route = this.routes[page];
      if (route) {
        const iconSpan = item.querySelector('.nav-icon');
        if (iconSpan && ICONS[route.icon]) {
          iconSpan.innerHTML = ICONS[route.icon];
        }
      }
    });

    // Ícones do topbar
    const syncIcon = document.querySelector('#btn-sync .nav-icon');
    if (syncIcon) syncIcon.innerHTML = ICONS.sync;

    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) themeIcon.innerHTML = AppState.config.theme === 'dark' ? ICONS.moon : ICONS.sun;

    const calendarIcon = document.querySelector('#period-selector .nav-icon');
    if (calendarIcon) calendarIcon.innerHTML = ICONS.calendar;

    const modalClose = document.querySelector('#modal-close .nav-icon');
    if (modalClose) modalClose.innerHTML = ICONS.x;
  },

  async _loadDataAndNavigate() {
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = `
      <div class="loading-overlay">
        <div class="spinner"></div>
        <p>Carregando dados das planilhas...</p>
      </div>
    `;

    try {
      await SheetsAPI.loadAllData();
      this._updateConnectionStatus(true);
      this._updateBadges();

      // Navega para a página baseada no hash ou dashboard
      const hash = window.location.hash.replace('#', '') || 'dashboard';
      this.navigateTo(hash);
    } catch (error) {
      this._updateConnectionStatus(false);
      contentArea.innerHTML = `
        <div class="loading-overlay">
          <div style="font-size:48px;margin-bottom:16px;">⚠️</div>
          <h3 style="color:var(--text-primary);margin-bottom:8px;">Erro ao conectar</h3>
          <p style="color:var(--text-muted);max-width:400px;text-align:center;margin-bottom:24px;">
            ${error.message}
          </p>
          <div style="display:flex;gap:12px;">
            <button class="btn btn-primary" onclick="App._loadDataAndNavigate()">Tentar Novamente</button>
            <button class="btn btn-outline" onclick="App.navigateTo('configuracoes')">Configurações</button>
          </div>
        </div>
      `;
    }
  },

  /* ========== NAVEGAÇÃO / ROUTER ========== */

  navigateTo(page) {
    if (!this.routes[page]) page = 'dashboard';

    // Cleanup do módulo anterior
    if (this.currentModule && this.currentModule.destroy) {
      this.currentModule.destroy();
    }

    AppState.currentPage = page;
    window.location.hash = page;

    // Atualiza sidebar
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    // Atualiza título
    const route = this.routes[page];
    document.getElementById('page-title').textContent = route.title;

    // Renderiza conteúdo
    const contentArea = document.getElementById('content-area');

    if (page === 'dashboard') {
      contentArea.style.padding = '0';
    } else {
      contentArea.style.padding = '';
    }

    if (page === 'configuracoes') {
      this._renderSettings(contentArea);
      this.currentModule = null;
      return;
    }

    if (route.module) {
      this.currentModule = route.module;

      // Scroll para o topo
      contentArea.scrollTop = 0;

      // Renderiza e configura eventos
      route.module.render(contentArea);
      route.module.setupEvents();
    }
  },

  /* ========== PERÍODO ========== */

  _initPeriodSelectors() {
    const monthSelect = document.getElementById('period-month');
    const yearSelect = document.getElementById('period-year');

    if (monthSelect) {
      CONFIG.MONTHS.forEach((name, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = name;
        opt.selected = i === AppState.config.selectedMonth;
        monthSelect.appendChild(opt);
      });
    }

    if (yearSelect) {
      const currentYear = new Date().getFullYear();
      for (let y = currentYear - 2; y <= currentYear + 2; y++) {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        opt.selected = y === AppState.config.selectedYear;
        yearSelect.appendChild(opt);
      }
    }
  },

  async _handlePeriodChange() {
    const month = parseInt(document.getElementById('period-month').value);
    const year = parseInt(document.getElementById('period-year').value);

    AppState.config.selectedMonth = month;
    AppState.config.selectedYear = year;
    AppState.saveConfig();

    const dates = Utils.formatDate(month, year);
    const emission = Utils.formatEmissionDate(month, year);

    // Atualiza período nas planilhas (se Apps Script configurado)
    try {
      if (AppState.config.scriptUrl || AppState.config.vaScriptUrl) {
        await SheetsAPI.updateVAPeriod(dates.start, dates.end, emission);
        await SheetsAPI.updateVTPeriod(dates.start, dates.end, emission);
      }
      this.toast(`Período atualizado: ${CONFIG.MONTHS[month]} ${year}`, 'success');

      // Recarrega dados
      await SheetsAPI.loadAllData();
      this.navigateTo(AppState.currentPage);
    } catch (error) {
      this.toast('Erro ao atualizar período: ' + error.message, 'warning');
    }
  },

  /* ========== EVENTOS GLOBAIS ========== */

  _bindGlobalEvents() {
    // Navegação por hash
    window.addEventListener('hashchange', () => {
      const page = window.location.hash.replace('#', '') || 'dashboard';
      if (page !== AppState.currentPage) {
        this.navigateTo(page);
      }
    });

    // Sidebar navigation clicks
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigateTo(item.dataset.page);
      });
    });

    // Botão Sincronizar
    document.getElementById('btn-sync').addEventListener('click', () => this._handleSync());

    // Botão Tema
    document.getElementById('btn-theme').addEventListener('click', () => this._toggleTheme());

    // Período
    document.getElementById('period-month')?.addEventListener('change', () => this._handlePeriodChange());
    document.getElementById('period-year')?.addEventListener('change', () => this._handlePeriodChange());

    // Modal close
    document.getElementById('modal-backdrop').addEventListener('click', () => this.closeModal());
    document.getElementById('modal-close').addEventListener('click', () => this.closeModal());

    // Esc para fechar modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeModal();
    });

    // Animação da logo (coração)
    const headerLogo = document.getElementById('header-logo');
    if (headerLogo) {
      headerLogo.addEventListener('click', () => {
        headerLogo.classList.remove('pulse-animation');
        // Force reflow
        void headerLogo.offsetWidth;
        headerLogo.classList.add('pulse-animation');
      });
    }
  },

  async _handleSync() {
    const syncBtn = document.getElementById('btn-sync');
    syncBtn.classList.add('syncing');

    try {
      await SheetsAPI.loadAllData();
      this._updateConnectionStatus(true);
      this._updateBadges();
      this.navigateTo(AppState.currentPage);
      this.toast('Dados sincronizados com sucesso!', 'success');
    } catch (error) {
      this._updateConnectionStatus(false);
      this.toast('Erro na sincronização: ' + error.message, 'error');
    } finally {
      syncBtn.classList.remove('syncing');
    }
  },

  /* ========== TEMA ========== */

  _applyTheme() {
    const theme = AppState.config.theme || 'dark';
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  },

  _toggleTheme() {
    AppState.config.theme = AppState.config.theme === 'dark' ? 'light' : 'dark';
    AppState.saveConfig();
    this._applyTheme();

    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
      themeIcon.innerHTML = AppState.config.theme === 'dark' ? ICONS.moon : ICONS.sun;
    }
  },

  /* ========== STATUS DE CONEXÃO ========== */

  _updateConnectionStatus(connected) {
    AppState.connected = connected;
    const dot = document.getElementById('connection-dot');
    const text = document.getElementById('connection-text');

    if (dot) {
      dot.className = `connection-dot ${connected ? 'online' : 'offline'}`;
    }
    if (text) {
      text.textContent = connected ? 'Conectado' : 'Desconectado';
    }
  },

  _updateBadges() {
    const badgeVA = document.getElementById('badge-va');
    const badgeVT = document.getElementById('badge-vt');
    if (badgeVA) badgeVA.textContent = AppState.vaData.length;
    if (badgeVT) badgeVT.textContent = AppState.vtData.length;
  },

  /* ========== MODAIS ========== */

  showModal(title, bodyHtml, buttons = []) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHtml;

    const footer = document.getElementById('modal-footer');
    footer.innerHTML = '';
    buttons.forEach(btn => {
      const el = document.createElement('button');
      el.className = btn.class || 'btn btn-primary';
      if (btn.style) el.setAttribute('style', btn.style);
      el.innerHTML = btn.label;
      el.addEventListener('click', btn.action);
      footer.appendChild(el);
    });

    document.getElementById('modal-backdrop').classList.add('show');
    document.getElementById('modal').classList.add('show');

    // Focus no primeiro input
    setTimeout(() => {
      const firstInput = document.querySelector('#modal-body input');
      if (firstInput) firstInput.focus();
    }, 200);
  },

  closeModal() {
    document.getElementById('modal-backdrop').classList.remove('show');
    const modal = document.getElementById('modal');
    modal.classList.remove('show');
    // Remove variantes de tamanho para não afetar próximos modais
    modal.classList.remove('modal-lg');
  },

  /* ========== TOASTS ========== */

  toast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');

    const iconMap = {
      success: ICONS.check,
      error: ICONS.alert,
      warning: ICONS.alert,
      info: ICONS.info,
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${iconMap[type] || iconMap.info}</span>
      <span class="toast-message">${message}</span>
      <span class="toast-close" onclick="this.parentElement.classList.add('leaving');setTimeout(()=>this.parentElement.remove(),300);">
        ${ICONS.x}
      </span>
    `;

    container.appendChild(toast);

    // Auto-remove
    setTimeout(() => {
      if (toast.parentElement) {
        toast.classList.add('leaving');
        setTimeout(() => toast.remove(), 300);
      }
    }, duration);
  },

  /* ========== CONFIGURAÇÕES ========== */

  _renderSettings(container) {
    container.innerHTML = `
      <div class="settings-grid">
        <!-- Conectividade -->
        <div class="settings-section" style="grid-row: span 2;">
          <h3><span class="nav-icon">${ICONS.key || ''}</span> Conectividade</h3>
          <div class="form-group">
            <label class="form-label">Chave de API (Sheets API v4)</label>
            <input type="text" class="form-input" id="cfg-api-key" placeholder="AIzaSy..." value="${Utils.escapeHtml(AppState.config.apiKey)}">
          </div>
          <div class="form-group">
            <label class="form-label">Link ou ID da Planilha Unificada (VA e VT)</label>
            <input type="text" class="form-input" id="cfg-spreadsheet" placeholder="URL completa ou ID da planilha" value="${Utils.escapeHtml(AppState.config.spreadsheetId || AppState.config.vaSpreadsheetId || '')}">
          </div>
          <div class="form-group">
            <label class="form-label">Link do Google Apps Script (Proxy)</label>
            <input type="text" class="form-input" id="cfg-script" placeholder="URL do Web App" value="${Utils.escapeHtml(AppState.config.scriptUrl || AppState.config.vaScriptUrl || '')}">
          </div>
          <div style="display:flex;gap:12px;margin-top:24px;">
            <button class="btn btn-primary" id="cfg-save-btn">
              ${ICONS.save || ''} Salvar Configurações
            </button>
            <button class="btn btn-outline" id="cfg-test-btn">
              ${ICONS.sync || ''} Testar Conexão
            </button>
          </div>
          <div id="cfg-test-result" style="margin-top:16px;"></div>
        </div>

        <!-- Valores Padrão -->
        <div class="settings-section" style="grid-row: span 2;">
          <h3><span class="nav-icon">${ICONS.dollar || ''}</span> Valores e Quantidades Padrão</h3>
          <div style="display:flex; gap:12px;">
            <div class="form-group" style="flex:1;">
              <label class="form-label">Valor Unitário VA (R$)</label>
              <input type="number" class="form-input" id="cfg-va-unit" step="0.01" value="${Utils.escapeHtml((AppState.config.vaUnitValue || '').toString())}">
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">Quantidade VA Padrão</label>
              <input type="number" class="form-input" id="cfg-va-qty" step="1" value="${Utils.escapeHtml((AppState.config.vaQuantity || '').toString())}">
            </div>
          </div>
          <div style="display:flex; gap:12px;">
            <div class="form-group" style="flex:1;">
              <label class="form-label">Valor VT - Londrina (R$)</label>
              <input type="number" class="form-input" id="cfg-vt-londrina-unit" step="0.01" value="${Utils.escapeHtml((AppState.config.vtLondrinaUnitValue || '').toString())}">
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">Quantidade VT Padrão</label>
              <input type="number" class="form-input" id="cfg-vt-qty" step="1" value="${Utils.escapeHtml((AppState.config.vtQuantity || '').toString())}">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Valor VT - Cambé (R$)</label>
            <input type="number" class="form-input" id="cfg-vt-cambe-unit" step="0.01" value="${Utils.escapeHtml((AppState.config.vtCambeUnitValue || '').toString())}">
          </div>
        </div>

        <!-- Aparência -->
        <div class="settings-section">
          <h3><span class="nav-icon">${ICONS.moon}</span> Aparência</h3>
          <div class="theme-toggle">
            <span style="font-size:13px;color:var(--text-secondary);">Tema Escuro</span>
            <div class="toggle-switch ${AppState.config.theme === 'dark' ? 'active' : ''}" id="cfg-theme-toggle"></div>
          </div>
          <div style="margin-top:20px;">
            ${this._getDailyVerse()}
          </div>
        </div>

        <!-- Informações -->
        <div class="settings-section">
          <h3><span class="nav-icon">${ICONS.info}</span> Informações</h3>
          <div style="font-size:13px;color:var(--text-secondary);display:flex;flex-direction:column;gap:8px;">
            <div><strong>Empresa:</strong> ${CONFIG.COMPANY.name}</div>
            <div><strong>CNPJ:</strong> ${CONFIG.COMPANY.cnpj}</div>
            <div><strong>Cidade:</strong> ${CONFIG.COMPANY.city}</div>
            <div><strong>Telefone:</strong> ${CONFIG.COMPANY.phone}</div>
            <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border-subtle);">
              <strong>Planilha Unificada (VA e VT):</strong><br>
              <a href="https://docs.google.com/spreadsheets/d/${AppState.config.spreadsheetId || CONFIG.SPREADSHEET_ID}" target="_blank" style="color:var(--va-400);font-size:12px;" id="link-sheet">Abrir no Google Sheets ↗</a>
            </div>
          </div>
        </div>
      </div>
    `;

    // Bind eventos de configurações
    this._bindSettingsEvents();
  },

  _bindSettingsEvents() {
    // Toggle tema
    document.getElementById('cfg-theme-toggle')?.addEventListener('click', (e) => {
      e.currentTarget.classList.toggle('active');
      this._toggleTheme();
    });

    // Salvar Configurações
    document.getElementById('cfg-save-btn')?.addEventListener('click', async () => {
      const apiKey = document.getElementById('cfg-api-key').value.trim();
      const spreadsheetUrl = document.getElementById('cfg-spreadsheet').value.trim();
      const scriptUrl = document.getElementById('cfg-script').value.trim();

      const vaUnit = parseFloat(document.getElementById('cfg-va-unit').value);
      const vtLondrina = parseFloat(document.getElementById('cfg-vt-londrina-unit').value);
      const vtCambe = parseFloat(document.getElementById('cfg-vt-cambe-unit').value);
      const vaQty = parseInt(document.getElementById('cfg-va-qty').value);
      const vtQty = parseInt(document.getElementById('cfg-vt-qty').value);

      if (!apiKey) {
        this.toast('Informe a chave de API', 'error');
        return;
      }
      if (!spreadsheetUrl) {
        this.toast('Informe o link ou ID da Planilha Unificada', 'error');
        return;
      }

      if (isNaN(vaUnit) || vaUnit < 0) {
        this.toast('Informe um valor unitário válido para o Vale Alimentação', 'error');
        return;
      }
      if (isNaN(vtLondrina) || vtLondrina < 0) {
        this.toast('Informe um valor unitário válido para o Vale Transporte Londrina', 'error');
        return;
      }
      if (isNaN(vtCambe) || vtCambe < 0) {
        this.toast('Informe um valor unitário válido para o Vale Transporte Cambé', 'error');
        return;
      }
      if (isNaN(vaQty) || vaQty < 1) {
        this.toast('Informe uma quantidade válida para o Vale Alimentação', 'error');
        return;
      }
      if (isNaN(vtQty) || vtQty < 1) {
        this.toast('Informe uma quantidade válida para o Vale Transporte', 'error');
        return;
      }

      AppState.config.apiKey = apiKey;
      AppState.config.spreadsheetId = AppState._extractId(spreadsheetUrl);
      AppState.config.scriptUrl = scriptUrl;
      
      AppState.config.vaUnitValue = vaUnit;
      AppState.config.vtLondrinaUnitValue = vtLondrina;
      AppState.config.vtCambeUnitValue = vtCambe;
      AppState.config.vaQuantity = vaQty;
      AppState.config.vtQuantity = vtQty;
      
      AppState.saveConfig();

      this.toast('Configurações salvas com sucesso!', 'success');

      // Atualiza os links de visualização na seção Informações
      const sheetLink = document.getElementById('link-sheet');
      if (sheetLink) sheetLink.href = `https://docs.google.com/spreadsheets/d/${CONFIG.SPREADSHEET_ID}`;

      // Recarrega todos os dados e redireciona
      try {
        await this._loadDataAndNavigate();
      } catch (error) {
        this.toast('Erro ao carregar novos dados: ' + error.message, 'warning');
      }
    });

    // Testar Conexão
    document.getElementById('cfg-test-btn')?.addEventListener('click', async () => {
      const apiKey = document.getElementById('cfg-api-key').value.trim();
      const spreadsheetUrl = document.getElementById('cfg-spreadsheet').value.trim();

      if (!apiKey || !spreadsheetUrl) {
        this.toast('Preencha a chave de API e a Planilha Unificada para testar', 'warning');
        return;
      }

      const resultDiv = document.getElementById('cfg-test-result');
      if (resultDiv) {
        resultDiv.className = 'connection-test';
        resultDiv.innerHTML = `<span class="spinner" style="width:14px;height:14px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:8px;"></span> Testando conexão...`;
      }

      // Temporariamente ajusta CONFIG para testar
      const originalApiKey = CONFIG.API_KEY;
      const originalSpreadsheetId = CONFIG.SPREADSHEET_ID;
      
      CONFIG.API_KEY = apiKey;
      CONFIG.SPREADSHEET_ID = AppState._extractId(spreadsheetUrl);

      const res = await SheetsAPI.testConnection();

      // Restaura valores originais
      CONFIG.API_KEY = originalApiKey;
      CONFIG.SPREADSHEET_ID = originalSpreadsheetId;

      if (resultDiv) {
        if (res.success) {
          resultDiv.className = 'connection-test success';
          resultDiv.textContent = '✅ Conexão estabelecida com sucesso!';
        } else {
          resultDiv.className = 'connection-test error';
          resultDiv.textContent = '❌ Falha na conexão: ' + res.message;
        }
      }
    });
  },

  _getDailyVerse() {
    const verses = [
      "Não fui eu que ordenei a você? Seja forte e corajoso! Não se apavore nem desanime, pois o Senhor, o seu Deus, estará com você por onde você andar. — Josué 1:9",
      "Espere no Senhor. Seja forte! Coragem! Espere no Senhor. — Salmos 27:14",
      "Sejam fortes e corajosos, todos vocês que esperam no Senhor! — Salmos 31:24",
      "Por isso não tema, pois estou com você; não tenha medo, pois sou o seu Deus. Eu o fortalecerei e o ajudarei. — Isaías 41:10",
      "Neste mundo vocês terão aflições; contudo, tenham ânimo! Eu venci o mundo. — João 16:33",
      "Tudo posso naquele que me fortalece. — Filipenses 4:13",
      "O choro pode persistir uma noite, mas de manhã irrompe a alegria. — Salmos 30:5",
      "Sabemos que Deus age em todas as coisas para o bem daqueles que o amam. — Romanos 8:28",
      "Porque sou eu que conheço os planos que tenho para vocês... planos de dar a vocês esperança e um futuro. — Jeremias 29:11",
      "Venham a mim, todos os que estão cansados e sobrecarregados, e eu darei descanso a vocês. — Mateus 11:28",
      "Pois Deus não nos deu espírito de covardia, mas de poder, de amor e de equilíbrio. — 2 Timóteo 1:7",
      "Deus é o nosso refúgio e a nossa fortaleza, auxílio sempre presente na adversidade. — Salmos 46:1",
      "Não andem ansiosos por coisa alguma, mas em tudo, pela oração e súplicas... apresentem seus pedidos a Deus. — Filipenses 4:6",
      "Por isso, não abram mão da confiança que vocês têm; ela será ricamente recompensada. — Hebreus 10:35",
      "Alegrem-se na esperança, sejam pacientes na tribulação, perseverem na oração. — Romanos 12:12",
      "Mesmo quando eu andar por um vale de trevas e morte, não temerei perigo algum, pois tu estás comigo. — Salmos 23:4",
      "Estejam vigilantes, mantenham-se firmes na fé, sejam homens de coragem, sejam fortes. — 1 Coríntios 16:13",
      "Confie no Senhor de todo o seu coração e não se apoie em seu próprio entendimento. — Provérbios 3:5",
      "O meu socorro vem do Senhor, que fez os céus e a terra. — Salmos 121:2",
      "E não nos cansemos de fazer o bem, pois no tempo próprio colheremos, se não desanimarmos. — Gálatas 6:9",
      "Não se entristeçam, porque a alegria do Senhor é a força de vocês. — Neemias 8:10",
      "Mas vocês devem ser fortes e não desanimar, pois o trabalho de vocês será recompensado. — 2 Crônicas 15:7",
      "Sejam fortes e corajosos... o Senhor, o seu Deus, vai com vocês; nunca os deixará, nunca os abandonará. — Deuteronômio 31:6",
      "Mas aqueles que esperam no Senhor renovam as suas forças. Voam alto como águias. — Isaías 40:31",
      "Mas, em todas estas coisas somos mais que vencedores, por meio daquele que nos amou. — Romanos 8:37",
      "Entregue o seu caminho ao Senhor; confie nele, e ele agirá. — Salmos 37:5",
      "Este é o dia em que o Senhor agiu; alegremo-nos e exultemos neste dia. — Salmos 118:24",
      "As misericórdias do Senhor renovam-se cada manhã; grande é a tua fidelidade! — Lamentações 3:22-23",
      "Portanto, não se preocupem com o amanhã, pois o amanhã trará as suas próprias preocupações. — Mateus 6:34",
      "Que o Deus da esperança os encha de toda alegria e paz, por sua confiança nele. — Romanos 15:13",
      "O coração alegre é bom remédio, mas o espírito abatido faz secar os ossos. — Provérbios 17:22",
      "Tu me farás conhecer a vereda da vida, a alegria plena da tua presença. — Salmos 16:11",
      "O Senhor, o seu Deus, está em seu meio, poderoso para salvar. Ele se regozijará em você. — Sofonias 3:17",
      "O Senhor é refúgio para os oprimidos, uma torre segura na hora da adversidade. — Salmos 9:9",
      "Considerem motivo de grande alegria o fato de passarem por diversas provações, pois a prova da sua fé produz perseverança. — Tiago 1:2-3",
      "No amor não há medo; pelo contrário o perfeito amor expulsa o medo. — 1 João 4:18",
      "O Senhor é a minha luz e a minha salvação; de quem terei temor? — Salmos 27:1",
      "Provem, e vejam como o Senhor é bom. Como é feliz o homem que nele se refugia! — Salmos 34:8",
      "Tudo o que vocês pedirem em oração, creiam que já o receberam, e assim sucederá. — Marcos 11:24",
      "Ora, a fé é a certeza daquilo que esperamos e a prova das coisas que não vemos. — Hebreus 11:1",
      "A tribulação produz perseverança; a perseverança, um caráter aprovado; e o caráter aprovado, esperança. — Romanos 5:3-4",
      "Aqueles que semeiam com lágrimas, com cantos de alegria colherão. — Salmos 126:5",
      "Àquele que é capaz de fazer infinitamente mais do que tudo o que pedimos ou pensamos... — Efésios 3:20",
      "Tu, Senhor, guardarás em perfeita paz aquele cujo propósito é firme, porque em ti confia. — Isaías 26:3",
      "O Senhor firma os passos de um homem... ainda que tropece, não cairá, pois o Senhor o toma pela mão. — Salmos 37:23-24",
      "Estou convencido de que aquele que começou boa obra em vocês, vai completá-la. — Filipenses 1:6",
      "Deixo a paz a vocês... Não perturbe o seu coração, nem tenham medo. — João 14:27",
      "A tua palavra é lâmpada que ilumina os meus passos e luz que clareia o meu caminho. — Salmos 119:105",
      "Lancem sobre ele toda a sua ansiedade, porque ele tem cuidado de vocês. — 1 Pedro 5:7",
      "Os justos clamam, o Senhor os ouve e os livra de todas as suas tribulações. — Salmos 34:17",
      "Para o homem é impossível, mas para Deus todas as coisas são possíveis. — Mateus 19:26",
      "Pois nada é impossível para Deus. — Lucas 1:37",
      "Aproximemo-nos do trono da graça com toda a confiança, a fim de recebermos misericórdia. — Hebreus 4:16",
      "Tu és o meu refúgio e a minha fortaleza, o meu Deus, em quem confio. — Salmos 91:2",
      "Sei que podes fazer todas as coisas; nenhum dos teus planos pode ser frustrado. — Jó 42:2",
      "Ponha a sua esperança em Deus! Pois ainda o louvarei; ele é o meu Salvador. — Salmos 42:11",
      "O Deus que concede perseverança e ânimo dê a vocês um espírito de unidade. — Romanos 15:5",
      "Mas o Senhor é fiel; ele os fortalecerá e os guardará do Maligno. — 2 Tessalonicenses 3:3",
      "Busquem o Senhor e o seu poder; busquem sempre a sua presença. — 1 Crônicas 16:11",
      "Feliz é o homem que persevera na provação, porque depois de aprovado receberá a coroa da vida. — Tiago 1:12"
    ];
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    const raw = verses[dayOfYear % verses.length];

    // Separa o texto do versículo e a referência/capítulo
    const parts = raw.split(/\s*—\s*/);
    const text = parts[0] ? parts[0].trim() : raw;
    const ref = parts[1] ? parts[1].trim() : '';

    if (ref) {
      return `
        <div class="daily-verse-box" style="display:flex; flex-direction:column; gap:6px;">
          <div class="verse-text" style="color:var(--text-secondary); font-size:13.5px; line-height:1.5;">${Utils.escapeHtml(text)}</div>
          <div class="verse-ref" style="color:var(--text-muted); font-size:12.5px; font-weight:600;">— ${Utils.escapeHtml(ref)}</div>
        </div>
      `;
    }
    return `<div class="verse-text" style="color:var(--text-secondary); font-size:13.5px; line-height:1.5;">${Utils.escapeHtml(text)}</div>`;
  }
};

/* ========== BOOT ========== */
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
