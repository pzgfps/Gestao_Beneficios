/* ===================================================
   VALE ALIMENTAÇÃO MODULE
   Tabela, busca, CRUD e sincronização
   =================================================== */

const VAModule = {
  searchTerm: '',

  render(container) {
    const data = this._getFilteredData();
    const total = data.reduce((sum, e) => sum + e.totalValue, 0);

    container.innerHTML = `
      <!-- Toolbar -->
      <div class="toolbar">
        <div class="toolbar-left">
          <div class="search-box">
            ${ICONS.search}
            <input type="text" class="search-input" id="va-search"
              placeholder="Buscar por nome ou CPF..." value="${Utils.escapeHtml(this.searchTerm)}">
          </div>
        </div>
        <div class="toolbar-right" id="va-toolbar-right">
          <button class="btn btn-gray" id="va-reset-btn" title="Restaurar valores padrão das configurações">
            <span class="nav-icon">${ICONS.reset}</span> Reiniciar
          </button>
          <label class="btn btn-primary" style="cursor: pointer;">
            <span class="nav-icon">${ICONS.plus}</span> Carregar Planilha
            <input type="file" id="va-upload" accept=".xlsx, .xls, .csv" style="display: none;">
          </label>
          <button class="btn btn-bulk-delete" id="va-bulk-delete-btn" style="display:none;">
            ${ICONS.trash} <span id="va-bulk-count">0</span> Selecionados
          </button>
          <button class="btn btn-va" id="va-add-btn">
            ${ICONS.plus} Novo Funcionário
          </button>
        </div>
      </div>

      <!-- Tabela -->
      <div class="card">
        <div class="table-wrapper va-table-wrapper" id="va-table-wrapper">
          <table class="data-table data-table-spacious" id="va-table">
            <thead>
              <tr>
                <th style="width:36px;text-align:center;">
                  <input type="checkbox" class="row-checkbox" id="va-select-all" title="Marcar todos">
                </th>
                <th class="col-code">#</th>
                <th>Funcionário</th>
                <th class="col-cpf">CPF</th>
                <th class="col-number">Qtd</th>
                <th class="col-currency" style="text-align:right;">Valor Unit.</th>
                <th class="col-currency" style="text-align:right;">Total</th>
                <th style="text-align:center;">Estagiário</th>
                <th class="col-actions" style="text-align:center;">Ações</th>
              </tr>
            </thead>
            <tbody id="va-tbody">
              ${this._renderRows(data)}
            </tbody>
          </table>
        </div>
        <div class="table-footer">
          <span id="va-employee-count">${data.length} funcionário${data.length !== 1 ? 's' : ''}</span>
          <div style="display:flex;gap:16px;align-items:center;">
            <span class="table-total" style="color:var(--va-400);">Total: ${Utils.formatCurrency(total)}</span>
          </div>
        </div>
      </div>
    `;
  },

  _getFilteredData() {
    if (!this.searchTerm) return AppState.vaData;
    const term = this.searchTerm.toLowerCase();
    return AppState.vaData.filter(e =>
      e.name.toLowerCase().includes(term) ||
      e.cpf.includes(term)
    );
  },

  _renderRows(data) {
    if (data.length === 0) {
      return `<tr><td colspan="9" class="text-center text-muted" style="padding:40px;">
        ${this.searchTerm ? 'Nenhum funcionário encontrado.' : 'Nenhum dado carregado.'}
      </td></tr>`;
    }

    return data.map(e => `
      <tr data-row="${e.rowIndex}" data-code="${e.code}">
        <td style="text-align:center;">
          <input type="checkbox" class="row-checkbox va-row-chk" data-row="${e.rowIndex}">
        </td>
        <td class="col-code">${Utils.escapeHtml(e.code)}</td>
        <td class="col-name">
          <input type="text" class="inline-edit-input" data-field="name" value="${Utils.escapeHtml(e.name)}" style="text-transform:uppercase;">
        </td>
        <td class="col-cpf">
          <input type="text" class="inline-edit-input" data-field="cpf" value="${Utils.escapeHtml(Utils.formatCPF(e.cpf))}" maxlength="14">
        </td>
        <td class="col-number">
          <div class="quantity-stepper" style="margin: 0 auto;">
            <button class="stepper-btn minus-btn" data-row="${e.rowIndex}" data-action="minus">-</button>
            <input type="number" class="inline-edit-input stepper-input" data-field="quantity" value="${e.quantity}">
            <button class="stepper-btn plus-btn" data-row="${e.rowIndex}" data-action="plus">+</button>
          </div>
        </td>
        <td class="col-currency">
          <input type="text" class="inline-edit-input text-right" data-field="unitValue" value="${Utils.formatBRNumber(e.unitValue)}">
        </td>
        <td class="col-currency fw-700" style="color:var(--va-400);">
          <input type="text" class="inline-edit-input text-right" data-field="totalValue" value="${Utils.formatBRNumber(e.totalValue)}" style="font-weight:700; color:var(--va-400);">
        </td>
        <td style="text-align:center;">
          <span class="badge" style="${e.isEstagiario ? 'background:var(--vt-600);color:#fff;' : 'background:var(--surface-3);color:var(--text-muted);'}">${e.isEstagiario ? 'SIM' : 'NÃO'}</span>
        </td>
        <td style="text-align:center;">
          <button class="btn-reset-action va-reset-row-btn" data-row="${e.rowIndex}" title="Restaurar valores padrão deste funcionário">
            ${ICONS.reset}
          </button>
        </td>
      </tr>
    `).join('');
  },

  setupEvents() {
    // Busca
    const searchInput = document.getElementById('va-search');
    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce((e) => {
        this.searchTerm = e.target.value;
        const data = this._getFilteredData();
        document.getElementById('va-tbody').innerHTML = this._renderRows(data);
        this._bindRowEvents();
        this._updateTableTotal();
        this._updateSaveButtonState();
      }, 250));
    }

    // Upload de planilha
    const uploadInput = document.getElementById('va-upload');
    if (uploadInput) {
      uploadInput.addEventListener('change', (e) => this._handleUpload(e));
    }

    // Botão Reiniciar
    const resetBtn = document.getElementById('va-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this._showResetConfirm());
    }

    // Botão Adicionar
    const addBtn = document.getElementById('va-add-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this._showAddModal());
    }

    // Select-all
    const selectAll = document.getElementById('va-select-all');
    if (selectAll) {
      selectAll.addEventListener('change', () => {
        document.querySelectorAll('.va-row-chk').forEach(chk => {
          chk.checked = selectAll.checked;
          chk.closest('tr').classList.toggle('row-selected', selectAll.checked);
        });
        this._updateBulkDeleteBtn();
      });
    }

    // Botão excluir selecionados
    const bulkBtn = document.getElementById('va-bulk-delete-btn');
    if (bulkBtn) {
      bulkBtn.addEventListener('click', () => this._handleBulkDelete(bulkBtn));
    }

    this._bindRowEvents();
  },

  _handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (typeof XLSX === 'undefined') {
      App.toast('Biblioteca de Excel ainda carregando, tente novamente.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const newData = this._parseData(json);

        App.showModal('Sincronizando', `
          <div style="text-align:center;padding:20px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:32px;height:32px;animation:spin 1s linear infinite;color:var(--primary);"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
            <h3 style="margin-top:16px;">Sincronizando com a Planilha Unificada...</h3>
            <p id="sync-progress" style="color:var(--text-secondary);margin-top:8px;">Iniciando...</p>
          </div>
        `);

        const progEl = document.getElementById('sync-progress');

        const formattedRows = newData.map(item => [
          item.code,
          item.name,
          item.cpf,
          String(item.quantity || 0),
          item.unitValue,
          item.totalValue,
          item.authorization || '',
          item.paused ? 'PAUSADO' : ''
        ]);

        if (progEl) progEl.innerText = `Salvando ${formattedRows.length} funcionários na planilha...`;
        await SheetsAPI.replaceAllRows('Vale Alimentação', formattedRows);

        if (progEl) progEl.innerText = 'Recarregando dados...';
        await SheetsAPI.loadAllData();
        App.closeModal();
        this._refreshTable();
        App._updateBadges();
        App.toast(`${formattedRows.length} funcionários importados com sucesso!`, 'success');
      } catch (err) {
        App.closeModal();
        console.error('Erro ao sincronizar', err);
        App.toast('Erro ao sincronizar com a planilha unificada: ' + err.message, 'error');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  },

  _parseData(rows) {
    let started = false;
    const result = [];
    const seenCpfs = new Set();
    
    rows.forEach(row => {
      if (!row || !row.length) return;
      
      const col0 = String(row[0] || '').toLowerCase().trim();
      const col1 = String(row[1] || '').toLowerCase().trim();
      
      if (!started) {
        if (col0 === 'código' || col0 === 'codigo' || col1 === 'funcionário' || col1 === 'funcionario') {
          started = true;
        }
        return;
      }
      
      const code = String(row[0] || '');
      const name = String(row[1] || '').trim();
      const cpfRaw = String(row[2] || '').trim();
      const cpf = cpfRaw.replace(/\D/g, '');
      let qty = row[3];
      let unit = row[4];
      let total = row[5];
      
      if (!name || !cpf) return;
      if (seenCpfs.has(cpf)) return;
      seenCpfs.add(cpf);
      
      const parseMoney = (val) => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        const s = String(val).replace('R$', '').trim().replace(/\\./g, '').replace(',', '.');
        return parseFloat(s) || 0;
      };
      
      const parseQty = (val) => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        return parseInt(String(val).trim(), 10) || 0;
      };

      const finalQty = parseQty(qty);
      const finalUnit = parseMoney(unit);
      const finalTotal = parseMoney(total) || (finalQty * finalUnit);

      result.push({
        name: name,
        cpf: cpf,
        quantity: finalQty,
        unitValue: finalUnit,
        totalValue: finalTotal
      });
    });

    result.sort((a, b) => a.name.localeCompare(b.name));
    
    let seqCode = 1;
    result.forEach(item => {
      item.code = String(seqCode++);
    });

    return result;
  },

  _refreshTable() {
    const data = this._getFilteredData();
    const tbody = document.getElementById('va-tbody');
    if (tbody) {
      tbody.innerHTML = this._renderRows(data);
      this._bindRowEvents();
      this._updateTableTotal();
      this._updateBulkDeleteBtn();
      
      const countEl = document.getElementById('va-employee-count');
      if (countEl) countEl.innerText = `${data.length} funcionário${data.length !== 1 ? 's' : ''}`;
    }
  },

  _bindRowEvents() {
    // Deletar individual
    document.querySelectorAll('.va-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const rowIndex = parseInt(e.currentTarget.dataset.row);
        const employee = AppState.vaData.find(emp => emp.rowIndex === rowIndex);
        if (employee) this._showDeleteConfirm(employee);
      });
    });

    // Reiniciar individual
    document.querySelectorAll('.va-reset-row-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const rowIndex = parseInt(e.currentTarget.dataset.row);
        const tr = e.currentTarget.closest('tr');
        const employee = AppState.vaData.find(emp => emp.rowIndex === rowIndex);
        if (employee) {
          await this._handleResetSingle(employee, tr);
        }
      });
    });

    // Checkboxes individuais
    document.querySelectorAll('.va-row-chk').forEach(chk => {
      chk.addEventListener('change', () => {
        chk.closest('tr').classList.toggle('row-selected', chk.checked);
        this._updateBulkDeleteBtn();
      });
    });

    // Edição inline
    document.querySelectorAll('#va-tbody .inline-edit-input').forEach(input => {
      // Salva o valor original ao focar
      input.addEventListener('focus', (e) => {
        e.target.dataset.original = e.target.value;
      });

      // Salva ao pressionar Enter
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.target.blur();
        }
      });

      if (input.dataset.field === 'cpf') {
        Utils.applyCPFMask(input);
      }

      // Valida e salva no blur
      input.addEventListener('blur', (e) => {
        this._handleInlineEdit(e.target);
      });
    });

    // Botões de Stepper (+ / -)
    document.querySelectorAll('#va-tbody .stepper-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const action = e.currentTarget.dataset.action;
        const rowIndex = parseInt(e.currentTarget.dataset.row);
        const tr = e.currentTarget.closest('tr');
        const input = tr.querySelector('.stepper-input');
        
        const employee = AppState.vaData.find(emp => emp.rowIndex === rowIndex);
        if (!employee) return;

        let currentVal = parseInt(input.value) || employee.quantity;
        let newVal = action === 'plus' ? currentVal + 1 : currentVal - 1;

        if (newVal <= 0) {
          App.toast('A quantidade deve ser maior que 0', 'error');
          return;
        }

        input.dataset.original = currentVal.toString();
        input.value = newVal;
        await this._handleInlineEdit(input);
      });
    });
  },

  async _handleInlineEdit(input) {
    const field = input.dataset.field;
    const value = input.value.trim();
    const originalValue = input.dataset.original;
    const tr = input.closest('tr');
    const rowIndex = parseInt(tr.dataset.row);

    if (value === originalValue) return;

    const employee = AppState.vaData.find(e => e.rowIndex === rowIndex);
    if (!employee) return;

    let validatedValue = value;
    if (field === 'name') {
      validatedValue = value.toUpperCase();
      if (!validatedValue) {
        App.toast('O nome não pode ser vazio', 'error');
        input.value = originalValue;
        return;
      }
      const normalizeName = (n) => (n || '').trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const normNewName = normalizeName(validatedValue);
      const hasDuplicateName = AppState.vaData.some(e => e.rowIndex !== rowIndex && normalizeName(e.name) === normNewName);
      if (hasDuplicateName) {
        App.toast('Este nome já está cadastrado para outro funcionário.', 'error');
        input.value = originalValue;
        return;
      }
    } else if (field === 'cpf') {
      const cleanCpf = Utils.cleanCPF(value);
      if (cleanCpf.length !== 11 || !Utils.isValidCPF(cleanCpf)) {
        App.toast('CPF inválido. Deve possuir 11 dígitos.', 'error');
        input.value = originalValue;
        return;
      }
      // Check for duplicate CPF in the active sheet
      const hasDuplicate = AppState.vaData.some(e => e.rowIndex !== rowIndex && Utils.cleanCPF(e.cpf) === cleanCpf);
      if (hasDuplicate) {
        App.toast('Este CPF já está cadastrado para outro funcionário.', 'error');
        input.value = originalValue;
        return;
      }
      validatedValue = cleanCpf;
      input.value = Utils.formatCPF(cleanCpf);
    } else if (field === 'quantity') {
      validatedValue = parseInt(value);
      if (isNaN(validatedValue) || validatedValue <= 0) {
        App.toast('A quantidade deve ser um número inteiro maior que 0', 'error');
        input.value = originalValue;
        return;
      }
      input.value = validatedValue;
    } else if (field === 'unitValue' || field === 'totalValue') {
      validatedValue = Utils.parseBRNumber(value);
      if (isNaN(validatedValue) || validatedValue < 0) {
        App.toast('O valor deve ser um número válido', 'error');
        input.value = originalValue;
        return;
      }
      input.value = Utils.formatBRNumber(validatedValue);
    }

    // Atualiza localmente
    employee[field] = validatedValue;
    
    if (field !== 'totalValue') {
      // Regra de arredondamento: sempre arredonda para cima
      let calculatedTotal = Math.ceil(employee.quantity * employee.unitValue);
      employee.totalValue = calculatedTotal;
    }

    const totalInput = tr.querySelector('.inline-edit-input[data-field="totalValue"]');
    if (totalInput) {
      totalInput.value = Utils.formatBRNumber(employee.totalValue);
      if (field !== 'totalValue') {
        totalInput.dataset.original = totalInput.value;
      }
    }
    this._updateTableTotal();
    input.dataset.original = input.value;
    
    input.style.backgroundColor = 'var(--bg-hover)';

    const applyEdit = async (updateBoth) => {
      try {
        await SheetsAPI.updateVARow(employee.rowIndex, employee);
        if (updateBoth) {
          const oldCleanCpf = field === 'cpf' ? Utils.cleanCPF(originalValue) : Utils.cleanCPF(employee.cpf);
          const otherEmployee = AppState.vtData.find(e => Utils.cleanCPF(e.cpf) === oldCleanCpf);
          if (otherEmployee) {
             otherEmployee[field] = validatedValue;
             await SheetsAPI.updateVTRow(otherEmployee.rowIndex, otherEmployee);
             App.toast('Alteração aplicada também no Vale Transporte.', 'success');
          }
        }
      } catch (error) {
        App.toast('Erro ao salvar na planilha: ' + error.message, 'error');
      } finally {
        input.style.backgroundColor = '';
      }
    };

    // Se mudou nome ou CPF e o funcionário também tem VT, pergunta se deseja aplicar em ambas as abas
    if (field === 'name' || field === 'cpf') {
      const oldCleanCpf = field === 'cpf' ? Utils.cleanCPF(originalValue) : Utils.cleanCPF(employee.cpf);
      const hasBoth = AppState.vtData.some(e => Utils.cleanCPF(e.cpf) === oldCleanCpf);

      if (hasBoth) {
        App.showModal('Atualizar em ambas as abas?', `
          <div style="text-align:center;padding:10px 0;">
            <p style="font-size:14px;color:var(--text-primary);margin-bottom:8px;">
              Este funcionário também está cadastrado no <strong>Vale Transporte</strong>.
            </p>
            <p style="font-size:13px;color:var(--text-muted);">
              Deseja aplicar essa alteração de ${field === 'name' ? 'nome' : 'CPF'} também na aba de VT?
            </p>
          </div>
        `, [
          { label: 'Não', class: 'btn btn-outline', action: () => { App.closeModal(); applyEdit(false); } },
          { label: 'Sim, atualizar', class: 'btn', style: 'background:var(--primary);color:#fff;', action: () => { 
              App.closeModal();
              applyEdit(true);
          } }
        ]);
      } else {
        applyEdit(false);
      }
    } else {
      applyEdit(false);
    }
  },



  _updateTableTotal() {
    const data = this._getFilteredData();
    const total = data.reduce((sum, e) => sum + e.totalValue, 0);
    const totalEl = document.querySelector('#content-area .table-total');
    if (totalEl) {
      totalEl.textContent = `Total: ${Utils.formatCurrency(total)}`;
    }
  },

  _showAddModal() {
    const nextCode = AppState.vaData.length > 0
      ? Math.max(...AppState.vaData.map(e => parseInt(e.code) || 0)) + 1
      : 1;

    App.showModal('Novo Funcionário — VA', `
      <div class="form-group">
        <label class="form-label">Nome Completo</label>
        <input type="text" class="form-input" id="modal-name" list="employee-list" placeholder="Nome do funcionário" style="text-transform:uppercase;">
        <datalist id="employee-list">
          ${Array.from(new Set([...AppState.vaData, ...AppState.vtData].map(e => Utils.escapeHtml(e.name)))).map(name => `<option value="${name}">`).join('')}
        </datalist>
      </div>
      <div class="form-group">
        <label class="form-label">CPF</label>
        <input type="text" class="form-input" id="modal-cpf" placeholder="000.000.000-00" maxlength="14">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Quantidade (dias)</label>
          <input type="number" class="form-input" id="modal-qty" value="${CONFIG.DEFAULTS.VA_QUANTITY}">
        </div>
        <div class="form-group">
          <label class="form-label">Valor Unitário (R$)</label>
          <input type="number" class="form-input" id="modal-unit" step="0.01" value="${CONFIG.DEFAULTS.VA_UNIT_VALUE}">
        </div>
      </div>
    `, [
      { label: 'Cancelar', class: 'btn btn-outline', action: () => App.closeModal() },
      { label: 'Adicionar', class: 'btn btn-va', action: (e) => this._handleAdd(nextCode, e) },
    ]);

    // Autocomplete CPF when name is selected (only if name is unique)
    const nameInput = document.getElementById('modal-name');
    const cpfInput = document.getElementById('modal-cpf');
    if (nameInput && cpfInput) {
      // Máscara de CPF no modal
      Utils.applyCPFMask(cpfInput);

      nameInput.addEventListener('input', () => {
        const val = nameInput.value.trim().toUpperCase();
        const matches = [...AppState.vaData, ...AppState.vtData].filter(e => e.name.toUpperCase() === val);
        if (matches.length === 1 && matches[0].cpf && !cpfInput.value) {
          cpfInput.value = Utils.formatCPF(matches[0].cpf);
        }
      });

      // Autocomplete name when CPF is entered/pasted (unique lookup)
      cpfInput.addEventListener('input', () => {
        const val = Utils.cleanCPF(cpfInput.value);
        if (val.length === 11) {
          const match = [...AppState.vaData, ...AppState.vtData].find(e => Utils.cleanCPF(e.cpf) === val);
          if (match && !nameInput.value) {
            nameInput.value = match.name;
          }
        }
      });
    }
  },

  async _handleAdd(code, e) {
    const btn = e ? e.currentTarget : null;
    const originalContent = btn ? btn.innerHTML : '';

    const nameInput = document.getElementById('modal-name');
    const cpfInput = document.getElementById('modal-cpf');
    const name = nameInput.value.trim().toUpperCase();
    const cpf = cpfInput.value.trim();
    const qty = parseInt(document.getElementById('modal-qty').value) || CONFIG.DEFAULTS.VA_QUANTITY;
    const unit = parseFloat(document.getElementById('modal-unit').value) || CONFIG.DEFAULTS.VA_UNIT_VALUE;

    if (!name) return App.toast('Informe o nome do funcionário', 'error');
    if (!cpf) return App.toast('Informe o CPF', 'error');

    const cleanCpf = Utils.cleanCPF(cpf);
    if (cleanCpf.length !== 11 || !Utils.isValidCPF(cleanCpf)) {
      return App.toast('CPF inválido. Deve possuir 11 dígitos.', 'error');
    }

    const normalizeName = (n) => (n || '').trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const normName = normalizeName(name);

    const hasDuplicate = AppState.vaData.some(e => Utils.cleanCPF(e.cpf) === cleanCpf || normalizeName(e.name) === normName);
    if (hasDuplicate) {
      return App.toast('Este funcionário (CPF ou Nome) já está cadastrado no Vale Alimentação.', 'error');
    }

    // Regra de arredondamento: sempre arredonda para cima
    let calculatedTotal = Math.ceil(qty * unit);

    const data = {
      code: code.toString(),
      name,
      cpf,
      quantity: qty,
      unitValue: unit,
      totalValue: calculatedTotal,
      authorization: '',
    };

    try {
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;animation:spin 1s linear infinite;"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Adicionando...`;
      }
      
      App.toast('Adicionando na planilha...', 'info');
      await SheetsAPI.appendVARow(data);
      App.closeModal();
      App.toast('Funcionário adicionado com sucesso!', 'success');

      // Optimistic update — add to local state immediately so badge updates now
      AppState.vaData.push({ ...data, rowIndex: Date.now() });
      AppState.vaData.sort((a, b) => a.name.localeCompare(b.name));
      App._updateBadges();

      await SheetsAPI.loadAllData();
      App.navigateTo('vale-alimentacao');
    } catch (error) {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalContent;
      }
      App.toast('Erro ao adicionar: ' + error.message, 'error');
    }
  },


  _updateBulkDeleteBtn() {
    const checked = document.querySelectorAll('.va-row-chk:checked');
    const btn = document.getElementById('va-bulk-delete-btn');
    const countEl = document.getElementById('va-bulk-count');
    if (btn) btn.style.display = checked.length > 0 ? 'inline-flex' : 'none';
    if (countEl) countEl.textContent = checked.length;
    // Update select-all indeterminate state
    const all = document.querySelectorAll('.va-row-chk');
    const selectAll = document.getElementById('va-select-all');
    if (selectAll) {
      selectAll.indeterminate = checked.length > 0 && checked.length < all.length;
      selectAll.checked = all.length > 0 && checked.length === all.length;
    }
  },

  async _handleBulkDelete(btn) {
    const checked = [...document.querySelectorAll('.va-row-chk:checked')];
    if (checked.length === 0) return;
    const rowIndexes = checked.map(c => parseInt(c.dataset.row));
    const employees = rowIndexes.map(ri => AppState.vaData.find(e => e.rowIndex === ri)).filter(Boolean);
    if (employees.length === 0) return;

    const nameList = employees.map(e => `<li>${Utils.escapeHtml(e.name)}</li>`).join('');
    App.showModal('Confirmar Exclusão em Massa', `
      <div style="text-align:center;padding:12px 0 0;">
        <div style="font-size:40px;margin-bottom:12px;">⚠️</div>
        <p style="font-size:14px;color:var(--text-primary);margin-bottom:12px;">
          Você está prestes a remover <strong>${employees.length} funcionário(s)</strong> do Vale Alimentação:
        </p>
        <ul style="text-align:left;font-size:13px;color:var(--text-secondary);max-height:180px;overflow-y:auto;padding-left:20px;">
          ${nameList}
        </ul>
        <p style="font-size:12px;color:var(--text-muted);margin-top:12px;">Esta ação não pode ser desfeita.</p>
      </div>
    `, [
      { label: 'Cancelar', class: 'btn btn-outline', action: () => App.closeModal() },
      { label: `Remover ${employees.length}`, class: 'btn btn-bulk-delete', action: async (e) => {
        const confirmBtn = e.currentTarget;
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;animation:spin 1s linear infinite;"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Removendo 0/${employees.length}...`;

        try {
          const rowIndexes = employees.map(emp => emp.rowIndex);
          await SheetsAPI.batchDeleteRows('Vale Alimentação', rowIndexes, (current, total) => {
            confirmBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;animation:spin 1s linear infinite;"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Removendo ${current}/${total}...`;
          });
          
          // Recarrega dados reais da planilha para garantir consistência
          confirmBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;animation:spin 1s linear infinite;"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Sincronizando...`;
          await SheetsAPI.loadAllData();
          
          App.closeModal();
          App.toast(`${employees.length} funcionário(s) removido(s) do VA!`, 'success');
        } catch (err) {
          App.closeModal();
          App.toast('Erro ao remover funcionários: ' + err.message, 'error');
        }
        App._updateBadges();
        this._refreshTable();
      }},
    ]);
  },

  _showDeleteConfirm(employee) {
    App.showModal('Confirmar Exclusão', `
      <div style="text-align:center;padding:20px 0;">
        <div style="font-size:48px;margin-bottom:16px;">⚠️</div>
        <p style="font-size:15px;color:var(--text-primary);margin-bottom:8px;">
          Tem certeza que deseja remover <strong>${Utils.escapeHtml(employee.name)}</strong>?
        </p>
        <p style="font-size:13px;color:var(--text-muted);">
          Esta ação irá remover o funcionário do sistema e atualizar as planilhas do Google Sheets.
        </p>
      </div>
    `, [
      { label: 'Cancelar', class: 'btn btn-outline', action: () => App.closeModal() },
      { label: 'Remover', class: 'btn btn-sm', style: 'background:var(--error);color:#fff;', action: (e) => this._handleDelete(employee, e) },
    ]);
  },

  async _handleDelete(employee, e) {
    const btn = e ? e.currentTarget : null;
    const originalContent = btn ? btn.innerHTML : '';
    
    const tr = document.querySelector(`#va-tbody tr[data-row="${employee.rowIndex}"]`);
    if (tr) {
      tr.style.opacity = '0.5';
      tr.style.pointerEvents = 'none';
    }
    
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;animation:spin 1s linear infinite;"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Removendo...`;
    }

    try {
      App.toast('Removendo da planilha...', 'info');
      await SheetsAPI.deleteVARow(employee.rowIndex);
      App.closeModal();
      
      AppState.vaData = AppState.vaData.filter(e => e.rowIndex !== employee.rowIndex);
      App._updateBadges();
      this._refreshTable();
      App.toast('Funcionário removido com sucesso!', 'success');
    } catch (error) {
      if (tr) {
        tr.style.opacity = '1';
        tr.style.pointerEvents = 'auto';
      }
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalContent;
      }
      App.toast('Erro ao remover: ' + error.message, 'error');
    }
  },

  _showResetConfirm() {
    const checked = [...document.querySelectorAll('.va-row-chk:checked')];
    const defaultQty = parseInt(AppState.config.vaQuantity) || CONFIG.DEFAULTS.VA_QUANTITY;
    const defaultUnit = parseFloat(AppState.config.vaUnitValue) || CONFIG.DEFAULTS.VA_UNIT_VALUE;
    const defaultTotal = Math.ceil(defaultQty * defaultUnit);

    let targetEmployees = [];
    let title = '';
    let message = '';

    if (checked.length > 0) {
      const rowIndexes = new Set(checked.map(c => parseInt(c.dataset.row)));
      targetEmployees = AppState.vaData.filter(e => rowIndexes.has(e.rowIndex));
      title = `Reiniciar ${targetEmployees.length} Funcionário(s)`;
      message = `Deseja restaurar os valores de <strong>${targetEmployees.length} funcionário(s) selecionado(s)</strong> para os valores padrão?`;
    } else {
      targetEmployees = this._getFilteredData();
      if (targetEmployees.length === 0) {
        App.toast('Nenhum funcionário cadastrado para reiniciar.', 'warning');
        return;
      }
      title = 'Reiniciar Todos os Funcionários';
      message = `Deseja restaurar os valores de <strong>todos os ${targetEmployees.length} funcionários</strong> do Vale Alimentação para os valores padrão?`;
    }

    App.showModal(title, `
      <div style="text-align:center;padding:12px 0;">
        <div style="font-size:36px;margin-bottom:12px;">🔄</div>
        <p style="font-size:14px;color:var(--text-primary);margin-bottom:16px;">
          ${message}
        </p>
        <div style="background:var(--bg-card);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:14px;display:inline-block;text-align:left;font-size:13px;line-height:1.8;">
          <div><strong>Quantidade Padrão:</strong> ${defaultQty} dias</div>
          <div><strong>Valor Unitário Padrão:</strong> R$ ${Utils.formatBRNumber(defaultUnit)}</div>
          <div><strong>Total Calculado:</strong> <span style="color:var(--va-400);font-weight:700;">R$ ${Utils.formatBRNumber(defaultTotal)}</span></div>
        </div>
      </div>
    `, [
      { label: 'Cancelar', class: 'btn btn-outline', action: () => App.closeModal() },
      { label: 'Confirmar Reinício', class: 'btn btn-primary', action: async (e) => {
        const confirmBtn = e.currentTarget;
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;animation:spin 1s linear infinite;"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Reiniciando...`;
        await this._handleReset(targetEmployees);
        App.closeModal();
      }}
    ]);
  },

  async _handleReset(targetEmployees) {
    const defaultQty = parseInt(AppState.config.vaQuantity) || CONFIG.DEFAULTS.VA_QUANTITY;
    const defaultUnit = parseFloat(AppState.config.vaUnitValue) || CONFIG.DEFAULTS.VA_UNIT_VALUE;
    const defaultTotal = Math.ceil(defaultQty * defaultUnit);

    targetEmployees.forEach(emp => {
      emp.quantity = defaultQty;
      emp.unitValue = defaultUnit;
      emp.totalValue = defaultTotal;
    });

    const formattedRows = AppState.vaData.map(item => [
      item.code,
      item.name,
      item.cpf,
      String(item.quantity || 0),
      item.unitValue,
      item.totalValue,
      item.authorization || '',
      item.paused ? 'PAUSADO' : ''
    ]);

    try {
      await SheetsAPI.replaceAllRows('Vale Alimentação', formattedRows);
      App.toast(`${targetEmployees.length} funcionário(s) reiniciado(s) com sucesso!`, 'success');
    } catch (err) {
      App.toast('Erro ao salvar na planilha: ' + err.message, 'error');
    }

    this._refreshTable();
    App._updateBadges();
  },

  async _handleResetSingle(employee, tr) {
    const defaultQty = parseInt(AppState.config.vaQuantity) || CONFIG.DEFAULTS.VA_QUANTITY;
    const defaultUnit = parseFloat(AppState.config.vaUnitValue) || CONFIG.DEFAULTS.VA_UNIT_VALUE;
    const defaultTotal = Math.ceil(defaultQty * defaultUnit);

    employee.quantity = defaultQty;
    employee.unitValue = defaultUnit;
    employee.totalValue = defaultTotal;

    const qtyInput = tr ? tr.querySelector('.inline-edit-input[data-field="quantity"]') : null;
    const unitInput = tr ? tr.querySelector('.inline-edit-input[data-field="unitValue"]') : null;
    const totalInput = tr ? tr.querySelector('.inline-edit-input[data-field="totalValue"]') : null;
    if (qtyInput) qtyInput.value = defaultQty;
    if (unitInput) unitInput.value = Utils.formatBRNumber(defaultUnit);
    if (totalInput) totalInput.value = Utils.formatBRNumber(defaultTotal);
    this._updateTableTotal();

    try {
      await SheetsAPI.updateVARow(employee.rowIndex, employee);
      App.toast(`Valores de ${employee.name} reiniciados para o padrão!`, 'success');
    } catch (err) {
      App.toast('Erro ao salvar na planilha: ' + err.message, 'error');
    }
  },

  destroy() {
    this.searchTerm = '';
  },
};
