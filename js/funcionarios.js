/* ===================================================
   FUNCIONÁRIOS MODULE
   Visão consolidada de todos os funcionários (VA + VT)
   =================================================== */

const FuncionariosModule = {
  searchTerm: '',
  filterType: 'all', // 'all', 'va', 'vt', 'both'

  render(container) {
    const employees = this._getConsolidatedEmployees();
    const filtered = this._applyFilters(employees);

    // Contadores
    const allCount = employees.length;
    const vaOnlyCount = employees.filter(e => e.hasVA && !e.hasVT).length;
    const vtOnlyCount = employees.filter(e => !e.hasVA && e.hasVT).length;
    const bothCount = employees.filter(e => e.hasVA && e.hasVT).length;
    const pausedCount = employees.filter(e => e.paused).length;

    container.innerHTML = `
      <!-- Toolbar -->
      <div class="toolbar">
        <div class="toolbar-left">
          <div class="search-box">
            ${ICONS.search}
            <input type="text" class="search-input" id="func-search"
              placeholder="Buscar por nome ou CPF..." value="${Utils.escapeHtml(this.searchTerm)}">
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="filter-chip ${this.filterType === 'all' ? 'active' : ''}" data-filter="all">
              <span class="chip-icon">${ICONS.users}</span> Todos (${allCount})
            </button>
            <button class="filter-chip ${this.filterType === 'va' ? 'active' : ''}" data-filter="va">
              <span class="chip-icon">${ICONS.food}</span> Apenas VA (${vaOnlyCount})
            </button>
            <button class="filter-chip ${this.filterType === 'vt' ? 'active' : ''}" data-filter="vt">
              <span class="chip-icon">${ICONS.bus}</span> Apenas VT (${vtOnlyCount})
            </button>
            <button class="filter-chip ${this.filterType === 'both' ? 'active' : ''}" data-filter="both">
              <span class="chip-icon" style="display:inline-flex;gap:3px;align-items:center;">${ICONS.food}${ICONS.bus}</span> VA + VT (${bothCount})
            </button>
            <button class="filter-chip ${this.filterType === 'paused' ? 'active' : ''}" data-filter="paused">
              <span class="chip-icon">${ICONS.pause}</span> Pausados (${pausedCount})
            </button>
          </div>
        </div>
        <div class="toolbar-right">
          <button class="btn btn-bulk-delete" id="func-bulk-delete-btn" style="display:none;">
            ${ICONS.trash} <span id="func-bulk-count">0</span> Selecionados
          </button>
        </div>
      </div>

      <!-- Tabela de Funcionários -->
      <div class="card">
        <div class="table-wrapper">
          <table class="data-table data-table-spacious">
            <thead>
              <tr>
                <th style="width:40px;text-align:center;">
                  <input type="checkbox" class="row-checkbox" id="func-select-all" title="Marcar todos">
                </th>
                <th>#</th>
                <th>Nome</th>
                <th class="col-cpf">CPF</th>
                <th style="text-align:center;">VA</th>
                <th style="text-align:center;">VT</th>
                <th style="text-align:center;">Estagiário</th>
                <th style="text-align:center;">Ações</th>
              </tr>
            </thead>
            <tbody id="func-tbody">
              ${this._renderRows(filtered)}
            </tbody>
          </table>
        </div>
        ${filtered.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon">🔍</div>
            <h3>Nenhum funcionário encontrado</h3>
            <p>Tente ajustar os filtros ou a busca.</p>
          </div>
        ` : `
          <div class="table-footer">
            <span>${filtered.length} funcionário${filtered.length !== 1 ? 's' : ''}</span>
          </div>
        `}
      </div>
    `;
  },

  _getConsolidatedEmployees() {
    const map = new Map(); // CPF -> entry
    const nameMap = new Map(); // Normalized Name -> entry
    const allEntries = new Set(); // Todos os entries

    const normalizeName = (name) => {
      if (!name) return '';
      return name.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, ' ');
    };

    const getOrAddEntry = (e, origin, idx) => {
      const cleanCpf = Utils.cleanCPF(e.cpf);
      const normName = normalizeName(e.name);
      
      let entry = null;
      if (cleanCpf && map.has(cleanCpf)) {
        entry = map.get(cleanCpf);
      } else if (normName && nameMap.has(normName)) {
        entry = nameMap.get(normName);
      } else if (normName) {
        // Verifica correspondência por prefixo / nome truncado (mínimo 10 caracteres)
        for (const [existingNorm, existingEntry] of nameMap.entries()) {
          if (
            (existingNorm.length >= 10 && normName.length >= 10) &&
            (existingNorm.startsWith(normName) || normName.startsWith(existingNorm))
          ) {
            entry = existingEntry;
            break;
          }
        }
      }

      if (!entry) {
        entry = {
          name: e.name,
          cpf: e.cpf,
          cleanCpf: cleanCpf,
          hasVA: false,
          hasVT: false,
          vaRowIndex: null,
          vtRowIndex: null,
          vaQuantity: 0,
          vaUnitValue: 0,
          vaTotal: 0,
          vtQuantity: 0,
          vtUnitValue: 0,
          vtTotal: 0,
          vtAuth: '',
          paused: false,
          isEstagiario: false,
          _id: cleanCpf || normName || `${origin}_${idx}`
        };
        if (cleanCpf) map.set(cleanCpf, entry);
        if (normName) nameMap.set(normName, entry);
        allEntries.add(entry);
      } else {
        // Se o nome atual for mais completo/longo, atualiza o nome de exibição
        if ((e.name || '').length > (entry.name || '').length) {
          entry.name = e.name;
        }
        // Atualiza CPF se estava faltando ou se o novo é válido (11 dígitos)
        if ((!entry.cleanCpf || entry.cleanCpf.length < 11) && cleanCpf && cleanCpf.length === 11) {
          entry.cpf = e.cpf;
          entry.cleanCpf = cleanCpf;
          entry._id = cleanCpf;
          map.set(cleanCpf, entry);
        }
        if (normName && !nameMap.has(normName)) {
          nameMap.set(normName, entry);
        }
      }
      return entry;
    };

    AppState.vaData.forEach((e, idx) => {
      const entry = getOrAddEntry(e, 'VA', idx);
      entry.hasVA = e.quantity > 0;
      entry.vaRowIndex = e.rowIndex;
      entry.vaQuantity = e.quantity;
      entry.vaUnitValue = e.unitValue;
      entry.vaTotal = e.totalValue;
      entry.paused = entry.paused || e.paused;
      entry.isEstagiario = entry.isEstagiario || e.isEstagiario;
    });

    AppState.vtData.forEach((e, idx) => {
      const entry = getOrAddEntry(e, 'VT', idx);
      entry.hasVT = e.quantity > 0;
      entry.vtRowIndex = e.rowIndex;
      entry.vtQuantity = e.quantity;
      entry.vtUnitValue = e.unitValue;
      entry.vtTotal = e.totalValue;
      entry.vtAuth = e.authorization;
      entry.paused = entry.paused || e.paused;
      entry.isEstagiario = entry.isEstagiario || e.isEstagiario;
    });

    return Array.from(allEntries).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  },

  _applyFilters(employees) {
    let filtered = employees;

    // Filtro por tipo
    switch (this.filterType) {
      case 'va':
        filtered = filtered.filter(e => e.hasVA && !e.hasVT);
        break;
      case 'vt':
        filtered = filtered.filter(e => !e.hasVA && e.hasVT);
        break;
      case 'both':
        filtered = filtered.filter(e => e.hasVA && e.hasVT);
        break;
      case 'paused':
        filtered = filtered.filter(e => e.paused);
        break;
    }

    // Filtro por busca
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(e =>
        e.name.toLowerCase().includes(term) ||
        (e.cpf || '').includes(term)
      );
    }

    return filtered;
  },

  _renderRows(employees) {
    if (employees.length === 0) return '';
    return employees.map((e, i) => {
      const vaBadge = e.hasVA ? `<span class="badge badge-va">VA</span>` : '<span class="text-muted">—</span>';
      const vtBadge = e.hasVT ? `<span class="badge badge-vt">VT</span>` : '<span class="text-muted">—</span>';
      const pausedBadge = e.paused ? `<span class="badge badge-warning" style="margin-left: 8px;">Pausado</span>` : '';
      const pauseIcon = e.paused ? ICONS.play : ICONS.pause;
      const pauseLabel = e.paused ? 'Retomar' : 'Pausar';

      return `
        <tr data-cpf="${Utils.escapeHtml(e.cleanCpf)}" class="${e.paused ? 'row-paused' : ''}">
          <td style="text-align:center;">
            <input type="checkbox" class="row-checkbox func-row-chk" data-cpf="${Utils.escapeHtml(e.cleanCpf)}">
          </td>
          <td class="col-code">${i + 1}</td>
          <td class="col-name">${Utils.escapeHtml(e.name)}${pausedBadge}</td>
          <td class="col-cpf">${Utils.escapeHtml(Utils.formatCPF(e.cpf))}</td>
          <td style="text-align:center;">${vaBadge}</td>
          <td style="text-align:center;">${vtBadge}</td>
          <td style="text-align:center;">
            <div class="toggle-switch func-estag-btn ${e.isEstagiario ? 'active' : ''}" data-cpf="${Utils.escapeHtml(e.cleanCpf)}" title="Marcar como Estagiário" style="margin: 0 auto; transform: scale(0.8);"></div>
          </td>
          <td style="text-align:center;">
            <button class="btn btn-pause-action func-pause-btn" data-cpf="${Utils.escapeHtml(e.cleanCpf)}" title="${pauseLabel}">
              ${pauseIcon}
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  setupEvents() {
    // Busca
    const searchInput = document.getElementById('func-search');
    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce((e) => {
        this.searchTerm = e.target.value;
        this._refresh();
      }, 250));
    }

    // Filtros
    document.querySelectorAll('.filter-chip[data-filter]').forEach(chip => {
      chip.addEventListener('click', (e) => {
        const clickedFilter = e.currentTarget.dataset.filter;
        if (this.filterType === clickedFilter && clickedFilter !== 'all') {
          this.filterType = 'all';
        } else {
          this.filterType = clickedFilter;
        }
        document.querySelectorAll('.filter-chip[data-filter]').forEach(c => c.classList.remove('active'));
        document.querySelector(`.filter-chip[data-filter="${this.filterType}"]`).classList.add('active');
        this._refresh();
      });
    });

    // Select-all
    const selectAll = document.getElementById('func-select-all');
    if (selectAll) {
      selectAll.addEventListener('change', () => {
        document.querySelectorAll('.func-row-chk').forEach(chk => {
          chk.checked = selectAll.checked;
          chk.closest('tr').classList.toggle('row-selected', selectAll.checked);
        });
        this._updateBulkDeleteBtn();
      });
    }

    // Botão excluir selecionados
    const bulkBtn = document.getElementById('func-bulk-delete-btn');
    if (bulkBtn) {
      bulkBtn.addEventListener('click', () => this._handleBulkDelete(bulkBtn));
    }

    // Checkboxes individuais
    this._bindCheckboxEvents();
    
    // Botões de ação da tabela
    this._bindActionEvents();
  },

  _bindCheckboxEvents() {
    document.querySelectorAll('.func-row-chk').forEach(chk => {
      chk.addEventListener('change', () => {
        chk.closest('tr').classList.toggle('row-selected', chk.checked);
        this._updateBulkDeleteBtn();
      });
    });
  },

  _bindActionEvents() {
    document.querySelectorAll('.func-pause-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const cpf = e.currentTarget.dataset.cpf;
        this._handlePause(cpf);
      });
    });

    document.querySelectorAll('.func-estag-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const cpf = e.currentTarget.dataset.cpf;
        this._handleEstagiarioToggle(cpf);
      });
    });
  },

  async _handleEstagiarioToggle(cpf) {
    if (!cpf) return;
    
    const vaEmp = AppState.vaData.find(e => Utils.cleanCPF(e.cpf) === cpf);
    const vtEmp = AppState.vtData.find(e => Utils.cleanCPF(e.cpf) === cpf);
    
    if (!vaEmp && !vtEmp) return;
    
    const isCurrentlyEstagiario = (vaEmp && vaEmp.isEstagiario) || (vtEmp && vtEmp.isEstagiario);
    const newState = !isCurrentlyEstagiario;
    
    const promises = [];
    if (vaEmp) {
      vaEmp.isEstagiario = newState;
      promises.push(SheetsAPI.updateVARow(vaEmp.rowIndex, vaEmp));
    }
    if (vtEmp) {
      vtEmp.isEstagiario = newState;
      promises.push(SheetsAPI.updateVTRow(vtEmp.rowIndex, vtEmp));
    }
    
    // Atualização otimista
    this._refresh();
    
    Promise.all(promises).then(() => {
      App.toast('Status de estagiário atualizado!', 'success');
    }).catch((e) => {
      console.error(e);
      App.toast('Erro ao alterar status de estagiário.', 'error');
      // Reverter
      if (vaEmp) vaEmp.isEstagiario = !newState;
      if (vtEmp) vtEmp.isEstagiario = !newState;
      this._refresh();
    });
  },

  async _handlePause(cpf) {
    if (!cpf) return;
    
    const vaEmp = AppState.vaData.find(e => Utils.cleanCPF(e.cpf) === cpf);
    const vtEmp = AppState.vtData.find(e => Utils.cleanCPF(e.cpf) === cpf);
    
    if (!vaEmp && !vtEmp) return;
    
    // Define the new paused state based on the current state (if either is paused, we unpause, else we pause)
    const isCurrentlyPaused = (vaEmp && vaEmp.paused) || (vtEmp && vtEmp.paused);
    const newPausedState = !isCurrentlyPaused;
    
    const promises = [];
    if (vaEmp) {
      vaEmp.paused = newPausedState;
      promises.push(SheetsAPI.updateVARow(vaEmp.rowIndex, vaEmp));
    }
    if (vtEmp) {
      vtEmp.paused = newPausedState;
      promises.push(SheetsAPI.updateVTRow(vtEmp.rowIndex, vtEmp));
    }
    
    // Atualização otimista da interface
    this._refresh();
    
    Promise.all(promises).then(() => {
    }).catch((e) => {
      console.error(e);
      App.toast(e.message || 'Erro ao alterar status do funcionário.', 'error');
      // Reverter estado otimista em caso de falha
      if (vaEmp) vaEmp.paused = !newPausedState;
      if (vtEmp) vtEmp.paused = !newPausedState;
      this._refresh();
    });
  },

  _updateBulkDeleteBtn() {
    const checked = document.querySelectorAll('.func-row-chk:checked');
    const btn = document.getElementById('func-bulk-delete-btn');
    const countEl = document.getElementById('func-bulk-count');
    if (btn) btn.style.display = checked.length > 0 ? 'inline-flex' : 'none';
    if (countEl) countEl.textContent = checked.length;
    const all = document.querySelectorAll('.func-row-chk');
    const selectAll = document.getElementById('func-select-all');
    if (selectAll) {
      selectAll.indeterminate = checked.length > 0 && checked.length < all.length;
      selectAll.checked = all.length > 0 && checked.length === all.length;
    }
  },

  async _handleBulkDelete(btn) {
    const checked = [...document.querySelectorAll('.func-row-chk:checked')];
    if (checked.length === 0) return;

    const cleanCpfs = checked.map(c => c.dataset.cpf);
    const allEmployees = this._getConsolidatedEmployees();
    const toDelete = allEmployees.filter(e => cleanCpfs.includes(e.cleanCpf));
    if (toDelete.length === 0) return;

    const nameList = toDelete.map(e => {
      const tags = [];
      if (e.hasVA) tags.push('VA');
      if (e.hasVT) tags.push('VT');
      return `<li>${Utils.escapeHtml(e.name)} <span style="color:var(--text-muted);font-size:11px;">(${tags.join(' + ')})</span></li>`;
    }).join('');

    App.showModal('Confirmar Exclusão em Massa', `
      <div style="text-align:center;padding:12px 0 0;">
        <div style="font-size:40px;margin-bottom:12px;">⚠️</div>
        <p style="font-size:14px;color:var(--text-primary);margin-bottom:12px;">
          Você está prestes a remover <strong>${toDelete.length} funcionário(s)</strong> do sistema:
        </p>
        <ul style="text-align:left;font-size:13px;color:var(--text-secondary);max-height:180px;overflow-y:auto;padding-left:20px;">
          ${nameList}
        </ul>
        <p style="font-size:12px;color:var(--error);margin-top:12px;font-weight:600;">
          ⚠️ Funcionários com VA e VT serão excluídos de ambas as planilhas!
        </p>
      </div>
    `, [
      { label: 'Cancelar', class: 'btn btn-outline', action: () => App.closeModal() },
      { label: `Remover ${toDelete.length}`, class: 'btn btn-bulk-delete', action: async (e) => {
        const confirmBtn = e.currentTarget;
        confirmBtn.disabled = true;
        
        const totalOps = toDelete.filter(e => e.hasVA && e.vaRowIndex).length + toDelete.filter(e => e.hasVT && e.vtRowIndex).length;
        let completedOps = 0;
        
        const updateProgress = () => {
          completedOps++;
          confirmBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;animation:spin 1s linear infinite;"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Removendo ${completedOps}/${totalOps}...`;
        };
        
        confirmBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;animation:spin 1s linear infinite;"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Removendo 0/${totalOps}...`;

        try {
          // Coleta os rowIndexes de VA e VT separadamente
          const vaRowIndexes = toDelete.filter(e => e.hasVA && e.vaRowIndex).map(e => e.vaRowIndex);
          const vtRowIndexes = toDelete.filter(e => e.hasVT && e.vtRowIndex).map(e => e.vtRowIndex);

          // Exclui VA sequencialmente (de baixo para cima)
          if (vaRowIndexes.length > 0) {
            await SheetsAPI.batchDeleteRows('Vale Alimentação', vaRowIndexes, updateProgress);
          }
          // Depois exclui VT sequencialmente (de baixo para cima)
          if (vtRowIndexes.length > 0) {
            await SheetsAPI.batchDeleteRows('Vale Transporte', vtRowIndexes, updateProgress);
          }

          // Recarrega dados reais da planilha para garantir consistência
          confirmBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;animation:spin 1s linear infinite;"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Sincronizando...`;
          await SheetsAPI.loadAllData();

          App.closeModal();
          App.toast(`${toDelete.length} funcionário(s) removido(s) do sistema!`, 'success');
        } catch (err) {
          App.closeModal();
          App.toast('Erro ao remover funcionários: ' + err.message, 'error');
        }
        App._updateBadges();
        this._refresh();
      }},
    ]);
  },

  _refresh() {
    const employees = this._getConsolidatedEmployees();
    const filtered = this._applyFilters(employees);
    const tbody = document.getElementById('func-tbody');
    if (tbody) tbody.innerHTML = this._renderRows(filtered);
    // Atualiza rodapé
    const footer = document.querySelector('.table-footer span');
    if (footer) footer.textContent = `${filtered.length} funcionário${filtered.length !== 1 ? 's' : ''}`;
    // Re-bind checkboxes e botões de ação
    this._bindCheckboxEvents();
    this._bindActionEvents();
    // Reset bulk delete button
    this._updateBulkDeleteBtn();
  },

  destroy() {
    this.searchTerm = '';
    this.filterType = 'all';
  },
};
