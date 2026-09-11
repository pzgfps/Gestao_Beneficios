/* ===================================================
   RECIBOS MODULE
   Geração de recibos de consentimento para VA e VT
   Modelos distintos conforme a planilha original
   =================================================== */

const RecibosModule = {
  activeTab: 'va', // 'va', 'vt', 'va_vt', 'farmacia' ou 'estagiario'

  /* === Chave localStorage para período dos estagiários === */
  _ESTAG_KEY: 'recibos_estag_period',

  _loadEstagDates() {
    const parseToISO = (dateStr) => {
      if (!dateStr) return '';
      if (dateStr.includes('-')) return dateStr;
      const parts = dateStr.split('/');
      if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
      return '';
    };

    try {
      const saved = JSON.parse(localStorage.getItem(this._ESTAG_KEY) || '{}');
      if (saved.periodStart) this.estagPeriodStart = saved.periodStart;
      if (saved.periodEnd)   this.estagPeriodEnd   = saved.periodEnd;
      if (saved.emissionDate) this.estagEmissionDate = saved.emissionDate;
    } catch { /* ignora erros de parse */ }

    // Ao iniciar o sistema, se ainda não houver salvo localmente, usa as datas de VA da planilha como padrão
    if (!this.estagPeriodStart && AppState.vaHeader?.periodStart) {
      this.estagPeriodStart = parseToISO(AppState.vaHeader.periodStart);
    }
    if (!this.estagPeriodEnd && AppState.vaHeader?.periodEnd) {
      this.estagPeriodEnd = parseToISO(AppState.vaHeader.periodEnd);
    }
    if (!this.estagEmissionDate && AppState.vaHeader?.emissionDate) {
      this.estagEmissionDate = AppState.vaHeader.emissionDate;
    }
  },

  _saveEstagDates() {
    try {
      localStorage.setItem(this._ESTAG_KEY, JSON.stringify({
        periodStart:  this.estagPeriodStart  || '',
        periodEnd:    this.estagPeriodEnd    || '',
        emissionDate: this.estagEmissionDate || '',
      }));
    } catch { /* ignora erros de quota */ }
  },

  /* === Controle de recibos baixados === */
  _storageKey() {
    // 'estagiario' compartilha o mesmo storage do 'va_vt' pois são subconjuntos
    const key = this.activeTab === 'estagiario' ? 'estagiario' : this.activeTab;
    return `recibos_downloaded_${key}`;
  },

  _getDownloaded() {
    try {
      return JSON.parse(localStorage.getItem(this._storageKey()) || '{}');
    } catch { return {}; }
  },

  _getEmployeeKey(emp) {
    if (!emp) return '';
    const cleanCpf = emp.cpf ? emp.cpf.replace(/\D/g, '') : '';
    return cleanCpf || `ROW_${emp.rowIndex}`;
  },

  _markDownloaded(employees) {
    const map = this._getDownloaded();
    const now = new Date().toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    employees.forEach(emp => {
      const key = this._getEmployeeKey(emp);
      if (key) {
        map[key] = now;
      }
    });
    localStorage.setItem(this._storageKey(), JSON.stringify(map));
  },

  _clearDownloaded() {
    localStorage.removeItem(this._storageKey());
  },

  _renderVAPeriodBar(vaPStart, vaPEnd, vaEmission) {
    return `
      <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap; padding:8px 12px; background:rgba(255,255,255,0.03); border-radius:var(--radius-md); border:1px solid var(--va-600);">
        <span style="font-size:11px; font-weight:600; color:var(--va-400); text-transform:uppercase; letter-spacing:0.5px; white-space:nowrap;">Período VA</span>
        <div style="display:flex; align-items:center; gap:4px;">
          <label style="font-size:12px; color:var(--text-secondary); white-space:nowrap;">De:</label>
          <input type="date" id="recibos-va-p-start" class="form-control" value="${vaPStart}" style="padding:4px 8px; font-size:12px; height:28px; background-color:var(--bg-input); border:1px solid var(--border-default); border-radius:var(--radius-sm); color:var(--text-primary); outline:none;">
        </div>
        <div style="display:flex; align-items:center; gap:4px;">
          <label style="font-size:12px; color:var(--text-secondary); white-space:nowrap;">Até:</label>
          <input type="date" id="recibos-va-p-end" class="form-control" value="${vaPEnd}" style="padding:4px 8px; font-size:12px; height:28px; background-color:var(--bg-input); border:1px solid var(--border-default); border-radius:var(--radius-sm); color:var(--text-primary); outline:none;">
        </div>
        <div style="display:flex; align-items:center; gap:4px;">
          <label style="font-size:12px; color:var(--text-secondary); white-space:nowrap;">Emissão:</label>
          <input type="text" id="recibos-va-e-date" class="form-control" value="${vaEmission}" style="padding:4px 8px; font-size:12px; height:28px; width:360px; min-width:260px; background-color:var(--bg-input); border:1px solid var(--border-default); border-radius:var(--radius-sm); color:var(--text-primary); outline:none;">
        </div>
        <button class="btn btn-outline btn-sm" id="recibos-save-va-dates" style="height:28px; display:inline-flex; align-items:center; padding:0 16px; flex-shrink:0; border-color:var(--va-600); color:var(--va-400);">
          Salvar
        </button>
      </div>
    `;
  },

  _renderVTPeriodBar(vtPStart, vtPEnd, vtEmission) {
    return `
      <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap; padding:8px 12px; background:rgba(255,255,255,0.03); border-radius:var(--radius-md); border:1px solid rgba(203, 213, 225, 0.35);">
        <span style="font-size:11px; font-weight:600; color:#cbd5e1; text-transform:uppercase; letter-spacing:0.5px; white-space:nowrap;">Período VT</span>
        <div style="display:flex; align-items:center; gap:4px;">
          <label style="font-size:12px; color:var(--text-secondary); white-space:nowrap;">De:</label>
          <input type="date" id="recibos-vt-p-start" class="form-control" value="${vtPStart}" style="padding:4px 8px; font-size:12px; height:28px; background-color:var(--bg-input); border:1px solid var(--border-default); border-radius:var(--radius-sm); color:var(--text-primary); outline:none;">
        </div>
        <div style="display:flex; align-items:center; gap:4px;">
          <label style="font-size:12px; color:var(--text-secondary); white-space:nowrap;">Até:</label>
          <input type="date" id="recibos-vt-p-end" class="form-control" value="${vtPEnd}" style="padding:4px 8px; font-size:12px; height:28px; background-color:var(--bg-input); border:1px solid var(--border-default); border-radius:var(--radius-sm); color:var(--text-primary); outline:none;">
        </div>
        <div style="display:flex; align-items:center; gap:4px;">
          <label style="font-size:12px; color:var(--text-secondary); white-space:nowrap;">Emissão:</label>
          <input type="text" id="recibos-vt-e-date" class="form-control" value="${vtEmission}" style="padding:4px 8px; font-size:12px; height:28px; width:360px; min-width:260px; background-color:var(--bg-input); border:1px solid var(--border-default); border-radius:var(--radius-sm); color:var(--text-primary); outline:none;">
        </div>
        <button class="btn btn-outline btn-sm" id="recibos-save-vt-dates" style="height:28px; display:inline-flex; align-items:center; padding:0 16px; flex-shrink:0; border-color:rgba(203, 213, 225, 0.35); color:#cbd5e1;">
          Salvar
        </button>
      </div>
    `;
  },

  render(container) {
    // Carrega datas dos estagiários salvas localmente (sobrevive ao F5)
    this._loadEstagDates();

    const parseToISO = (dateStr) => {
      if (!dateStr) return '';
      if (dateStr.includes('-')) return dateStr;
      const parts = dateStr.split('/');
      if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
      return '';
    };

    const initialVAPStart = this.vaPeriodStart || parseToISO(AppState.vaHeader?.periodStart);
    const initialVAPEnd = this.vaPeriodEnd || parseToISO(AppState.vaHeader?.periodEnd);
    const initialVAEmission = this.vaEmissionDate || AppState.vaHeader?.emissionDate || '';

    const initialVTPStart = this.vtPeriodStart || parseToISO(AppState.vtHeader?.periodStart);
    const initialVTPEnd = this.vtPeriodEnd || parseToISO(AppState.vtHeader?.periodEnd);
    const initialVTEmission = this.vtEmissionDate || AppState.vtHeader?.emissionDate || '';

    container.innerHTML = `
      <!-- Toolbar -->
      <div class="toolbar" style="flex-direction:column; align-items:stretch; gap:10px; flex-wrap:nowrap;">

        <!-- Linha 1: Chips de filtro + Botões de ação -->
        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button class="filter-chip ${this.activeTab === 'va' ? 'active' : ''}" data-tab="va">
              VA (${AppState.vaData.length})
            </button>
            <button class="filter-chip ${this.activeTab === 'vt' ? 'active' : ''}" data-tab="vt">
              VT (${AppState.vtData.length})
            </button>
            <button class="filter-chip ${this.activeTab === 'va_vt' ? 'active' : ''}" data-tab="va_vt">
              VA + VT (${AppState.vtData.length})
            </button>
            <button class="filter-chip ${this.activeTab === 'farmacia' ? 'active' : ''}" data-tab="farmacia">
              Farmácia (${typeof FarmaciaModule !== 'undefined' ? FarmaciaModule.data.length : 0})
            </button>
            <button class="filter-chip ${this.activeTab === 'estagiario' ? 'active' : ''}" data-tab="estagiario" style="${this.activeTab === 'estagiario' ? '' : 'border-color: var(--vt-600); color: var(--vt-400);'}">
              Estagiários (${AppState.vaData.filter(e => e.isEstagiario && !e.paused).length})
            </button>
          </div>
          <div style="display:flex; gap:8px; flex-shrink:0;">
            <button class="btn btn-outline btn-sm" id="recibos-clear-marks" title="Limpar todas as marcações de recibos baixados">
              <span class="nav-icon">${ICONS.trash}</span> Limpar Marcações
            </button>
            <button class="btn btn-red btn-sm" id="recibos-print-all">
              <span class="nav-icon">${ICONS.download}</span> Imprimir Todos
            </button>
          </div>
        </div>

        <!-- Linha 2+: Campos de período (condicional) -->
        ${this.activeTab === 'estagiario' ? `
        <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap; padding:8px 12px; background:rgba(255,255,255,0.03); border-radius:var(--radius-md); border:1px solid var(--vt-600);">
          <span style="font-size:11px; font-weight:600; color:var(--vt-400); text-transform:uppercase; letter-spacing:0.5px; white-space:nowrap;">Período VA</span>
          <div style="display:flex; align-items:center; gap:4px;">
            <label style="font-size:12px; color:var(--text-secondary); white-space:nowrap;">De:</label>
            <input type="date" id="recibos-estag-p-start" class="form-control" value="${this.estagPeriodStart || ''}" style="padding:4px 8px; font-size:12px; height:28px; background-color:var(--bg-input); border:1px solid var(--border-default); border-radius:var(--radius-sm); color:var(--text-primary); outline:none;">
          </div>
          <div style="display:flex; align-items:center; gap:4px;">
            <label style="font-size:12px; color:var(--text-secondary); white-space:nowrap;">Até:</label>
            <input type="date" id="recibos-estag-p-end" class="form-control" value="${this.estagPeriodEnd || ''}" style="padding:4px 8px; font-size:12px; height:28px; background-color:var(--bg-input); border:1px solid var(--border-default); border-radius:var(--radius-sm); color:var(--text-primary); outline:none;">
          </div>
          <div style="display:flex; align-items:center; gap:4px;">
            <label style="font-size:12px; color:var(--text-secondary); white-space:nowrap;">Emissão:</label>
            <input type="text" id="recibos-estag-e-date" class="form-control" value="${this.estagEmissionDate || ''}" style="padding:4px 8px; font-size:12px; height:28px; width:360px; min-width:260px; background-color:var(--bg-input); border:1px solid var(--border-default); border-radius:var(--radius-sm); color:var(--text-primary); outline:none;">
          </div>
          <button class="btn btn-outline btn-sm" id="recibos-estag-save-dates" style="height:28px; display:inline-flex; align-items:center; padding:0 16px; flex-shrink:0; border-color:var(--vt-600); color:var(--vt-400);">
            Salvar
          </button>
          <span style="font-size:11px; color:var(--text-muted); white-space:nowrap;">VT: período da planilha VT automático.</span>
        </div>
        ` : (this.activeTab === 'va' ? this._renderVAPeriodBar(initialVAPStart, initialVAPEnd, initialVAEmission) :
            (this.activeTab === 'vt' ? this._renderVTPeriodBar(initialVTPStart, initialVTPEnd, initialVTEmission) :
            (this.activeTab === 'va_vt' ? `
              ${this._renderVAPeriodBar(initialVAPStart, initialVAPEnd, initialVAEmission)}
              ${this._renderVTPeriodBar(initialVTPStart, initialVTPEnd, initialVTEmission)}
            ` : '')))}

      </div>

      <!-- Lista de funcionários para gerar recibo -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">
              <span class="nav-icon">${ICONS.download}</span>
              ${this.activeTab === 'va' ? 'Recibos de Vale Alimentação' : (this.activeTab === 'vt' ? 'Recibos de Vale Transporte' : (this.activeTab === 'va_vt' ? 'Recibos de VA + VT' : (this.activeTab === 'estagiario' ? 'Recibos de Estagiários (VA + VT)' : 'Recibos de Farmácia')))}
            </div>
          </div>
        </div>
        <div class="table-wrapper">
          <table class="data-table data-table-spacious">
            <thead>
              <tr>
                <th style="width:60px;text-align:center;">#</th>
                <th>Funcionário</th>
                <th class="col-cpf">CPF</th>
                <th style="text-align:${this.activeTab === 'farmacia' ? 'left' : 'right'};">Valor Total</th>
                ${this.activeTab === 'estagiario' ? '<th style="text-align:center;">Tem VT</th>' : (this.activeTab !== 'farmacia' ? '<th style="text-align:center;">Estagiário</th>' : '')}
                <th style="text-align:center;">Status</th>
                <th style="text-align:center;">Ação</th>
              </tr>
            </thead>
            <tbody id="recibos-tbody">
              ${this._renderRows()}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  _renderRows() {
    let rawData = [];
    if (this.activeTab === 'va') rawData = AppState.vaData;
    else if (this.activeTab === 'vt') rawData = AppState.vtData;
    else if (this.activeTab === 'va_vt') rawData = AppState.vtData;
    else if (this.activeTab === 'farmacia') rawData = typeof FarmaciaModule !== 'undefined' ? FarmaciaModule.data : [];
    else if (this.activeTab === 'estagiario') rawData = AppState.vaData.filter(e => e.isEstagiario);

    const data = this.activeTab === 'farmacia' ? rawData : rawData.filter(e => !e.paused);
    const downloaded = this._getDownloaded();

    if (data.length === 0) {
      return `<tr><td colspan="${this.activeTab === 'farmacia' ? 6 : 7}" class="text-center text-muted" style="padding:40px;">
        ${this.activeTab === 'estagiario' ? 'Nenhum estagiário encontrado. Verifique se a coluna I da planilha contém "ESTAGIÁRIO".' : 'Nenhum dado carregado para esta categoria.'}
      </td></tr>`;
    }

    return data.map((e, index) => {
      const key = this._getEmployeeKey(e);
      const ts = key ? downloaded[key] : null;
      const displayCode = this.activeTab === 'farmacia' ? (index + 1) : Utils.escapeHtml(e.code || e.id || '');
      
      const statusBadge = ts
        ? `<span class="badge badge-downloaded" title="Baixado em ${ts}">
             Baixado
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
               style="width:12px;height:12px;vertical-align:middle;margin-left:2px;margin-right:2px;">
               <polyline points="20 6 9 17 4 12"/>
             </svg>
             <span class="badge-downloaded-time">(${ts})</span>
           </span>`
        : `<span class="badge badge-pending">Pendente</span>`;

      return `
      <tr class="${ts ? 'row-downloaded' : ''} recibo-row" data-row="${e.rowIndex !== undefined ? e.rowIndex : e.id}">
        <td class="col-code">${displayCode}</td>
        <td class="col-name" style="text-transform: uppercase;">${Utils.escapeHtml(e.name || e.nome)}</td>
        <td class="col-cpf">${Utils.escapeHtml(Utils.formatCPF(e.cpf))}</td>
        <td class="col-currency fw-700" style="text-align:${this.activeTab === 'farmacia' ? 'left' : 'right'}; color:${this.activeTab === 'va' ? 'var(--va-400)' : (this.activeTab === 'vt' ? 'var(--vt-400)' : 'var(--text-primary)')};">
          ${this.activeTab === 'farmacia' 
            ? Utils.formatCurrency(e.valorTotal) 
            : (this.activeTab === 'va_vt'
                ? (() => {
                    let v = AppState.vaData.find(va => (va.cpf && e.cpf && Utils.cleanCPF(va.cpf) === Utils.cleanCPF(e.cpf)) || (va.name && e.name && va.name === e.name));
                    let vaTotal = v ? v.totalValue : 0;
                    return Utils.formatCurrency(e.totalValue + vaTotal);
                  })()
                : (this.activeTab === 'vt'
                    ? Utils.formatCurrency(e.totalValue)
                    : `<input type="text" class="recibo-total-input form-control fw-700" 
                          style="width:105px; display:inline-block; text-align:right; color:inherit; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); padding:4px 8px; border-radius:4px;" 
                          value="${Utils.formatCurrency(e.totalValue).replace('R$ ', '')}" 
                          data-row="${e.rowIndex || e.id}">`
                  )
              )
          }
        </td>
        ${this.activeTab === 'estagiario' ? (() => {
          const hasVT = AppState.vtData.some(v => (v.cpf && e.cpf && Utils.cleanCPF(v.cpf) === Utils.cleanCPF(e.cpf)) || (v.name && e.name && v.name === e.name));
          return `<td style="text-align:center;"><span class="badge" style="${hasVT ? 'background:var(--vt-600);color:#fff;' : 'background:var(--surface-3);color:var(--text-muted);'}">${hasVT ? 'SIM' : 'NÃO'}</span></td>`;
        })() : (this.activeTab !== 'farmacia' ? `
        <td style="text-align:center;">
          <span class="badge" style="${e.isEstagiario ? 'background:var(--vt-600);color:#fff;' : 'background:var(--surface-3);color:var(--text-muted);'}">${e.isEstagiario ? 'SIM' : 'NÃO'}</span>
        </td>
        ` : '')}
        <td class="col-status" style="text-align:center;">${statusBadge}</td>
        <td class="col-actions">
          <button class="btn btn-red btn-sm recibo-btn" data-row="${e.rowIndex || e.id}">
            <span class="nav-icon">${ICONS.download}</span> ${ts ? 'Reimprimir' : 'Recibo'}
          </button>
        </td>
      </tr>
    `;
    }).join('');
  },

  setupEvents() {
    // Tabs VA / VT
    document.querySelectorAll('.filter-chip[data-tab]').forEach(chip => {
      chip.addEventListener('click', (e) => {
        this.activeTab = e.currentTarget.dataset.tab;
        
        // Reset period dates when changing tabs so they are re-loaded from the respective sheet's header
        this.vaPeriodStart = null;
        this.vaPeriodEnd = null;
        this.vaEmissionDate = null;
        this.vtPeriodStart = null;
        this.vtPeriodEnd = null;
        this.vtEmissionDate = null;
        this.periodStart = null;
        this.periodEnd = null;
        this.emissionDate = null;
        
        document.querySelectorAll('.filter-chip[data-tab]').forEach(c => c.classList.remove('active'));
        e.currentTarget.classList.add('active');
        App.navigateTo('recibos');
      });
    });

    // Botões individuais
    this._bindReciboButtons();

    // Imprimir todos
    document.getElementById('recibos-print-all')?.addEventListener('click', () => {
      this._printAllReceipts();
    });

    // Datas e Emissão — VA
    const inputVAStart = document.getElementById('recibos-va-p-start');
    if (inputVAStart) inputVAStart.addEventListener('change', (e) => this.vaPeriodStart = e.target.value);
    
    const inputVAEnd = document.getElementById('recibos-va-p-end');
    if (inputVAEnd) inputVAEnd.addEventListener('change', (e) => this.vaPeriodEnd = e.target.value);

    const inputVAEmission = document.getElementById('recibos-va-e-date');
    if (inputVAEmission) {
      inputVAEmission.addEventListener('input', (e) => this.vaEmissionDate = e.target.value);
      inputVAEmission.addEventListener('change', (e) => this.vaEmissionDate = e.target.value);
    }

    const btnSaveVA = document.getElementById('recibos-save-va-dates');
    if (btnSaveVA) {
      btnSaveVA.addEventListener('click', () => this._updateSheetDates('va'));
    }

    // Datas e Emissão — VT
    const inputVTStart = document.getElementById('recibos-vt-p-start');
    if (inputVTStart) inputVTStart.addEventListener('change', (e) => this.vtPeriodStart = e.target.value);
    
    const inputVTEnd = document.getElementById('recibos-vt-p-end');
    if (inputVTEnd) inputVTEnd.addEventListener('change', (e) => this.vtPeriodEnd = e.target.value);

    const inputVTEmission = document.getElementById('recibos-vt-e-date');
    if (inputVTEmission) {
      inputVTEmission.addEventListener('input', (e) => this.vtEmissionDate = e.target.value);
      inputVTEmission.addEventListener('change', (e) => this.vtEmissionDate = e.target.value);
    }

    const btnSaveVT = document.getElementById('recibos-save-vt-dates');
    if (btnSaveVT) {
      btnSaveVT.addEventListener('click', () => this._updateSheetDates('vt'));
    }

    // Datas Estagiários — salva no localStorage a cada alteração ou clique no botão Salvar
    const inputEstagStart = document.getElementById('recibos-estag-p-start');
    if (inputEstagStart) {
      const handleStart = (e) => {
        this.estagPeriodStart = e.target.value;
        this._saveEstagDates();
      };
      inputEstagStart.addEventListener('change', handleStart);
      inputEstagStart.addEventListener('input', handleStart);
    }

    const inputEstagEnd = document.getElementById('recibos-estag-p-end');
    if (inputEstagEnd) {
      const handleEnd = (e) => {
        this.estagPeriodEnd = e.target.value;
        this._saveEstagDates();
      };
      inputEstagEnd.addEventListener('change', handleEnd);
      inputEstagEnd.addEventListener('input', handleEnd);
    }

    const inputEstagEmission = document.getElementById('recibos-estag-e-date');
    if (inputEstagEmission) {
      const handleEmission = (e) => {
        this.estagEmissionDate = e.target.value;
        this._saveEstagDates();
      };
      inputEstagEmission.addEventListener('input', handleEmission);
      inputEstagEmission.addEventListener('change', handleEmission);
    }

    const btnSaveEstag = document.getElementById('recibos-estag-save-dates');
    if (btnSaveEstag) {
      btnSaveEstag.addEventListener('click', () => {
        const sEl = document.getElementById('recibos-estag-p-start');
        const eEl = document.getElementById('recibos-estag-p-end');
        const mEl = document.getElementById('recibos-estag-e-date');
        if (sEl) this.estagPeriodStart = sEl.value;
        if (eEl) this.estagPeriodEnd = eEl.value;
        if (mEl) this.estagEmissionDate = mEl.value;
        this._saveEstagDates();
        App.toast('Período de estagiários salvo com sucesso!', 'success');
      });
    }

    // Limpar marcações
    document.getElementById('recibos-clear-marks')?.addEventListener('click', () => {
      App.showModal(
        'Limpar Marcações',
        `<p style="color:var(--text-secondary);line-height:1.6;">
          Deseja limpar todas as marcações de recibos baixados da aba
          <strong style="color:var(--text-primary);">${this.activeTab.toUpperCase()}</strong>?<br>
          <span style="font-size:12px;color:var(--text-muted);margin-top:8px;display:block;">
            Esta ação não pode ser desfeita.
          </span>
        </p>`,
        [
          {
            label: 'Cancelar',
            class: 'btn btn-outline',
            action: () => App.closeModal(),
          },
          {
            label: '🗑️ Limpar',
            class: 'btn btn-danger',
            style: 'background:rgba(239,68,68,0.15);color:var(--error);border:1px solid rgba(239,68,68,0.3);padding:9px 18px;',
            action: () => {
              App.closeModal();
              this._clearDownloaded();
              const tbody = document.getElementById('recibos-tbody');
              if (tbody) tbody.innerHTML = this._renderRows();
              this._bindReciboButtons();
              App.toast('Marcações limpas com sucesso', 'success');
            },
          },
        ]
      );
    });
  },

  async _updateSheetDates(type) {
    if (this.activeTab === 'farmacia') {
      App.toast('Datas configuradas apenas para impressão (não salva na planilha da Farmácia).', 'success');
      return;
    }

    const targetType = type || (this.activeTab === 'va' ? 'va' : 'vt');
    const isVA = targetType === 'va';
    const header = isVA ? AppState.vaHeader : AppState.vtHeader;
    
    const formatDate = (isoString) => {
      if (!isoString) return null;
      if (isoString.includes('/')) return isoString;
      const parts = isoString.split('-');
      if (parts.length !== 3) return isoString;
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    };

    let pStart, pEnd, eDate;
    if (isVA) {
      const sEl = document.getElementById('recibos-va-p-start');
      const eEl = document.getElementById('recibos-va-p-end');
      const mEl = document.getElementById('recibos-va-e-date');
      if (sEl && sEl.value) this.vaPeriodStart = sEl.value;
      if (eEl && eEl.value) this.vaPeriodEnd = eEl.value;
      if (mEl && mEl.value) this.vaEmissionDate = mEl.value;

      pStart = formatDate(this.vaPeriodStart) || header?.periodStart || '';
      pEnd = formatDate(this.vaPeriodEnd) || header?.periodEnd || '';
      eDate = this.vaEmissionDate || header?.emissionDate || '';
    } else {
      const sEl = document.getElementById('recibos-vt-p-start');
      const eEl = document.getElementById('recibos-vt-p-end');
      const mEl = document.getElementById('recibos-vt-e-date');
      if (sEl && sEl.value) this.vtPeriodStart = sEl.value;
      if (eEl && eEl.value) this.vtPeriodEnd = eEl.value;
      if (mEl && mEl.value) this.vtEmissionDate = mEl.value;

      pStart = formatDate(this.vtPeriodStart) || header?.periodStart || '';
      pEnd = formatDate(this.vtPeriodEnd) || header?.periodEnd || '';
      eDate = this.vtEmissionDate || header?.emissionDate || '';
    }

    try {
      if (isVA) {
        await SheetsAPI.updateVAPeriod(pStart, pEnd, eDate);
        if (AppState.vaHeader) {
          AppState.vaHeader.periodStart = pStart;
          AppState.vaHeader.periodEnd = pEnd;
          AppState.vaHeader.emissionDate = eDate;
        }
        App.toast('Datas de VA salvas na planilha!', 'success');
      } else {
        await SheetsAPI.updateVTPeriod(pStart, pEnd, eDate);
        if (AppState.vtHeader) {
          AppState.vtHeader.periodStart = pStart;
          AppState.vtHeader.periodEnd = pEnd;
          AppState.vtHeader.emissionDate = eDate;
        }
        App.toast('Datas de VT salvas na planilha!', 'success');
      }
    } catch (e) {
      console.error(e);
      App.toast('Erro ao salvar datas na planilha.', 'error');
    }
  },

  _bindReciboButtons() {
    document.querySelectorAll('.recibo-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const rowIndex = parseInt(e.currentTarget.dataset.row);
        let data = [];
        if (this.activeTab === 'va') data = AppState.vaData;
        else if (this.activeTab === 'vt') data = AppState.vtData;
        else if (this.activeTab === 'va_vt') data = AppState.vtData;
        else if (this.activeTab === 'farmacia') data = typeof FarmaciaModule !== 'undefined' ? FarmaciaModule.data : [];
        else if (this.activeTab === 'estagiario') data = AppState.vaData.filter(e => e.isEstagiario);
        
        const employee = data.find(emp => (emp.rowIndex === rowIndex || emp.id === rowIndex));
        if (employee) {
          this._markDownloaded([employee]);
          this._printReceipt([employee]);
          // Atualiza a linha na tabela sem re-render completo
          this._refreshRow(rowIndex);
        }
      });
    });
  },

  _refreshRow(rowIndex) {
    let data = [];
    if (this.activeTab === 'va') data = AppState.vaData;
    else if (this.activeTab === 'vt') data = AppState.vtData;
    else if (this.activeTab === 'va_vt') data = AppState.vtData;
    else if (this.activeTab === 'farmacia') data = typeof FarmaciaModule !== 'undefined' ? FarmaciaModule.data : [];
    else if (this.activeTab === 'estagiario') data = AppState.vaData.filter(e => e.isEstagiario);

    const employee = data.find(emp => (emp.rowIndex === rowIndex || emp.id === rowIndex));
    if (!employee) return;
    const downloaded = this._getDownloaded();
    const key = this._getEmployeeKey(employee);
    const ts = key ? downloaded[key] : null;
    const row = document.querySelector(`.recibo-row[data-row="${rowIndex}"]`);
    if (!row) return;

    // Atualiza badge de status
    const statusCell = row.querySelector('.col-status');
    if (statusCell && ts) {
      statusCell.innerHTML = `<span class="badge badge-downloaded" title="Baixado em ${ts}">
        Baixado
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
          style="width:12px;height:12px;vertical-align:middle;margin-left:2px;margin-right:2px;">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span class="badge-downloaded-time">(${ts})</span>
      </span>`;
    }
    // Atualiza texto do botão
    const btn = row.querySelector('.recibo-btn');
    if (btn && ts) {
      btn.innerHTML = `<span class="nav-icon">${ICONS.download}</span> Reimprimir`;
    }
    row.classList.add('row-downloaded');
  },

  /**
   * Gera e imprime recibos em uma nova janela
   */
  _printReceipt(employees) {
    const overrides = {};
    document.querySelectorAll('.recibo-total-input').forEach(input => {
      if (input.dataset.row) overrides[input.dataset.row] = input.value;
    });

    // Sync VA inputs
    const vaStartEl = document.getElementById('recibos-va-p-start') || document.getElementById('recibos-p-start');
    const vaEndEl = document.getElementById('recibos-va-p-end') || document.getElementById('recibos-p-end');
    const vaEmissEl = document.getElementById('recibos-va-e-date') || document.getElementById('recibos-e-date');
    if (vaStartEl && vaStartEl.value) this.vaPeriodStart = vaStartEl.value;
    if (vaEndEl && vaEndEl.value) this.vaPeriodEnd = vaEndEl.value;
    if (vaEmissEl && vaEmissEl.value) this.vaEmissionDate = vaEmissEl.value;

    // Sync VT inputs
    const vtStartEl = document.getElementById('recibos-vt-p-start');
    const vtEndEl = document.getElementById('recibos-vt-p-end');
    const vtEmissEl = document.getElementById('recibos-vt-e-date');
    if (vtStartEl && vtStartEl.value) this.vtPeriodStart = vtStartEl.value;
    if (vtEndEl && vtEndEl.value) this.vtPeriodEnd = vtEndEl.value;
    if (vtEmissEl && vtEmissEl.value) this.vtEmissionDate = vtEmissEl.value;

    if (this.activeTab === 'estagiario') {
      const sEl = document.getElementById('recibos-estag-p-start');
      const eEl = document.getElementById('recibos-estag-p-end');
      const mEl = document.getElementById('recibos-estag-e-date');
      if (sEl && sEl.value) this.estagPeriodStart = sEl.value;
      if (eEl && eEl.value) this.estagPeriodEnd = eEl.value;
      if (mEl && mEl.value) this.estagEmissionDate = mEl.value;
      this._saveEstagDates();
    }

    const formatDate = (isoString) => {
      if (!isoString) return null;
      if (isoString.includes('/')) return isoString;
      const parts = isoString.split('-');
      if (parts.length !== 3) return isoString;
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    };

    const vaPeriodStart = formatDate(this.vaPeriodStart) || formatDate(this.periodStart) || AppState.vaHeader?.periodStart || '01/05/2026';
    const vaPeriodEnd = formatDate(this.vaPeriodEnd) || formatDate(this.periodEnd) || AppState.vaHeader?.periodEnd || '31/05/2026';
    const vaEmissionDate = this.vaEmissionDate || this.emissionDate || AppState.vaHeader?.emissionDate || 'Londrina, 20 de abril de 2026';

    const vtPeriodStart = formatDate(this.vtPeriodStart) || formatDate(this.periodStart) || AppState.vtHeader?.periodStart || '01/05/2026';
    const vtPeriodEnd = formatDate(this.vtPeriodEnd) || formatDate(this.periodEnd) || AppState.vtHeader?.periodEnd || '31/05/2026';
    const vtEmissionDate = this.vtEmissionDate || this.emissionDate || AppState.vtHeader?.emissionDate || 'Londrina, 20 de abril de 2026';

    let receiptsHtml = employees.map(empOrig => {
      const emp = { ...empOrig };
      const rowId = emp.rowIndex || emp.id;
      
      if (overrides[rowId]) {
        const parseMoneyStr = (val) => {
          if (!val) return 0;
          const s = String(val).replace('R$', '').trim().replace(/\./g, '').replace(',', '.');
          return parseFloat(s) || 0;
        };
        emp.totalValue = parseMoneyStr(overrides[rowId]);
      }

      if (this.activeTab === 'va') {
        let pStart = vaPeriodStart;
        let pEnd = vaPeriodEnd;
        let eDate = vaEmissionDate;
        
        if (emp.isEstagiario) {
          if (this.estagPeriodStart) pStart = formatDate(this.estagPeriodStart);
          if (this.estagPeriodEnd) pEnd = formatDate(this.estagPeriodEnd);
          if (this.estagEmissionDate) eDate = this.estagEmissionDate;
        }

        return this._generateVAReceipt(emp, pStart, pEnd, eDate);
      } else if (this.activeTab === 'vt') {
        return this._generateVTReceipt(emp, vtPeriodStart, vtPeriodEnd, vtEmissionDate);
      } else if (this.activeTab === 'va_vt') {
        let empVAOrig = AppState.vaData.find(v => (v.cpf && emp.cpf && Utils.cleanCPF(v.cpf) === Utils.cleanCPF(emp.cpf)) || (v.name && emp.name && v.name === emp.name));
        let empVA = empVAOrig ? { ...empVAOrig } : { quantity: 0, unitValue: 0, totalValue: 0, name: emp.name, cpf: emp.cpf, isEstagiario: emp.isEstagiario };

        let curVAPeriodStart = vaPeriodStart;
        let curVAPeriodEnd = vaPeriodEnd;
        let curVAEmissionDate = vaEmissionDate;
        
        if (emp.isEstagiario) {
          if (this.estagPeriodStart) curVAPeriodStart = formatDate(this.estagPeriodStart);
          if (this.estagPeriodEnd) curVAPeriodEnd = formatDate(this.estagPeriodEnd);
          if (this.estagEmissionDate) curVAEmissionDate = this.estagEmissionDate;
        }

        const vaHtml = this._generateVAReceipt(empVA, curVAPeriodStart, curVAPeriodEnd, curVAEmissionDate);
        const vtHtml = this._generateVTReceipt(emp, vtPeriodStart, vtPeriodEnd, vtEmissionDate);
        return vaHtml + vtHtml;
      } else if (this.activeTab === 'estagiario') {
        // emp vem de vaData (estagiário com VA)
        const empVA = { ...emp };

        // Período VA para estagiários
        let vaPeriodStart = formatDate(AppState.vaHeader?.periodStart) || '01/05/2026';
        let vaPeriodEnd = formatDate(AppState.vaHeader?.periodEnd) || '31/05/2026';
        let vaEmissionDate = AppState.vaHeader?.emissionDate || 'Londrina, 20 de abril de 2026';
        if (this.estagPeriodStart) vaPeriodStart = formatDate(this.estagPeriodStart);
        if (this.estagPeriodEnd) vaPeriodEnd = formatDate(this.estagPeriodEnd);
        if (this.estagEmissionDate) vaEmissionDate = this.estagEmissionDate;

        const vaHtml = this._generateVAReceipt(empVA, vaPeriodStart, vaPeriodEnd, vaEmissionDate);

        // Verifica se o estagiário também tem VT
        const empVTOrig = AppState.vtData.find(v =>
          (v.cpf && emp.cpf && Utils.cleanCPF(v.cpf) === Utils.cleanCPF(emp.cpf)) ||
          (v.name && emp.name && v.name === emp.name)
        );

        if (empVTOrig) {
          const empVT = { ...empVTOrig };
          const vtPeriodStart = formatDate(AppState.vtHeader?.periodStart) || periodStart;
          const vtPeriodEnd = formatDate(AppState.vtHeader?.periodEnd) || periodEnd;
          const vtEmissionDate = AppState.vtHeader?.emissionDate || emissionDate;
          const vtHtml = this._generateVTReceipt(empVT, vtPeriodStart, vtPeriodEnd, vtEmissionDate);
          return vaHtml + vtHtml;
        }

        return vaHtml;
      } else if (this.activeTab === 'farmacia') {
        return this._generateFarmaciaReceipt(emp, periodStart, periodEnd, emissionDate);
      }
    }).join('');

    const titles = { 'va': 'Recibos VA', 'vt': 'Recibos VT', 'va_vt': 'Recibos VA e VT', 'farmacia': 'Recibos Farmácia', 'estagiario': 'Recibos Estagiários' };
    this._openPrintWindow(receiptsHtml, titles[this.activeTab] || 'Recibos');
  },

  _printAllReceipts() {
    let rawData = [];
    if (this.activeTab === 'va') rawData = AppState.vaData;
    else if (this.activeTab === 'vt') rawData = AppState.vtData;
    else if (this.activeTab === 'va_vt') rawData = AppState.vtData;
    else if (this.activeTab === 'farmacia') rawData = typeof FarmaciaModule !== 'undefined' ? FarmaciaModule.data : [];
    else if (this.activeTab === 'estagiario') rawData = AppState.vaData.filter(e => e.isEstagiario);

    const data = this.activeTab === 'farmacia' ? rawData : rawData.filter(e => !e.paused);
    if (data.length === 0) {
      App.toast('Nenhum dado para imprimir', 'warning');
      return;
    }
    this._markDownloaded(data);
    this._printReceipt(data);
    App.navigateTo('recibos');
  },

  /**
   * Modelo de recibo VALE ALIMENTAÇÃO
   * Baseado na aba "Recibos" da planilha VA
   */
  _generateVAReceipt(emp, periodStart, periodEnd, emissionDate) {
    const totalFormatted = Utils.formatBRNumber(emp.totalValue);
    const unitFormatted = Utils.formatBRNumber(emp.unitValue);

    return `
      <div class="receipt">
        <!-- Cabeçalho idêntico à imagem -->
        <div class="receipt-header">
          <div class="header-logo-mark">
            <img src="img/logo-mark.png" alt="Logo" style="width:70px; height:70px; object-fit:contain;">
          </div>
          <div class="header-content">
            <div class="header-row">
              <div class="header-phone">43 3374 -5600</div>
              <div class="header-address">
                av. higienópolis, 1200<br>
                londrina pr | creci j 3703<br>
                cnpj 04.238.745/0001-44
              </div>
            </div>
            <div class="header-row align-end mt-2">
              <div class="header-brand-block">
                <div class="header-brand-small">I M O B I L I Á R I A</div>
                <div class="header-brand-large">Santamérica</div>
              </div>
              <div class="header-contact">
                www.santamerica.com.br<br>
                falecom@santamerica.com.br
              </div>
            </div>
            <div class="header-slogan">Seu bem, nosso compromisso.</div>
          </div>
        </div>

        <!-- Título -->
        <div class="receipt-title-area">
          <div class="receipt-title">RECIBO DE VALE ALIMENTAÇÃO</div>
          <div class="receipt-period">Período: ${periodStart} a ${periodEnd}</div>
        </div>

        <!-- Tabela -->
        <table class="receipt-table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Quantidade</th>
              <th>V. Unitário</th>
              <th>Valor Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="center">Vale Alimentação</td>
              <td class="center">${emp.quantity}</td>
              <td class="center">${unitFormatted}</td>
              <td class="center">${totalFormatted}</td>
            </tr>
            <tr class="total-row">
              <td class="empty-cell"></td>
              <td colspan="2" class="center"><strong>Valor Total</strong></td>
              <td class="center"><strong>R$ ${totalFormatted}</strong></td>
            </tr>
          </tbody>
        </table>

        <!-- Texto -->
        <p class="receipt-text">
          Recebi da IMOBILIÁRIA SANTAMÉRICA, o Vale Alimentação acima discriminado, para
          utilização no período de ${periodStart} a ${periodEnd}.
        </p>

        <!-- Data -->
        <div class="receipt-date">${emissionDate}</div>

        <!-- Assinatura -->
        <div class="receipt-signature-area">
          <div class="receipt-signature">
            <div class="signature-name"><strong>${Utils.escapeHtml(emp.name).toUpperCase()}</strong></div>
            <div class="signature-cpf"><strong>${Utils.escapeHtml(Utils.formatCPF(emp.cpf))}</strong></div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Modelo de recibo VALE TRANSPORTE
   * Baseado na aba "Recibos" da planilha VT
   * Inclui texto de autorização de desconto de 3% e valor por extenso
   */
  _generateVTReceipt(emp, periodStart, periodEnd, emissionDate) {
    const totalFormatted = Utils.formatBRNumber(emp.totalValue);
    const unitFormatted = Utils.formatBRNumber(emp.unitValue);
    const totalExtenso = this._numberToWords(emp.totalValue);

    return `
      <div class="receipt">
        <!-- Cabeçalho idêntico à imagem -->
        <div class="receipt-header">
          <div class="header-logo-mark">
            <img src="img/logo-mark.png" alt="Logo" style="width:70px; height:70px; object-fit:contain;">
          </div>
          <div class="header-content">
            <div class="header-row">
              <div class="header-phone">43 3374 -5600</div>
              <div class="header-address">
                av. higienópolis, 1200<br>
                londrina pr | creci j 3703<br>
                cnpj 04.238.745/0001-44
              </div>
            </div>
            <div class="header-row align-end mt-2">
              <div class="header-brand-block">
                <div class="header-brand-small">I M O B I L I Á R I A</div>
                <div class="header-brand-large">Santamérica</div>
              </div>
              <div class="header-contact">
                www.santamerica.com.br<br>
                falecom@santamerica.com.br
              </div>
            </div>
            <div class="header-slogan">Seu bem, nosso compromisso.</div>
          </div>
        </div>

        <!-- Título -->
        <div class="receipt-title-area">
          <div class="receipt-title">RECIBO DE VALE TRANSPORTE</div>
          <div class="receipt-period">Período: ${periodStart} a ${periodEnd}</div>
        </div>

        <!-- Tabela -->
        <table class="receipt-table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Quantidade</th>
              <th>V. Unitário</th>
              <th>Valor Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="center">Urbano</td>
              <td class="center">${emp.quantity}</td>
              <td class="center">${unitFormatted}</td>
              <td class="center">${totalFormatted}</td>
            </tr>
            <tr class="total-row">
              <td class="empty-cell"></td>
              <td colspan="2" class="center"><strong>Valor Total</strong></td>
              <td class="center"><strong>R$ ${totalFormatted}</strong></td>
            </tr>
          </tbody>
        </table>

        <!-- Texto -->
        <p class="receipt-text">
          Recebi da IMOBILIÁRIA SANTAMÉRICA, ${emp.quantity} vales-transporte acima discriminados,
          totalizando a quantia de R$ ${totalFormatted} (${totalExtenso}).${emp.isEstagiario ? '' : ` Autorizo ao empregador
          a descontar de meus vencimentos o valor dos vales transportes fornecidos até o limite de
          3% (três por cento) de meu salário.`}
        </p>

        <!-- Data -->
        <div class="receipt-date">${emissionDate}</div>

        <!-- Assinatura -->
        <div class="receipt-signature-area">
          <div class="receipt-signature">
            <div class="signature-name"><strong>${Utils.escapeHtml(emp.name).toUpperCase()}</strong></div>
            <div class="signature-cpf"><strong>${Utils.escapeHtml(Utils.formatCPF(emp.cpf))}</strong></div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Modelo de recibo FARMÁCIA
   */
  _generateFarmaciaReceipt(emp, periodStart, periodEnd, emissionDate) {
    const totalFormatted = Utils.formatBRNumber(emp.valorTotal);
    
    // Lista de compras
    const comprasList = (emp.compras || []).map(c => {
      const dataFormatada = c.data || 'N/A';
      const parcelaText = c.parcelas || '1/1';
      const idPedidoText = c.idPedido ? ` | Pedido: ${c.idPedido}` : '';
      const valorFormatado = Utils.formatBRNumber(c.valor);
      return `<li style="margin-bottom:6px;">${dataFormatada}${idPedidoText} | Parcela: ${parcelaText} | R$ ${valorFormatado}</li>`;
    }).join('');

    return `
      <div class="receipt" style="font-family: Arial, sans-serif; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="img/logo-farmacia.png" alt="Banner Farmácia" style="width: 100%; height: 90px; object-fit: cover; object-position: center; border-radius: 6px; display: block; margin: 0 auto; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
        </div>

        <!-- Dados do Funcionário -->
        <div style="margin-bottom: 30px;">
          <h3 style="margin: 0 0 10px 0; text-transform: uppercase; font-size: 18px; color: #111;">${Utils.escapeHtml(emp.nome || emp.name)}</h3>
          <h4 style="margin: 0; font-size: 16px; color: #111;">CPF: ${Utils.escapeHtml(Utils.formatCPF(emp.cpf))}</h4>
        </div>

        <!-- Lista de Compras -->
        <ul style="list-style-type: disc; padding-left: 20px; font-size: 15px; line-height: 1.6; margin-bottom: 30px; color: #111;">
          ${comprasList}
        </ul>

        <!-- Total -->
        <div style="font-size: 16px; font-weight: bold; margin-bottom: 40px; color: #111;">
          TOTAL: R$ ${totalFormatted}
        </div>

        <hr style="border: none; border-top: 1px solid #ccc;">
      </div>
    `;
  },

  /**
   * Abre janela de impressão com os recibos
   */
  _openPrintWindow(receiptsHtml, title) {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      App.toast('Permita popups para imprimir os recibos', 'warning');
      return;
    }

    printWindow.document.write(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${title} — Imobiliária Santamérica</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 14px;
      color: #000;
      background: #fff;
    }

    .receipt {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
      padding: 30px 20px;
      position: relative;
    }

    /* === Cabeçalho === */
    .receipt-header {
      display: flex;
      align-items: flex-start;
      gap: 20px;
      margin-bottom: 50px;
    }

    .header-logo-mark {
      flex-shrink: 0;
    }

    .header-content {
      display: flex;
      flex-direction: column;
    }

    .header-row {
      display: flex;
      gap: 20px;
      align-items: flex-start;
    }
    .header-row.align-end {
      align-items: flex-end;
    }
    .mt-2 {
      margin-top: 5px;
    }

    .header-phone {
      font-size: 20px;
      font-weight: bold;
      white-space: nowrap;
    }

    .header-address, .header-contact {
      font-size: 12px;
      color: #444;
      line-height: 1.2;
    }

    .header-brand-block {
      line-height: 1;
    }

    .header-brand-small {
      font-size: 11px;
      letter-spacing: 2px;
      color: #333;
    }

    .header-brand-large {
      font-size: 26px;
      font-weight: bold;
      letter-spacing: -1px;
      margin-top: -2px;
    }

    .header-slogan {
      font-size: 13px;
      color: #333;
      margin-top: 5px;
    }

    /* === Título e Período === */
    .receipt-title-area {
      text-align: left;
      margin-left: 55%;
      margin-bottom: 5px;
    }

    .receipt-title {
      font-size: 14px;
      font-weight: bold;
      text-transform: uppercase;
    }

    .receipt-period {
      font-size: 13px;
      margin-top: 3px;
    }

    /* === Tabela === */
    .receipt-table {
      width: 75%;
      margin: 0 0 30px 0;
      border-collapse: collapse;
      border: 2px solid #000;
    }

    .receipt-table th, .receipt-table td {
      border: 1px solid #000;
      padding: 6px 10px;
      font-size: 14px;
    }

    .receipt-table th {
      font-weight: bold;
      text-align: center;
      background: #fff; /* Fundo branco conforme imagem */
    }

    .receipt-table td.center {
      text-align: center;
    }

    .receipt-table td.empty-cell {
      border-bottom: none;
      border-left: none;
    }

    .total-row td {
      border-top: 2px solid #000;
    }

    /* === Texto === */
    .receipt-text {
      font-size: 14px;
      line-height: 1.4;
      text-align: justify;
      margin-bottom: 40px;
    }

    /* === Data === */
    .receipt-date {
      font-size: 14px;
      text-align: center;
      margin-bottom: 50px;
    }

    /* === Assinatura === */
    .receipt-signature-area {
      display: flex;
      justify-content: flex-end;
      width: 100%;
    }

    .receipt-signature {
      width: 60%;
      text-align: center;
      border-top: 2px solid #000;
      padding-top: 5px;
      font-size: 14px;
    }

    .signature-name {
      margin-bottom: 4px;
    }

    /* === Print === */
    @media print {
      @page { margin: 0; }
      body { 
        background: #fff; 
        margin: 0; 
        padding: 0;
      }
      .receipt {
        padding: 10mm 15mm;
        max-width: none;
        height: 50vh;
        box-sizing: border-box;
        page-break-inside: avoid;
        break-inside: avoid;
        overflow: hidden;
      }
      /* Reduce margins so content fits inside 50vh */
      .receipt-header { margin-bottom: 25px; }
      .receipt-table { margin-bottom: 20px; }
      .receipt-text { margin-bottom: 25px; font-size: 13px; }
      .receipt-date { margin-bottom: 35px; font-size: 13px; }

      .receipts-wrapper .receipt:nth-child(2n) {
        page-break-after: always;
        break-after: page;
      }
      
      /* Linha tracejada de corte (tesoura) entre o 1º e 2º recibo da folha */
      .receipts-wrapper .receipt:nth-child(2n-1)::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 5%;
        right: 5%;
        border-bottom: 1px dashed #aaa;
      }
      
      .no-print { display: none !important; }
    }

    /* === Botão Imprimir (só na tela) === */
    .print-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #1e2233;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 999;
      box-shadow: 0 2px 12px rgba(0,0,0,0.3);
    }

    .print-bar span {
      color: #fff;
      font-size: 14px;
      font-weight: 600;
    }

    .print-btn {
      background: #6366f1;
      color: #fff;
      border: none;
      padding: 8px 20px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      font-family: 'Inter', sans-serif;
    }

    .print-btn:hover { background: #4f46e5; }

    @media print {
      .print-bar { display: none; }
      body { padding-top: 0; }
    }

    @media screen {
      body { padding-top: 56px; }
    }
  </style>
</head>
<body>
  <div class="print-bar no-print">
    <span>📄 ${title} — ${this.activeTab === 'estagiario' ? AppState.vaData.filter(e => e.isEstagiario && !e.paused).length : (this.activeTab === 'va' ? AppState.vaData.length : AppState.vtData.length)} estagiário(s)/recibo(s)</span>
    <button class="print-btn" onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>
  </div>
  <div class="receipts-wrapper">
    ${receiptsHtml}
  </div>
</body>
</html>
    `);

    printWindow.document.close();
  },

  /**
   * Converte número para extenso em português
   * Ex: 600.00 → "seiscentos reais"
   * Ex: 287.50 → "duzentos e oitenta e sete reais e cinquenta centavos"
   */
  _numberToWords(value) {
    const units = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
    const teens = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
    const tens = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
    const hundreds = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

    function convertGroup(n) {
      if (n === 0) return '';
      if (n === 100) return 'cem';

      let result = '';
      const h = Math.floor(n / 100);
      const remainder = n % 100;
      const t = Math.floor(remainder / 10);
      const u = remainder % 10;

      if (h > 0) {
        result += hundreds[h];
        if (remainder > 0) result += ' e ';
      }

      if (t === 1) {
        result += teens[u];
      } else {
        if (t > 0) {
          result += tens[t];
          if (u > 0) result += ' e ';
        }
        if (u > 0) {
          result += units[u];
        }
      }

      return result;
    }

    const intPart = Math.floor(value);
    const decPart = Math.round((value - intPart) * 100);

    let result = '';

    if (intPart === 0 && decPart === 0) return 'zero reais';

    if (intPart > 0) {
      if (intPart >= 1000) {
        const thousands = Math.floor(intPart / 1000);
        const rest = intPart % 1000;
        if (thousands === 1) {
          result += 'mil';
        } else {
          result += convertGroup(thousands) + ' mil';
        }
        if (rest > 0) {
          result += (rest < 100 ? ' e ' : ' ') + convertGroup(rest);
        }
      } else {
        result += convertGroup(intPart);
      }

      result += intPart === 1 ? ' real' : ' reais';
    }

    if (decPart > 0) {
      if (intPart > 0) result += ' e ';
      result += convertGroup(decPart);
      result += decPart === 1 ? ' centavo' : ' centavos';
    }

    return result;
  },

  destroy() {
    // Não reseta activeTab para preservar a aba selecionada durante re-renders
  },
};
